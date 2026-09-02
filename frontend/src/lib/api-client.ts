const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("kk4_auth_token");
  const headers = new Headers(options.headers || {});
  
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorPayload = data?.error || {};
    throw new ApiError(
      errorPayload.code || "REQUEST_FAILED",
      errorPayload.message || `Request failed with status ${response.status}`,
      errorPayload.details || {}
    );
  }

  return data as T;
}
