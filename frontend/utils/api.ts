export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export async function authHeaders(): Promise<HeadersInit> {
  const token = typeof window !== "undefined" ? localStorage.getItem("bim_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
