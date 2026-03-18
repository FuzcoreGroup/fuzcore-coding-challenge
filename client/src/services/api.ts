export type ApiError = {
  message?: string;
  details?: unknown;
};

export async function apiFetch<T>(
  path: string,
  token: string | null,
  init?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (init?.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    ...init,
    headers,
  });

  if (!res.ok) {
    let errBody: ApiError | undefined = undefined;
    try {
      errBody = (await res.json()) as ApiError;
    } catch {
      // ignore
    }
    const msg = errBody?.message || `Request failed: ${res.status}`;
    const error = new Error(msg) as Error & { status?: number; details?: unknown };
    error.status = res.status;
    error.details = errBody?.details;
    throw error;
  }

  // Some endpoints return 204.
  if (res.status === 204) return undefined as T;

  return (await res.json()) as T;
}

