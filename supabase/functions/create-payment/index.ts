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
    const { submissionId } = await req.json();

    if (!submissionId) {
      return new Response(JSON.stringify({ error: "submissionId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to read submission + test price
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: submission, error: subError } = await adminClient
      .from("test_submissions")
      .select("*, tests(title, price)")
      .eq("id", submissionId)
      .single();

    if (subError || !submission) {
      return new Response(JSON.stringify({ error: "Submission not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (submission.paid) {
      return new Response(JSON.stringify({ error: "Already paid", alreadyPaid: true }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const testPrice = submission.tests?.price || 0;
    const testTitle = submission.tests?.title || "Teste Psicológico";

    // Get or create Asaas customer
    const { data: profile } = await adminClient
      .from("profiles")
      .select("asaas_customer_id, full_name, email")
      .eq("id", userId)
      .single();

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
      // Create customer in Asaas
      const customerRes = await fetch(`${ASAAS_BASE_URL}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          access_token: ASAAS_API_KEY,
        },
        body: JSON.stringify({
          name: profile?.full_name || submission.respondent_name,
          email: profile?.email || submission.respondent_email,
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

      await adminClient
        .from("profiles")
        .update({ asaas_customer_id: asaasCustomerId })
        .eq("id", userId);
    }

    // Create payment in Asaas
    const paymentRes = await fetch(`${ASAAS_BASE_URL}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: ASAAS_API_KEY,
      },
      body: JSON.stringify({
        customer: asaasCustomerId,
        billingType: "UNDEFINED", // PIX + credit card
        value: testPrice,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        description: `Relatório: ${testTitle}`,
        externalReference: JSON.stringify({ submissionId, userId }),
      }),
    });

    const payment = await paymentRes.json();
    if (!paymentRes.ok) {
      return new Response(JSON.stringify({ error: "Failed to create payment", details: payment }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save payment record
    await adminClient.from("payments").insert({
      user_id: userId,
      type: "one_time",
      amount: testPrice,
      status: "pending",
      asaas_payment_id: payment.id,
      submission_id: submissionId,
      metadata: { asaas_invoice_url: payment.invoiceUrl, asaas_bank_slip_url: payment.bankSlipUrl },
    });

    // Update submission with payment_id
    await adminClient
      .from("test_submissions")
      .update({ payment_id: payment.id, payment_status: "pending" })
      .eq("id", submissionId);

    return new Response(
      JSON.stringify({
        paymentId: payment.id,
        invoiceUrl: payment.invoiceUrl,
        pixQrCode: payment.pixQrCodeBase64,
        pixCopyPaste: payment.pixCopiaECola,
        value: testPrice,
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
