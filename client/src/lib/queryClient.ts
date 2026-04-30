import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Helper for making API requests with proper error handling
export async function apiRequest(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    credentials: "include",
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res;
}
