import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Webhook token validation
    const webhookToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
    const receivedToken = req.headers.get("asaas-access-token");

    if (webhookToken && receivedToken !== webhookToken) {
      console.error("Invalid webhook token");
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { event, payment: paymentData } = body;

    console.log(`Asaas webhook received: ${event}`, JSON.stringify(body).substring(0, 500));

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Handle payment events
    if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
      const asaasPaymentId = paymentData?.id;
      if (!asaasPaymentId) {
        return new Response(JSON.stringify({ error: "No payment id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update payments table
      const { data: paymentRecord } = await adminClient
        .from("payments")
        .update({ status: "confirmed", updated_at: new Date().toISOString() })
        .eq("asaas_payment_id", asaasPaymentId)
        .select("submission_id, user_id, type, asaas_subscription_id")
        .single();

      if (paymentRecord) {
        // One-time payment: unlock test result
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

          // Audit log
          await adminClient.rpc("log_audit_event", {
            _action: "payment_confirmed",
            _entity_type: "test_submission",
            _entity_id: paymentRecord.submission_id,
            _metadata: { asaas_payment_id: asaasPaymentId, type: "one_time" },
          });
        }

        // Subscription payment
        if (paymentRecord.type === "subscription" && paymentRecord.user_id) {
          // Get the plan from the subscription metadata
          const { data: fullPayment } = await adminClient
            .from("payments")
            .select("metadata")
            .eq("asaas_payment_id", asaasPaymentId)
            .single();

          const planSlug = (fullPayment?.metadata as Record<string, unknown>)?.plan_slug as string || "professional";

          await adminClient
            .from("profiles")
            .update({
              subscription_status: "active",
              subscription_plan: planSlug,
            })
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

    // Handle subscription events
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
