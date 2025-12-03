// web/src/api.ts

// Decide which API base URL to use:
// - For local dev with `npm run dev`, use .env.development
// - For preview / production, use .env.local / .env.production
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

if (!API_BASE) {
  console.warn(
    "[API] API_BASE is not configured; falling back to http://127.0.0.1:8000"
  );
} else {
  console.log("[API] Using base URL:", API_BASE);
}

async function doFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    // ❗ We are NOT using cookies or auth headers, so credentials are not needed.
    // Removing this avoids CORS complications with `allow_origins=["*"]`.
    // credentials: "include",
    ...options,
  });

  if (!res.ok) {
    let msg = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data?.message) msg = data.message;
    } catch {
      // ignore JSON parse failures
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
