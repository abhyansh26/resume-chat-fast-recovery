// web/src/api.ts

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

console.info("[API] Using base URL:", API_BASE);

async function doFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    // IMPORTANT: no credentials here; keeps CORS simpler
    ...options,
  });

  if (!res.ok) {
    // try to parse JSON error, else throw generic
    let msg = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if ((data as any)?.message) msg = (data as any).message;
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
