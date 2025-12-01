// web/src/api.ts

// 🔹 Determine the API base URL to call.
// Priority:
// 1. VITE_API_BASE (what we'll use going forward)
// 2. VITE_API_BASE_URL (your existing variable)
// 3. Hard-coded API Gateway URL as a fallback
const RAW_API_BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_BASE_URL ||
  "https://xllcqf6c7l.execute-api.us-east-1.amazonaws.com";

// Remove any trailing slashes ("/")
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

// Small helper: check for HTTP error codes and parse JSON
async function handleJson(r: Response) {
  if (!r.ok) {
    // Try to read the error text for debugging
    let text = "";
    try {
      text = await r.text();
    } catch {
      // ignore
    }
    console.error("API error:", r.status, r.statusText, text);
    throw new Error(`${r.status} ${r.statusText}`);
  }
  return r.json();
}

// 🔹 GET /session/{sessionId}
export async function getSession(sessionId: string) {
  const r = await fetch(`${API_BASE}/session/${encodeURIComponent(sessionId)}`, {
    credentials: "omit",
  });
  return handleJson(r);
}

// 🔹 PUT /resume/{sessionId}   body: { text }
export async function saveResume(sessionId: string, resumeText: string) {
  const r = await fetch(`${API_BASE}/resume/${encodeURIComponent(sessionId)}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: resumeText }),
  });
  return handleJson(r);
}

// 🔹 POST /chat   body: { sessionId, message }
export async function sendChat(sessionId: string, message: string) {
  const r = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sessionId, message }),
  });
  return handleJson(r);
}

// 🔹 POST /snapshot/{sessionId}
export async function snapshotSession(sessionId: string) {
  const r = await fetch(
    `${API_BASE}/snapshot/${encodeURIComponent(sessionId)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
    }
  );
  return handleJson(r);
}
