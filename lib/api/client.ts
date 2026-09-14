/**
 * The single place that knows how to reach the DSA API.
 *
 * Every request goes through here so the base URL is normalised once. DSA's own
 * frontend builds API URLs per file and has a standing bug from it: a base that
 * already ends in `/api` produces `/api/api/...` and a 404.
 */

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Origin only, no trailing slash, no trailing `/api`. */
function apiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) {
    throw new ApiError(
      "NEXT_PUBLIC_API_URL is not set. Add it to .env.local (origin only, no /api).",
      500,
    );
  }
  return raw.trim().replace(/\/+$/, "").replace(/\/api$/, "");
}

type ApiRequest = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Bearer token for authenticated calls. */
  token?: string;
  body?: unknown;
  /** Next.js fetch caching. Auth calls should stay uncached. */
  cache?: RequestCache;
  signal?: AbortSignal;
};

/**
 * Call the DSA API and return its parsed JSON.
 *
 * Throws ApiError with the message the API gave, so callers can show the real
 * reason ("Account not verified") instead of a generic failure.
 */
export async function apiFetch<T>(path: string, init: ApiRequest = {}): Promise<T> {
  const { method = "GET", token, body, cache = "no-store", signal } = init;
  const url = `${apiBase()}/api${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache,
      signal,
    });
  } catch {
    // Network failure, DNS, timeout. The student sees this a lot on mobile data,
    // so it deserves its own message rather than looking like a rejected login.
    throw new ApiError(
      "Could not reach the server. Check your connection and try again.",
      0,
    );
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const record = (payload ?? {}) as Record<string, unknown>;
    const message =
      typeof record.message === "string"
        ? record.message
        : typeof record.error === "string"
          ? record.error
          : `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return payload as T;
}
