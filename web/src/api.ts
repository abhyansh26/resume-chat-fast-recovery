export const API = import.meta.env.VITE_API_BASE_URL;

export async function getSession(sessionId: string) {
  const r = await fetch(`${API}/session/${sessionId}`);
  if (!r.ok) throw new Error("Failed to load session");
  return r.json();
}

export async function saveResume(sessionId: string, text: string) {
  const r = await fetch(`${API}/resume/${sessionId}`, {
    method: "PUT",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ text }),
  });
  if (!r.ok) throw new Error("Failed to save resume");
  return r.json();
}

export async function sendChat(sessionId: string, message: string) {
  const r = await fetch(`${API}/chat`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ sessionId, message }),
  });
  if (!r.ok) throw new Error("Failed to send chat");
  return r.json();
}

export async function snapshotSession(sessionId: string) {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  const r = await fetch(`${base}/snapshot/${encodeURIComponent(sessionId)}`, {
    method: 'POST'
  });
  if (!r.ok) throw new Error('Snapshot failed');
  return r.json();
}
