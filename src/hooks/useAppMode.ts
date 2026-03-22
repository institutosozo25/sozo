/**
 * Detects whether the app is running in "sales" mode (institutoplenitudesozo.com.br)
 * or "sistema" mode (sistema.institutoplenitudesozo.com.br).
 *
 * In development / preview, defaults to "sales" unless ?mode=sistema is present
 * or the hostname starts with "sistema.".
 */
export type AppMode = "sales" | "sistema";

export function getAppMode(): AppMode {
  const hostname = window.location.hostname;
  const params = new URLSearchParams(window.location.search);

  if (hostname.startsWith("sistema.") || params.get("mode") === "sistema") {
    return "sistema";
  }
  return "sales";
}

export function getSistemaUrl(): string {
  const hostname = window.location.hostname;

  // Production
  if (hostname === "institutoplenitudesozo.com.br" || hostname === "www.institutoplenitudesozo.com.br") {
    return "https://sistema.institutoplenitudesozo.com.br";
  }

  // Development / preview — use query param fallback
  return `${window.location.origin}?mode=sistema`;
}

export function getSalesUrl(): string {
  const hostname = window.location.hostname;

  if (hostname.startsWith("sistema.")) {
    return `https://institutoplenitudesozo.com.br`;
  }

  // Dev — remove mode param
  const url = new URL(window.location.href);
  url.searchParams.delete("mode");
  return url.origin + url.pathname;
}
