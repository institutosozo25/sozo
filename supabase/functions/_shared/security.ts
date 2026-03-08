import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── CORS ───
const ALLOWED_ORIGINS = [
  "https://sozo.lovable.app",
  "https://id-preview--b9bd0d97-1bb0-4a10-a384-515f12049013.lovable.app",
];

export function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

// ─── Rate Limiting (per-isolate in-memory) ───
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const ipRateLimitMap = new Map<string, { count: number; resetAt: number }>();

const USER_RATE_LIMIT = 5;
const USER_RATE_WINDOW = 60_000;
const IP_RATE_LIMIT = 30;
const IP_RATE_WINDOW = 60_000;

export function checkUserRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + USER_RATE_WINDOW });
    return true;
  }
  if (entry.count >= USER_RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export function checkIpRateLimit(req: Request): boolean {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") || "unknown";
  const now = Date.now();
  const entry = ipRateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRateLimitMap.set(ip, { count: 1, resetAt: now + IP_RATE_WINDOW });
    return true;
  }
  if (entry.count >= IP_RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ─── Authentication ───
export async function authenticateRequest(req: Request): Promise<{
  error: string | null;
  userId: string | null;
  supabase: ReturnType<typeof createClient> | null;
}> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Unauthorized", userId: null, supabase: null };
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error } = await sb.auth.getUser();
  if (error || !user) {
    return { error: "Unauthorized", userId: null, supabase: null };
  }

  return { error: null, userId: user.id, supabase: sb };
}

// ─── Admin Client ───
export function getAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// ─── Daily Report Limit ───
const DAILY_REPORT_LIMIT = 5;

export async function checkDailyReportLimit(userId: string): Promise<boolean> {
  const adminClient = getAdminClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count, error } = await adminClient
    .from("generated_reports")
    .select("id", { count: "exact", head: true })
    .gte("created_at", todayStart.toISOString())
    .in(
      "submission_id",
      // subquery: get submissions owned by user
      (await adminClient
        .from("test_submissions")
        .select("id")
        .eq("user_id", userId)
      ).data?.map((s: { id: string }) => s.id) || []
    );

  if (error) {
    console.error("Daily limit check error:", error);
    return true; // fail open to not block legitimate users
  }

  return (count || 0) < DAILY_REPORT_LIMIT;
}

// ─── Check Duplicate Report ───
export async function checkDuplicateReport(submissionId: string): Promise<string | null> {
  const adminClient = getAdminClient();
  const { data } = await adminClient
    .from("generated_reports")
    .select("report_content")
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return data?.report_content || null;
}

// ─── Audit Logging ───
export async function logAuditEvent(
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: Record<string, unknown>
) {
  try {
    const adminClient = getAdminClient();
    await adminClient.rpc("log_audit_event", {
      _action: action,
      _entity_type: entityType,
      _entity_id: entityId || null,
      _metadata: metadata || {},
    });
  } catch (e) {
    console.error("Audit log error:", e);
  }
}

// ─── Input Sanitization ───
export function sanitizeInput(input: unknown, maxLength = 200): string {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/[<>"']/g, "")
    .slice(0, maxLength);
}

export function sanitizeScores(scores: unknown): Record<string, number> | null {
  if (!scores || typeof scores !== "object" || Array.isArray(scores)) return null;
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(scores as Record<string, unknown>)) {
    const safeKey = key.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 50);
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < -1000 || numValue > 1000) return null;
    result[safeKey] = numValue;
  }
  return result;
}

// ─── Error Response Helpers ───
export function errorResponse(corsHeaders: Record<string, string>, status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function jsonResponse(corsHeaders: Record<string, string>, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
