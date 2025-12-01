// web/src/api.ts

const RAW_API_BASE =
  import.meta.env.VITE_API_BASE ??
  "https://xllcqf6c7l.execute-api.us-east-1.amazonaws.com";

// Strip trailing slashes so we don't end up with "//session/..."
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

async function handleJson(r: Response) {
  if (!r.ok) {
    // Simple error handling for now; you can enhance this later
    throw new Error(`${r.status} ${r.statusText}`);
  }
  return r.json();
}

export async function getSession(sessionId: string) {
  const r = await fetch(
    `${API_BASE}/session/${encodeURIComponent(sessionId)}`,
    {
      credentials: "omit",
    },
  );
  return handleJson(r);
}

export async function saveResume(sessionId: string, text: string) {
  const r = await fetch(
    `${API_BASE}/resume/${encodeURIComponent(sessionId)}`,
    {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    },
  );
  return handleJson(r);
}

export async function sendChat(sessionId: string, message: string) {
  const r = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sessionId, message }),
  });
  return handleJson(r);
}

export async function snapshotSession(sessionId: string) {
  const r = await fetch(
    `${API_BASE}/snapshot/${encodeURIComponent(sessionId)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      // backend doesn't require a body here
    },
  );
  return handleJson(r);
}
