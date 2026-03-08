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
    const reportId = sanitizeInput(body.reportId, 36);

    if (!reportId || !/^[0-9a-f-]{36}$/.test(reportId)) {
      return errorResponse(corsHeaders, 400, "ID do relatório inválido.");
    }

    // ─── Google Drive credentials ───
    const GOOGLE_SERVICE_ACCOUNT_KEY = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
    const GOOGLE_DRIVE_FOLDER_ID = Deno.env.get("GOOGLE_DRIVE_FOLDER_ID");

    if (!GOOGLE_SERVICE_ACCOUNT_KEY || !GOOGLE_DRIVE_FOLDER_ID) {
      return errorResponse(corsHeaders, 503, "Integração Google Drive não configurada.");
    }

    const adminClient = getAdminClient();

    // Fetch report with submission data
    const { data: report, error: reportError } = await adminClient
      .from("generated_reports")
      .select("*, submission:test_submissions!inner(respondent_name, respondent_email, user_id, test_id, tests(title))")
      .eq("id", reportId)
      .single();

    if (reportError || !report) {
      return errorResponse(corsHeaders, 404, "Relatório não encontrado.");
    }

    // Verify ownership
    const sub = Array.isArray(report.submission) ? report.submission[0] : report.submission;
    if (sub?.user_id !== userId) {
      // Check if admin
      const { data: roleData } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        return errorResponse(corsHeaders, 403, "Acesso negado.");
      }
    }

    // ─── Generate HTML for PDF-like content ───
    const respondentName = sub?.respondent_name || "Participante";
    const testTitle = sub?.tests?.title || "Teste";
    const createdAt = new Date(report.created_at).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric",
    });

    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Relatório - ${respondentName}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a2e; line-height: 1.7; }
  h1 { color: #16213e; border-bottom: 3px solid #0f3460; padding-bottom: 10px; }
  h2 { color: #0f3460; margin-top: 30px; }
  h3 { color: #533483; }
  .header { text-align: center; margin-bottom: 40px; padding: 30px; background: linear-gradient(135deg, #0f3460, #533483); color: white; border-radius: 12px; }
  .header h1 { color: white; border: none; }
  .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0; color: #888; font-size: 12px; }
</style></head>
<body>
  <div class="header">
    <h1>Instituto Plenitude SOZO</h1>
    <p>${testTitle} — ${respondentName}</p>
    <p>Gerado em ${createdAt}</p>
  </div>
  ${report.report_content || "<p>Conteúdo não disponível.</p>"}
  <div class="footer">
    <p>© Instituto Plenitude SOZO — Relatório gerado automaticamente</p>
  </div>
</body></html>`;

    // ─── Get Google Access Token via Service Account ───
    const serviceAccount = JSON.parse(GOOGLE_SERVICE_ACCOUNT_KEY);
    const accessToken = await getGoogleAccessToken(serviceAccount);

    // ─── Upload to Google Drive ───
    const fileName = `Relatorio_${testTitle.replace(/\s+/g, "_")}_${respondentName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.html`;

    const metadata = {
      name: fileName,
      parents: [GOOGLE_DRIVE_FOLDER_ID],
      mimeType: "text/html",
    };

    const boundary = "boundary_" + crypto.randomUUID();
    const multipartBody = buildMultipartBody(boundary, metadata, htmlContent);

    const uploadRes = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      }
    );

    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) {
      console.error("Google Drive upload failed:", uploadData);
      return errorResponse(corsHeaders, 502, "Erro ao enviar para Google Drive.");
    }

    // Store the Drive file ID in report metadata
    await adminClient
      .from("generated_reports")
      .update({
        scores: {
          ...(report.scores as Record<string, unknown> || {}),
          drive_file_id: uploadData.id,
          drive_file_name: fileName,
          drive_uploaded_at: new Date().toISOString(),
        },
      })
      .eq("id", reportId);

    await logAuditEvent(userId, "report_uploaded_drive", "generated_report", reportId, {
      drive_file_id: uploadData.id,
      file_name: fileName,
    });

    return jsonResponse(corsHeaders, {
      success: true,
      driveFileId: uploadData.id,
      fileName,
    });
  } catch (error) {
    console.error("upload-to-drive error:", error);
    return errorResponse(corsHeaders, 500, "Erro interno. Tente novamente.");
  }
});

// ─── Google Auth via Service Account JWT ───
async function getGoogleAccessToken(serviceAccount: {
  client_email: string;
  private_key: string;
  token_uri: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/drive.file",
    aud: serviceAccount.token_uri || "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signInput = `${encodedHeader}.${encodedPayload}`;

  // Import private key and sign
  const pemContent = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");

  const binaryKey = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signInput)
  );

  const encodedSignature = base64url(signature);
  const jwt = `${signInput}.${encodedSignature}`;

  const tokenRes = await fetch(serviceAccount.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    console.error("Google token error:", tokenData);
    throw new Error("Failed to get Google access token");
  }

  return tokenData.access_token;
}

function base64url(input: string | ArrayBuffer): string {
  let base64: string;
  if (typeof input === "string") {
    base64 = btoa(input);
  } else {
    base64 = btoa(String.fromCharCode(...new Uint8Array(input)));
  }
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function buildMultipartBody(
  boundary: string,
  metadata: Record<string, unknown>,
  content: string
): string {
  return (
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: text/html; charset=UTF-8\r\n\r\n` +
    `${content}\r\n` +
    `--${boundary}--`
  );
}
