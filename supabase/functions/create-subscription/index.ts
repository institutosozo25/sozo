import {
  getCorsHeaders, authenticateRequest, checkUserRateLimit, checkIpRateLimit,
  getAdminClient, logAuditEvent, sanitizeInput, errorResponse, jsonResponse,
} from "../_shared/security.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!checkIpRateLimit(req)) return errorResponse(corsHeaders, 429, "Muitas requisições.");

    const { error: authError, userId } = await authenticateRequest(req);
    if (authError || !userId) return errorResponse(corsHeaders, 401, "Acesso não autorizado.");

    if (!checkUserRateLimit(userId)) return errorResponse(corsHeaders, 429, "Limite de requisições excedido.");

    const body = await req.json();
    const planSlug = sanitizeInput(body.planSlug, 50);

    if (!planSlug || !/^[a-z0-9-]+$/.test(planSlug)) {
      return errorResponse(corsHeaders, 400, "Plano inválido.");
    }

    const adminClient = getAdminClient();

    const { data: plan, error: planError } = await adminClient
      .from("subscription_plans")
      .select("*")
      .eq("slug", planSlug)
      .eq("is_active", true)
      .single();

    if (planError || !plan) return errorResponse(corsHeaders, 404, "Plano não encontrado.");

    const { data: profile } = await adminClient
      .from("profiles")
      .select("asaas_customer_id, full_name, email, subscription_status")
      .eq("id", userId)
      .single();

    if (profile?.subscription_status === "active") {
      return jsonResponse(corsHeaders, { error: "Você já possui uma assinatura ativa.", alreadySubscribed: true }, 400);
    }

    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    const ASAAS_BASE_URL = Deno.env.get("ASAAS_ENV") === "production"
      ? "https://api.asaas.com/v3"
      : "https://sandbox.asaas.com/api/v3";

    if (!ASAAS_API_KEY) return errorResponse(corsHeaders, 503, "Gateway de pagamento não configurado.");

    let asaasCustomerId = profile?.asaas_customer_id;

    if (!asaasCustomerId) {
      const customerRes = await fetch(`${ASAAS_BASE_URL}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", access_token: ASAAS_API_KEY },
        body: JSON.stringify({
          name: sanitizeInput(profile?.full_name, 200) || "Usuário",
          email: sanitizeInput(profile?.email, 255) || "",
          externalReference: userId,
        }),
      });

      const customer = await customerRes.json();
      if (!customerRes.ok) {
        console.error("Asaas customer creation failed:", customer);
        return errorResponse(corsHeaders, 502, "Erro ao processar pagamento.");
      }

      asaasCustomerId = customer.id;
      await adminClient.from("profiles").update({ asaas_customer_id: asaasCustomerId }).eq("id", userId);
    }

    const cycle = plan.interval === "yearly" ? "YEARLY" : "MONTHLY";
    const subscriptionRes = await fetch(`${ASAAS_BASE_URL}/subscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", access_token: ASAAS_API_KEY },
      body: JSON.stringify({
        customer: asaasCustomerId,
        billingType: "UNDEFINED",
        value: plan.price,
        cycle,
        nextDueDate: new Date().toISOString().split("T")[0],
        description: `Assinatura ${sanitizeInput(plan.name, 100)} - Sozo`,
        externalReference: JSON.stringify({ userId, planSlug }),
      }),
    });

    const subscription = await subscriptionRes.json();
    if (!subscriptionRes.ok) {
      console.error("Asaas subscription creation failed:", subscription);
      return errorResponse(corsHeaders, 502, "Erro ao criar assinatura.");
    }

    await adminClient.from("payments").insert({
      user_id: userId,
      type: "subscription",
      amount: plan.price,
      status: "pending",
      asaas_subscription_id: subscription.id,
      metadata: { plan_slug: planSlug, plan_name: plan.name },
    });

    await adminClient
      .from("profiles")
      .update({ subscription_plan: planSlug, subscription_status: "pending" })
      .eq("id", userId);

    await logAuditEvent(userId, "subscription_created", "subscription", subscription.id, { plan: planSlug, amount: plan.price });

    return jsonResponse(corsHeaders, {
      subscriptionId: subscription.id,
      invoiceUrl: subscription.invoiceUrl || subscription.paymentLink,
      planName: plan.name,
      value: plan.price,
    });
  } catch (error) {
    console.error("create-subscription error:", error);
    return errorResponse(corsHeaders, 500, "Erro interno. Tente novamente.");
  }
});
