// web/src/api.ts

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

// Debug log so we can see what the frontend thinks the API is
console.log("[API] Using base URL:", API_BASE);

if (!API_BASE) {
  console.warn(
    "API_BASE is not configured; falling back to http://127.0.0.1:8000"
  );
}

async function doFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
  });

  if (!res.ok) {
    // try to parse JSON error, else throw generic
    let msg = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data?.message) msg = data.message;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(msg);
  }
  return res.json();
}

export async function getSession(sessionId: string) {
  return doFetch(`/session/${encodeURIComponent(sessionId)}`);
}

export async function saveResume(sessionId: string, text: string) {
  return doFetch(`/resume/${encodeURIComponent(sessionId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

export async function sendChat(sessionId: string, message: string) {
  return doFetch(`/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, message }),
  });
}

export async function snapshotSession(sessionId: string) {
  return doFetch(`/snapshot/${encodeURIComponent(sessionId)}`, {
    method: "POST",
  });
}
