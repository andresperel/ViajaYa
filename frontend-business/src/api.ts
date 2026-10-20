const base = `${import.meta.env.VITE_API_URL || ""}/api/business`;
let csrfToken = "";
let csrfRequest: Promise<void> | null = null;
let environment = "supabase";
export const getEnvironment = () => environment;
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function initCsrf(): Promise<void> {
  if (!csrfRequest) {
    csrfRequest = (async () => {
      const response = await fetch(`${base}/auth/csrf`, {
        credentials: "include",
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok)
        throw new ApiError(
          response.status,
          "No se pudo conectar con ViajaYa Business.",
        );
      environment =
        response.headers.get("X-ViajaYa-Environment") === "disposable-local"
          ? "disposable-local"
          : "supabase";
      csrfToken = (await response.json()).csrfToken;
    })().finally(() => {
      csrfRequest = null;
    });
  }
  return csrfRequest;
}
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  if (method !== "GET" && !csrfToken) await initCsrf();
  let response: Response;
  try {
    const timeout = AbortSignal.timeout(20000);
    response = await fetch(`${base}${path}`, {
      method,
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      credentials: "include",
      cache: "no-store",
      headers:
        method === "GET"
          ? {}
          : { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw new Error(
      "No pudimos conectar. Revisá tu conexión e intentá nuevamente.",
    );
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/auth/"))
      window.dispatchEvent(new Event("business-session-expired"));
    throw new ApiError(
      response.status,
      data.mensaje || "No se pudo completar la operación.",
    );
  }
  return data;
}
