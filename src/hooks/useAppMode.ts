/**
 * Detects whether the app is running in "sales" mode (institutoplenitudesozo.com.br)
 * or "sistema" mode (sistema.institutoplenitudesozo.com.br).
 *
 * In development / preview, defaults to "all" (both route sets available).
 * Only enforces separation on production domains.
 */
export type AppMode = "sales" | "sistema" | "all";

const SALES_HOSTS = [
  "institutoplenitudesozo.com.br",
  "www.institutoplenitudesozo.com.br",
];

export function getAppMode(): AppMode {
  const hostname = window.location.hostname;

  // Production sistema subdomain
  if (hostname === "sistema.institutoplenitudesozo.com.br") {
    return "sistema";
  }

  // Production sales domain
  if (SALES_HOSTS.includes(hostname)) {
    return "sales";
  }

  // Dev / preview / lovable domains → all routes available
  return "all";
}

export function getSistemaUrl(): string {
  const hostname = window.location.hostname;

  if (SALES_HOSTS.includes(hostname)) {
    return "https://sistema.institutoplenitudesozo.com.br";
  }

  // Dev/preview — just navigate within same app
  return "/auth";
}

export function getSalesUrl(): string {
  const hostname = window.location.hostname;

  if (hostname === "sistema.institutoplenitudesozo.com.br") {
    return "https://institutoplenitudesozo.com.br";
  }

  return "/";
}
