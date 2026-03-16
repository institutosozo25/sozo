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
    const assessmentId = sanitizeInput(body.assessmentId, 36);
    const docType = sanitizeInput(body.docType, 20); // "diagnosis" | "report" | "action_plan"

    if (!assessmentId || !/^[0-9a-f-]{36}$/.test(assessmentId)) {
      return errorResponse(corsHeaders, 400, "ID da avaliação inválido.");
    }
    if (!["diagnosis", "report", "action_plan"].includes(docType)) {
      return errorResponse(corsHeaders, 400, "Tipo de documento inválido.");
    }

    const GOOGLE_SERVICE_ACCOUNT_KEY = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
    const GOOGLE_DRIVE_FOLDER_ID = Deno.env.get("GOOGLE_DRIVE_FOLDER_ID");

    if (!GOOGLE_SERVICE_ACCOUNT_KEY || !GOOGLE_DRIVE_FOLDER_ID) {
      return errorResponse(corsHeaders, 503, "Integração Google Drive não configurada.");
    }

    const adminClient = getAdminClient();

    // Fetch assessment
    const { data: assessment, error: fetchErr } = await adminClient
      .from("mapso_assessments")
      .select("*")
      .eq("id", assessmentId)
      .single();

    if (fetchErr || !assessment) {
      return errorResponse(corsHeaders, 404, "Avaliação não encontrada.");
    }

    // Verify ownership: user must be owner, empresa owner, or admin
    let authorized = assessment.user_id === userId;
    if (!authorized && assessment.empresa_id) {
      const { data: emp } = await adminClient
        .from("empresas")
        .select("profile_id")
        .eq("id", assessment.empresa_id)
        .single();
      if (emp?.profile_id === userId) authorized = true;
    }
    if (!authorized) {
      const { data: roleData } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (roleData) authorized = true;
    }
    if (!authorized) {
      return errorResponse(corsHeaders, 403, "Acesso negado.");
    }

    // Get HTML content based on doc type
    let htmlContent: string | null = null;
    let filePrefix = "";
    let subfolder = "";

    switch (docType) {
      case "diagnosis":
        htmlContent = assessment.diagnosis_html;
        filePrefix = "Diagnostico_MAPSO";
        subfolder = "Diagnosticos";
        break;
      case "report":
        htmlContent = assessment.report_html;
        filePrefix = "Relatorio_NR1";
        subfolder = "Relatorios_NR1";
        break;
      case "action_plan":
        // Generate action plan HTML from stored data
        const planData = assessment.action_plan as any[];
        if (planData && planData.length > 0) {
          htmlContent = generateActionPlanHtml(assessment.organization_name, planData);
          filePrefix = "Plano_de_Acao";
          subfolder = "Planos_de_Acao";
        }
        break;
    }

    if (!htmlContent) {
      return errorResponse(corsHeaders, 404, "Conteúdo do documento não disponível.");
    }

    // Wrap with full HTML document
    const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>${filePrefix} — ${assessment.organization_name}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a2e; line-height: 1.7; }
  h1 { color: #16213e; border-bottom: 3px solid #0f3460; padding-bottom: 10px; }
  h2 { color: #0f3460; margin-top: 30px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th, td { padding: 10px; border: 1px solid #ddd; }
  th { background: #f8f9fa; text-align: left; }
  .header { text-align: center; margin-bottom: 40px; padding: 30px; background: linear-gradient(135deg, #0f3460, #533483); color: white; border-radius: 12px; }
  .header h1 { color: white; border: none; }
  .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0; color: #888; font-size: 12px; }
</style></head>
<body>
  ${htmlContent}
</body></html>`;

    // Get access token
    const serviceAccount = JSON.parse(GOOGLE_SERVICE_ACCOUNT_KEY);
    const accessToken = await getGoogleAccessToken(serviceAccount);

    // Ensure folder structure: Plenitude/Empresas/[empresa]/[subfolder]
    const rootFolderId = GOOGLE_DRIVE_FOLDER_ID;
    const empresaFolderId = await getOrCreateFolder(accessToken, rootFolderId, assessment.organization_name.replace(/[^a-zA-Z0-9À-ÿ\s_-]/g, ""));
    const subFolderId = await getOrCreateFolder(accessToken, empresaFolderId, subfolder);

    // Upload file
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `${filePrefix}_${assessment.organization_name.replace(/\s+/g, "_")}_${dateStr}.html`;

    const metadata = {
      name: fileName,
      parents: [subFolderId],
      mimeType: "text/html",
    };

    const boundary = "boundary_" + crypto.randomUUID();
    const multipartBody = buildMultipartBody(boundary, metadata, fullHtml);

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

    // Update assessment with Drive file ID
    const updateField = docType === "diagnosis" ? "drive_diagnosis_file_id" : "drive_report_file_id";
    await adminClient
      .from("mapso_assessments")
      .update({ [updateField]: uploadData.id })
      .eq("id", assessmentId);

    await logAuditEvent(userId, "mapso_uploaded_drive", "mapso_assessment", assessmentId, {
      drive_file_id: uploadData.id,
      doc_type: docType,
      file_name: fileName,
    });

    return jsonResponse(corsHeaders, {
      success: true,
      driveFileId: uploadData.id,
      driveUrl: `https://drive.google.com/file/d/${uploadData.id}/view`,
      fileName,
    });
  } catch (error) {
    console.error("upload-mapso-to-drive error:", error);
    return errorResponse(corsHeaders, 500, "Erro interno. Tente novamente.");
  }
});

// ─── Helper: Generate action plan HTML ───
function generateActionPlanHtml(orgName: string, plan: any[]): string {
  const rows = plan.map((a: any, i: number) => `
    <tr>
      <td>${i + 1}</td>
      <td style="font-weight:600;">${a.riskFactor || ""}</td>
      <td>${a.recommendedAction || ""}</td>
      <td style="text-align:center;">${a.responsible || ""}</td>
      <td style="text-align:center;">${a.deadline || ""}</td>
      <td style="text-align:center;">${a.priority || ""}</td>
    </tr>`).join("");

  return `
<div class="header">
  <h1>PLANO DE AÇÃO — RISCOS PSICOSSOCIAIS</h1>
  <p style="margin:8px 0 0;opacity:0.9;">${orgName}</p>
  <p style="margin:4px 0 0;opacity:0.7;font-size:14px;">Gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
</div>
<h1>Plano de Ação</h1>
<p>Com base nos riscos identificados na avaliação MAPSO, as seguintes ações são recomendadas:</p>
<table>
  <thead>
    <tr><th>#</th><th>Fator de Risco</th><th>Ação Recomendada</th><th>Responsável</th><th>Prazo</th><th>Prioridade</th></tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">
  <p>© Instituto Plenitude SOZO — Plano de Ação gerado automaticamente via MAPSO</p>
</div>`;
}

// ─── Google Drive helpers ───
async function getOrCreateFolder(accessToken: string, parentId: string, name: string): Promise<string> {
  // Search for existing folder
  const q = `'${parentId}' in parents and name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&supportsAllDrives=true&includeItemsFromAllDrives=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const searchData = await searchRes.json();
  if (searchData.files?.length > 0) return searchData.files[0].id;

  // Create folder
  const createRes = await fetch("https://www.googleapis.com/drive/v3/files?supportsAllDrives=true", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    }),
  });
  const createData = await createRes.json();
  return createData.id;
}

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

function buildMultipartBody(boundary: string, metadata: Record<string, unknown>, content: string): string {
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
