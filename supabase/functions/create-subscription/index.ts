import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const { planSlug } = await req.json();

    if (!planSlug) {
      return new Response(JSON.stringify({ error: "planSlug is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get plan details
    const { data: plan, error: planError } = await adminClient
      .from("subscription_plans")
      .select("*")
      .eq("slug", planSlug)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: "Plan not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already subscribed
    const { data: profile } = await adminClient
      .from("profiles")
      .select("asaas_customer_id, full_name, email, subscription_status")
      .eq("id", userId)
      .single();

    if (profile?.subscription_status === "active") {
      return new Response(JSON.stringify({ error: "Already subscribed", alreadySubscribed: true }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    const ASAAS_BASE_URL = Deno.env.get("ASAAS_ENV") === "production"
      ? "https://api.asaas.com/v3"
      : "https://sandbox.asaas.com/api/v3";

    if (!ASAAS_API_KEY) {
      return new Response(JSON.stringify({ error: "Payment gateway not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let asaasCustomerId = profile?.asaas_customer_id;

    if (!asaasCustomerId) {
      const customerRes = await fetch(`${ASAAS_BASE_URL}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          access_token: ASAAS_API_KEY,
        },
        body: JSON.stringify({
          name: profile?.full_name || "Usuário",
          email: profile?.email || "",
          externalReference: userId,
        }),
      });

      const customer = await customerRes.json();
      if (!customerRes.ok) {
        return new Response(JSON.stringify({ error: "Failed to create customer", details: customer }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      asaasCustomerId = customer.id;
      await adminClient.from("profiles").update({ asaas_customer_id: asaasCustomerId }).eq("id", userId);
    }

    // Create subscription in Asaas
    const cycle = plan.interval === "yearly" ? "YEARLY" : "MONTHLY";
    const subscriptionRes = await fetch(`${ASAAS_BASE_URL}/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: ASAAS_API_KEY,
      },
      body: JSON.stringify({
        customer: asaasCustomerId,
        billingType: "UNDEFINED",
        value: plan.price,
        cycle,
        nextDueDate: new Date().toISOString().split("T")[0],
        description: `Assinatura ${plan.name} - Sozo`,
        externalReference: JSON.stringify({ userId, planSlug }),
      }),
    });

    const subscription = await subscriptionRes.json();
    if (!subscriptionRes.ok) {
      return new Response(JSON.stringify({ error: "Failed to create subscription", details: subscription }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save payment record
    await adminClient.from("payments").insert({
      user_id: userId,
      type: "subscription",
      amount: plan.price,
      status: "pending",
      asaas_subscription_id: subscription.id,
      metadata: { plan_slug: planSlug, plan_name: plan.name },
    });

    // Update profile subscription status
    await adminClient
      .from("profiles")
      .update({ subscription_plan: planSlug, subscription_status: "pending" })
      .eq("id", userId);

    return new Response(
      JSON.stringify({
        subscriptionId: subscription.id,
        invoiceUrl: subscription.invoiceUrl || subscription.paymentLink,
        planName: plan.name,
        value: plan.price,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
