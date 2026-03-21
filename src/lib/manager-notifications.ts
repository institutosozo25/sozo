type HistoryMetadata = {
  colaborador_name?: string;
  colaborador_id?: string;
  paciente_name?: string;
  paciente_id?: string;
  scores?: Record<string, unknown> | null;
};

export interface HistoryEntryLike {
  id: string;
  test_type: string;
  test_name: string;
  completed_at: string;
  metadata?: HistoryMetadata | null;
}

export interface DerivedManagerNotification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  source: "history";
  readKey: string;
}

export interface ManagedResultSummary {
  label: string;
  detail?: string;
}

const STORAGE_PREFIX = "manager-history-notification-reads";

const TEST_TYPE_LABELS: Record<string, string> = {
  disc: "DISC",
  mbti: "MBTI",
  temperamento: "Temperamento",
  eneagrama: "Eneagrama",
  mapso: "MAPSO",
};

export function getManagerHistoryReadStorageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`;
}

export function loadManagerHistoryReadIds(userId: string): Set<string> {
  if (typeof window === "undefined") return new Set();

  try {
    const raw = window.localStorage.getItem(getManagerHistoryReadStorageKey(userId));
    if (!raw) return new Set();

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter((item): item is string => typeof item === "string")) : new Set();
  } catch {
    return new Set();
  }
}

export function saveManagerHistoryReadIds(userId: string, readIds: Iterable<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getManagerHistoryReadStorageKey(userId), JSON.stringify(Array.from(readIds)));
}

export function extractManagedRespondentName(entry: Pick<HistoryEntryLike, "test_name" | "metadata">) {
  const metadataName = entry.metadata?.colaborador_name || entry.metadata?.paciente_name;
  if (metadataName) return metadataName;

  const [, trailingName] = entry.test_name.split("—");
  return trailingName?.trim() || "Respondente";
}

export function extractManagedScores(metadata?: HistoryMetadata | null) {
  return metadata?.scores && typeof metadata.scores === "object" ? metadata.scores : null;
}

export function buildManagerHistoryNotifications(entries: HistoryEntryLike[]): DerivedManagerNotification[] {
  return entries.map((entry) => {
    const respondentName = extractManagedRespondentName(entry);
    const testLabel = TEST_TYPE_LABELS[entry.test_type] || entry.test_type.toUpperCase();

    return {
      id: `history-${entry.id}`,
      readKey: `history-${entry.id}`,
      source: "history",
      created_at: entry.completed_at,
      title: `${respondentName} concluiu ${testLabel}`,
      message: "O resultado foi salvo no histórico e já está disponível no painel de gerência.",
    };
  });
}

export function getManagedScoreSummary(testType: string, scores: Record<string, unknown> | null): ManagedResultSummary | null {
  if (!scores) return null;

  if (testType === "mbti" && typeof scores.type === "string") {
    return {
      label: scores.type,
      detail: typeof scores.typeName === "string" ? scores.typeName : undefined,
    };
  }

  if (testType === "disc" && typeof scores.primary === "string") {
    return {
      label: scores.primary,
      detail: typeof scores.primaryLabel === "string" ? scores.primaryLabel : undefined,
    };
  }

  if (testType === "temperamento" && typeof scores.primaryLabel === "string") {
    return {
      label: scores.primaryLabel,
      detail: typeof scores.secondaryLabel === "string" ? `Secundário: ${scores.secondaryLabel}` : undefined,
    };
  }

  if (testType === "eneagrama" && typeof scores.dominant !== "undefined") {
    const dominant = String(scores.dominant);
    return {
      label: `Tipo ${dominant}`,
      detail: typeof scores.dominantName === "string" ? scores.dominantName : undefined,
    };
  }

  return null;
}