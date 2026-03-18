import {
  getCorsHeaders, authenticateRequest, errorResponse, jsonResponse,
} from "../_shared/security.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.2";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { error: authError, userId } = await authenticateRequest(req);
    if (authError || !userId) return errorResponse(corsHeaders, 401, "Não autorizado.");

    // Verify admin role
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) return errorResponse(corsHeaders, 403, "Acesso restrito a administradores.");

    const body = await req.json();
    const { action } = body;

    if (action === "test-asaas") {
      const apiKey = Deno.env.get("ASAAS_API_KEY");
      const env = Deno.env.get("ASAAS_ENV") || "sandbox";
      if (!apiKey) return jsonResponse(corsHeaders, { status: "error", message: "ASAAS_API_KEY não configurada." });

      const baseUrl = env === "production"
        ? "https://api.asaas.com/v3"
        : "https://sandbox.asaas.com/api/v3";

      const res = await fetch(`${baseUrl}/finance/balance`, {
        headers: { "access_token": apiKey },
      });
      const data = await res.json();

      if (res.ok) {
        return jsonResponse(corsHeaders, {
          status: "ok",
          message: `Conexão OK. Ambiente: ${env}. Saldo: R$ ${data.balance?.toFixed(2) ?? "N/A"}`,
          details: { env, balance: data.balance },
        });
      } else {
        return jsonResponse(corsHeaders, {
          status: "error",
          message: `Erro na API Asaas: ${data.errors?.[0]?.description || res.statusText}`,
        });
      }
    }

    if (action === "test-google-drive") {
      const serviceAccountKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
      const folderId = Deno.env.get("GOOGLE_DRIVE_FOLDER_ID");

      if (!serviceAccountKey) return jsonResponse(corsHeaders, { status: "error", message: "GOOGLE_SERVICE_ACCOUNT_KEY não configurada." });
      if (!folderId) return jsonResponse(corsHeaders, { status: "error", message: "GOOGLE_DRIVE_FOLDER_ID não configurado." });

      try {
        const keyData = JSON.parse(serviceAccountKey);
        // Build JWT for Google API
        const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
        const now = Math.floor(Date.now() / 1000);
        const claimSet = btoa(JSON.stringify({
          iss: keyData.client_email,
          scope: "https://www.googleapis.com/auth/drive.file",
          aud: "https://oauth2.googleapis.com/token",
          exp: now + 3600,
          iat: now,
        }));

        // Use crypto to sign
        const encoder = new TextEncoder();
        const pemKey = keyData.private_key
          .replace(/-----BEGIN PRIVATE KEY-----/g, "")
          .replace(/-----END PRIVATE KEY-----/g, "")
          .replace(/\n/g, "");
        const binaryKey = Uint8Array.from(atob(pemKey), (c) => c.charCodeAt(0));

        const cryptoKey = await crypto.subtle.importKey(
          "pkcs8", binaryKey,
          { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
          false, ["sign"]
        );

        const signatureInput = encoder.encode(`${header}.${claimSet}`);
        const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, signatureInput);
        const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

        const jwt = `${header}.${claimSet}.${signatureB64}`;

        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
        });

        if (!tokenRes.ok) {
          const tokenErr = await tokenRes.text();
          return jsonResponse(corsHeaders, { status: "error", message: `Erro ao autenticar no Google: ${tokenErr}` });
        }

        const tokenData = await tokenRes.json();

        // Test folder access
        const driveRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType`,
          { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
        );

        if (driveRes.ok) {
          const folderInfo = await driveRes.json();
          return jsonResponse(corsHeaders, {
            status: "ok",
            message: `Conexão OK. Pasta: "${folderInfo.name}"`,
            details: { folderId: folderInfo.id, folderName: folderInfo.name },
          });
        } else {
          const driveErr = await driveRes.text();
          return jsonResponse(corsHeaders, { status: "error", message: `Erro ao acessar pasta: ${driveErr}` });
        }
      } catch (e) {
        return jsonResponse(corsHeaders, { status: "error", message: `Erro ao processar chave: ${e.message}` });
      }
    }

    if (action === "test-smtp") {
      // SMTP is managed by Supabase/Lovable Cloud - just return info
      return jsonResponse(corsHeaders, {
        status: "info",
        message: "O envio de e-mails é gerenciado pelo Lovable Cloud. Para configurações SMTP personalizadas, entre em contato com o suporte.",
      });
    }

    if (action === "get-db-stats") {
      const { count: profileCount } = await adminClient.from("profiles").select("*", { count: "exact", head: true });
      const { count: submissionCount } = await adminClient.from("test_submissions").select("*", { count: "exact", head: true });
      const { count: paymentCount } = await adminClient.from("payments").select("*", { count: "exact", head: true });
      const { count: empresaCount } = await adminClient.from("empresas").select("*", { count: "exact", head: true });
      const { count: mapsoCount } = await adminClient.from("mapso_assessments").select("*", { count: "exact", head: true });

      return jsonResponse(corsHeaders, {
        status: "ok",
        details: {
          profiles: profileCount ?? 0,
          submissions: submissionCount ?? 0,
          payments: paymentCount ?? 0,
          empresas: empresaCount ?? 0,
          mapso_assessments: mapsoCount ?? 0,
        },
      });
    }

    if (action === "get-contact-info") {
      // Read from a simple settings approach - use a key-value in audit_logs metadata or a dedicated approach
      // For now, return defaults that admin can see
      return jsonResponse(corsHeaders, {
        status: "ok",
        message: "Informações de contato carregadas.",
        details: {
          note: "As informações de contato são definidas diretamente no código-fonte da página /contato. Para alterações, edite a página de contato.",
        },
      });
    }

    return errorResponse(corsHeaders, 400, "Ação inválida.");
  } catch (e) {
    console.error("admin-config error:", e);
    return errorResponse(corsHeaders, 500, "Erro interno do servidor.");
  }
});
