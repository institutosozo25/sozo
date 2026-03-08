import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://sozo.lovable.app",
  "https://id-preview--b9bd0d97-1bb0-4a10-a384-515f12049013.lovable.app",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "content-type",
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Mandatory webhook token validation
    const webhookToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
    const receivedToken = req.headers.get("asaas-access-token");

    if (!webhookToken || receivedToken !== webhookToken) {
      console.error("Invalid or missing webhook token");
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { event, payment: paymentData } = body;

    console.log(`Asaas webhook: ${event}`);

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
      const asaasPaymentId = paymentData?.id;
      if (!asaasPaymentId) {
        return new Response(JSON.stringify({ error: "No payment id" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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
      if (asaasPaymentId) {
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
      if (asaasPaymentId) {
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

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
