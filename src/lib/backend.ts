const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export function getBackendBaseUrl() {
  if (!BACKEND_URL) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL no esta definida.");
  }

  return BACKEND_URL.endsWith("/") ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
}

export function buildAdminHeaders(adminCode: string, init?: HeadersInit): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-admin-panel-code": adminCode,
    ...init,
  };
}

export async function readJsonSafe<T>(response: Response): Promise<T | null> {
  return response.json().catch(() => null);
}

export function getApiErrorMessage(
  data: unknown,
  fallback: string,
) {
  if (!data || typeof data !== "object") return fallback;

  const maybeObject = data as Record<string, unknown>;

  if (typeof maybeObject.message === "string" && maybeObject.message.trim()) {
    return maybeObject.message;
  }

  if (typeof maybeObject.error === "string" && maybeObject.error.trim()) {
    return maybeObject.error;
  }

  return fallback;
}
