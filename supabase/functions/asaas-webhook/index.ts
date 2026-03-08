import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, errorResponse, jsonResponse } from "../_shared/security.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ─── Webhook Token Validation (MANDATORY) ───
    const webhookToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
    const receivedToken = req.headers.get("asaas-access-token");

    if (!webhookToken) {
      console.error("ASAAS_WEBHOOK_TOKEN not configured");
      return errorResponse(corsHeaders, 503, "Serviço indisponível.");
    }

    if (!receivedToken || receivedToken !== webhookToken) {
      console.error("Invalid webhook token");
      return errorResponse(corsHeaders, 403, "Acesso negado.");
    }

    const body = await req.json();
    const { event, payment: paymentData } = body;

    if (!event || typeof event !== "string") {
      return errorResponse(corsHeaders, 400, "Payload inválido.");
    }

    console.log(`Asaas webhook: ${event}`);

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
      const asaasPaymentId = paymentData?.id;
      if (!asaasPaymentId || typeof asaasPaymentId !== "string") {
        return errorResponse(corsHeaders, 400, "ID de pagamento ausente.");
      }

      // Verify payment exists in our DB before updating
      const { data: existingPayment } = await adminClient
        .from("payments")
        .select("id, status")
        .eq("asaas_payment_id", asaasPaymentId)
        .single();

      if (!existingPayment) {
        console.error("Payment not found in DB:", asaasPaymentId);
        return errorResponse(corsHeaders, 404, "Pagamento não encontrado.");
      }

      const { data: paymentRecord } = await adminClient
        .from("payments")
        .update({ status: "confirmed", updated_at: new Date().toISOString() })
        .eq("asaas_payment_id", asaasPaymentId)
        .select("submission_id, user_id, type, asaas_subscription_id")
        .single();

      if (paymentRecord) {
        if (paymentRecord.type === "one_time" && paymentRecord.submission_id) {
          await adminClient
            .from("test_submissions")
            .update({
              paid: true,
              paid_at: new Date().toISOString(),
              payment_status: "confirmed",
              test_result_unlocked: true,
            })
            .eq("id", paymentRecord.submission_id);

          await adminClient.rpc("log_audit_event", {
            _action: "payment_confirmed",
            _entity_type: "test_submission",
            _entity_id: paymentRecord.submission_id,
            _metadata: { asaas_payment_id: asaasPaymentId, type: "one_time" },
          });
        }

        if (paymentRecord.type === "subscription" && paymentRecord.user_id) {
          const { data: fullPayment } = await adminClient
            .from("payments")
            .select("metadata")
            .eq("asaas_payment_id", asaasPaymentId)
            .single();

          const planSlug = (fullPayment?.metadata as Record<string, unknown>)?.plan_slug as string || "professional";

          await adminClient
            .from("profiles")
            .update({ subscription_status: "active", subscription_plan: planSlug })
            .eq("id", paymentRecord.user_id);

          await adminClient.rpc("log_audit_event", {
            _action: "subscription_activated",
            _entity_type: "profile",
            _entity_id: paymentRecord.user_id,
            _metadata: { asaas_payment_id: asaasPaymentId, plan: planSlug },
          });
        }
      }
    }

    if (event === "PAYMENT_OVERDUE" || event === "PAYMENT_DELETED") {
      const asaasPaymentId = paymentData?.id;
      if (asaasPaymentId && typeof asaasPaymentId === "string") {
        const { data: paymentRecord } = await adminClient
          .from("payments")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("asaas_payment_id", asaasPaymentId)
          .select("user_id, type")
          .single();

        if (paymentRecord?.type === "subscription" && paymentRecord.user_id) {
          await adminClient
            .from("profiles")
            .update({ subscription_status: "overdue" })
            .eq("id", paymentRecord.user_id);
        }
      }
    }

    if (event === "PAYMENT_REFUNDED") {
      const asaasPaymentId = paymentData?.id;
      if (asaasPaymentId && typeof asaasPaymentId === "string") {
        const { data: paymentRecord } = await adminClient
          .from("payments")
          .update({ status: "refunded", updated_at: new Date().toISOString() })
          .eq("asaas_payment_id", asaasPaymentId)
          .select("submission_id, type")
          .single();

        if (paymentRecord?.type === "one_time" && paymentRecord.submission_id) {
          await adminClient
            .from("test_submissions")
            .update({ paid: false, test_result_unlocked: false, payment_status: "refunded" })
            .eq("id", paymentRecord.submission_id);
        }
      }
    }

    return jsonResponse(corsHeaders, { received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return errorResponse(corsHeaders, 500, "Erro interno.");
  }
});
