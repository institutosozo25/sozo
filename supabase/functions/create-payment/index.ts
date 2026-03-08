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
    const submissionId = sanitizeInput(body.submissionId, 36);

    if (!submissionId || !/^[0-9a-f-]{36}$/.test(submissionId)) {
      return errorResponse(corsHeaders, 400, "ID da submissão inválido.");
    }

    const adminClient = getAdminClient();

    // Verify ownership
    const { data: submission, error: subError } = await adminClient
      .from("test_submissions")
      .select("*, tests(title, price)")
      .eq("id", submissionId)
      .single();

    if (subError || !submission) return errorResponse(corsHeaders, 404, "Submissão não encontrada.");

    // Verify the submission belongs to the user
    if (submission.user_id && submission.user_id !== userId) {
      return errorResponse(corsHeaders, 403, "Acesso negado.");
    }

    if (submission.paid) return errorResponse(corsHeaders, 400, "Pagamento já realizado.");

    const testPrice = submission.tests?.price || 0;
    const testTitle = submission.tests?.title || "Teste Psicológico";

    const { data: profile } = await adminClient
      .from("profiles")
      .select("asaas_customer_id, full_name, email")
      .eq("id", userId)
      .single();

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
          name: sanitizeInput(profile?.full_name || submission.respondent_name, 200) || "Usuário",
          email: sanitizeInput(profile?.email || submission.respondent_email, 255),
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

    const paymentRes = await fetch(`${ASAAS_BASE_URL}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", access_token: ASAAS_API_KEY },
      body: JSON.stringify({
        customer: asaasCustomerId,
        billingType: "UNDEFINED",
        value: testPrice,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        description: `Relatório: ${sanitizeInput(testTitle, 100)}`,
        externalReference: JSON.stringify({ submissionId, userId }),
      }),
    });

    const payment = await paymentRes.json();
    if (!paymentRes.ok) {
      console.error("Asaas payment creation failed:", payment);
      return errorResponse(corsHeaders, 502, "Erro ao criar pagamento.");
    }

    await adminClient.from("payments").insert({
      user_id: userId,
      type: "one_time",
      amount: testPrice,
      status: "pending",
      asaas_payment_id: payment.id,
      submission_id: submissionId,
      metadata: { asaas_invoice_url: payment.invoiceUrl, asaas_bank_slip_url: payment.bankSlipUrl },
    });

    await adminClient
      .from("test_submissions")
      .update({ payment_id: payment.id, payment_status: "pending" })
      .eq("id", submissionId);

    await logAuditEvent(userId, "payment_created", "payment", payment.id, { submission_id: submissionId, amount: testPrice });

    return jsonResponse(corsHeaders, {
      paymentId: payment.id,
      invoiceUrl: payment.invoiceUrl,
      pixQrCode: payment.pixQrCodeBase64,
      pixCopyPaste: payment.pixCopiaECola,
      value: testPrice,
    });
  } catch (error) {
    console.error("create-payment error:", error);
    return errorResponse(corsHeaders, 500, "Erro interno. Tente novamente.");
  }
});
