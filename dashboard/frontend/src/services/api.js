const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api/v1";

export async function api(method, url, body) {
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined
  });

  if (!res.ok) throw new Error((await res.json()).error || "Request failed");

  return res.json();
}
