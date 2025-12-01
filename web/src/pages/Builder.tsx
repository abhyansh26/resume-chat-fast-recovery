// web/src/pages/Builder.tsx
import type { KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { getSession, saveResume, sendChat, snapshotSession } from "../api";
import BulletWizard from "../components/BulletWizard";
import JDPanel from "../components/JDPanel";

// ✅ A small helper to debounce function calls (used for autosave)
function useDebouncedCallback<T extends (...args: any[]) => any>(fn: T, delay = 700) {
  const t = useRef<number | undefined>(undefined);
  return (...args: Parameters<T>) => {
    if (t.current) window.clearTimeout(t.current);
    // @ts-ignore
    t.current = window.setTimeout(() => fn(...args), delay);
  };
}

// ✅ Tiny toast hook to show small popup messages bottom-right
function useToast() {
  const [msg, setMsg] = useState<string | null>(null);

  function show(m: string, ms = 1200) {
    setMsg(m);
    window.setTimeout(() => setMsg(null), ms);
  }

  return { msg, show };
}

export default function Builder() {
  // ---- Session bootstrap ----
  // We store a sessionId in localStorage so the user comes back to the same resume.
  const [sessionId, setSessionId] = useState(() => {
    const existing = localStorage.getItem("sessionId");
    if (existing) return existing;
    const s = uuidv4();
    localStorage.setItem("sessionId", s);
    return s;
  });

  // ---- App state ----
  const [resume, setResume] = useState("");
  const [chat, setChat] = useState<{ role: "user" | "assistant"; text: string; ts?: number }[]>([]);

  // ✅ Loading + error state for initial session load
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [snapshotState, setSnapshotState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Chat input + sending flag
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // Resume selection helpers (for selection-aware actions)
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const [sel, setSel] = useState<{ start: number; end: number; text: string } | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  const toast = useToast();
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // ---- Initial load (GET /session/{sessionId}) ----
  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        setLoading(true);
        setLoadErr(null);

        const data = await getSession(sessionId);

        if (!ignore) {
          setResume(data.resume || "");
          setChat(data.chat || []);
        }
      } catch (e: any) {
        if (!ignore) {
          console.error("Failed to load session", e);
          setLoadErr(e?.message || "Failed to load session");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [sessionId]);

  // ---- Autosave resume (debounced, uses PUT /resume/{sessionId}) ----
  const debouncedSave = useDebouncedCallback(async (text: string) => {
    try {
      setSaveState("saving");
      await saveResume(sessionId, text);
      setSaveState("saved");
      toast.show("Saved ✓");
      window.setTimeout(() => setSaveState("idle"), 1000);
    } catch {
      setSaveState("error");
      toast.show("Save failed ⚠️");
      window.setTimeout(() => setSaveState("idle"), 1500);
    }
  }, 700);

  function onResumeChange(next: string) {
    setResume(next);
    debouncedSave(next);
  }

  // ---- Selection helpers (for quick actions: Rephrase, Shorten, etc.) ----
  function captureSelection() {
    const el = editorRef.current;
    if (!el) return;

    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const text = (resume || "").slice(start, end);

    setSel(text && start !== end ? { start, end, text } : null);
  }

  function replaceSelection(text: string) {
    if (!sel) return;
    const before = resume.slice(0, sel.start);
    const after = resume.slice(sel.end);
    const next = `${before}${text}${after}`;
    setResume(next);
    debouncedSave(next);
    setSel(null);
    setSuggestion(null);
  }

  // ---- Assistant chat (POST /chat) ----
  async function handleSend() {
    const msg = input.trim();
    if (!msg || sending) return;

    setSending(true);
    try {
      // Add user message to chat
      setChat((c) => [...c, { role: "user", text: msg, ts: Date.now() }]);
      setInput("");

      // Ask backend/LLM
      const res = await sendChat(sessionId, msg);
      const assistantMessage = res.assistantMessage ?? "(no reply)";

      // Add assistant reply
      setChat((c) => [...c, { role: "assistant", text: assistantMessage, ts: Date.now() }]);
    } catch {
      setChat((c) => [
        ...c,
        { role: "assistant", text: "⚠️ Failed to reach assistant.", ts: Date.now() },
      ]);
    } finally {
      setSending(false);
    }
  }

  // ---- Selection-based quick actions (Chunk 3 will make these smarter) ----
  async function askFor(kind: "rephrase" | "shorten" | "quantify" | "star") {
    if (!sel?.text) return;

    const instructions: Record<string, string> = {
      rephrase: "Rephrase this resume bullet professionally and concisely:",
      shorten: "Shorten this resume bullet, keeping impact and specifics:",
      quantify:
        "Rewrite this bullet to include measurable impact (numbers or %); if needed, suggest likely ranges:",
      star:
        "Rewrite this as a STAR-format bullet (Situation, Task, Action, Result) in one concise line:",
    };

    setSending(true);
    try {
      const res = await sendChat(sessionId, `${instructions[kind]}\n\n${sel.text}`);
      const reply = res.assistantMessage ?? "";

      setSuggestion(reply || null);

      // Also log into chat
      setChat((c) => [
        ...c,
        { role: "user", text: `${kind.toUpperCase()} on selection`, ts: Date.now() },
      ]);
      setChat((c) => [
        ...c,
        { role: "assistant", text: reply || "(no suggestion)", ts: Date.now() },
      ]);
    } finally {
      setSending(false);
    }
  }

  // ---- Chat keyboard behavior (Enter to send, Shift+Enter for newline) ----
  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ---- Snapshot button (POST /snapshot/{sessionId}) ----
  async function handleSnapshot() {
    try {
      setSnapshotState("saving");
      await snapshotSession(sessionId);
      setSnapshotState("saved");
      toast.show("Snapshot saved ✓");
      window.setTimeout(() => setSnapshotState("idle"), 1000);
    } catch {
      setSnapshotState("error");
      toast.show("Snapshot failed ⚠️");
      window.setTimeout(() => setSnapshotState("idle"), 1500);
    }
  }

  // ---- Session tools: copy id, new session, export resume as .txt ----
  async function copySession() {
    await navigator.clipboard.writeText(sessionId);
    toast.show("Session ID copied");
  }

  function newSession() {
    const s = uuidv4();
    localStorage.setItem("sessionId", s);
    setSessionId(s);
    setResume("");
    setChat([]);
    toast.show("New session started");
  }

  function exportResume() {
    const blob = new Blob([resume || ""], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "resume.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ---- Global keyboard shortcut: ⌘/Ctrl + S -> snapshot ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isSave = e.key.toLowerCase() === "s" && (e.metaKey || e.ctrlKey);
      if (isSave) {
        e.preventDefault();
        handleSnapshot();
      }
    };

    window.addEventListener("keydown", onKey as any);
    return () => window.removeEventListener("keydown", onKey as any);
  });

  // ---- Auto-scroll chat to bottom ----
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.length]);

  // ---- Labels for save + snapshot buttons ----
  const saveLabel = useMemo(() => {
    if (saveState === "saving") return "Saving…";
    if (saveState === "saved") return "Saved ✓";
    if (saveState === "error") return "Save failed ⚠️";
    return "Autosave on";
  }, [saveState]);

  const snapshotLabel = useMemo(() => {
    if (snapshotState === "saving") return "Saving snapshot…";
    if (snapshotState === "saved") return "Snapshot saved ✓";
    if (snapshotState === "error") return "Snapshot failed ⚠️";
    return "Save Snapshot";
  }, [snapshotState]);

  // ---- UI ----
  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* 🔹 Page-level toolbar (NOT a sticky app header) */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {/* Left: current session info */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-indigo-500/20 border border-indigo-400/40 grid place-items-center">
              ✍️
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Current Session</h2>
              <p className="text-xs text-slate-400">
                ID: <span className="font-mono">{sessionId.slice(0, 8)}…</span>
                <button
                  onClick={copySession}
                  className="ml-2 text-indigo-300 hover:text-indigo-200 underline underline-offset-2"
                >
                  copy
                </button>
              </p>
            </div>
          </div>

          {/* Right: actions for this page */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => setShowWizard(true)}
              className="rounded-lg border border-slate-700 px-3 py-1.5 hover:bg-slate-800"
            >
              Bullet Wizard
            </button>
            <button
              onClick={exportResume}
              className="rounded-lg border border-slate-700 px-3 py-1.5 hover:bg-slate-800"
              title="Download resume.txt"
            >
              Export
            </button>
            <button
              onClick={newSession}
              className="rounded-lg border border-slate-700 px-3 py-1.5 hover:bg-slate-800"
              title="Start a fresh session"
            >
              New
            </button>
            <span
              className={`px-2 py-1 rounded ${
                saveState === "saving"
                  ? "bg-yellow-500/10 text-yellow-300"
                  : saveState === "saved"
                  ? "bg-emerald-500/10 text-emerald-300"
                  : saveState === "error"
                  ? "bg-rose-500/10 text-rose-300"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              {saveLabel}
            </span>
            <button
              onClick={handleSnapshot}
              disabled={snapshotState === "saving"}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs hover:bg-slate-800 disabled:opacity-60"
              title="Write a durable snapshot (⌘/Ctrl + S)"
            >
              {snapshotLabel}
            </button>
          </div>
        </div>

        {/* Loading & error states */}
        {loading ? (
          <div className="text-slate-400">Loading session…</div>
        ) : loadErr ? (
          <div className="text-rose-300">
            ⚠️ {loadErr}
            <button
              className="ml-3 text-xs underline underline-offset-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Editor + Chat grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Resume Editor */}
              <section className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden flex flex-col shadow-sm">
                <header className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <h2 className="font-medium">Resume Editor</h2>
                  <span className="text-xs text-slate-400">Autosaves while you type</span>
                </header>

                <textarea
                  ref={editorRef}
                  onSelect={captureSelection}
                  onKeyUp={captureSelection}
                  className="flex-1 bg-transparent p-4 outline-none resize-none font-mono text-sm leading-relaxed min-h-[360px]"
                  placeholder="Paste or start your resume here…"
                  value={resume}
                  onChange={(e) => onResumeChange(e.target.value)}
                />

                {/* Selection actions */}
                {sel && (
                  <div className="px-4 py-2 border-t border-slate-800 text-sm flex flex-wrap items-center gap-2">
                    <span className="text-slate-400">Actions for selection:</span>
                    <button
                      className="rounded-md border border-slate-700 px-2 py-1 hover:bg-slate-800"
                      onClick={() => askFor("rephrase")}
                    >
                      Rephrase
                    </button>
                    <button
                      className="rounded-md border border-slate-700 px-2 py-1 hover:bg-slate-800"
                      onClick={() => askFor("shorten")}
                    >
                      Shorten
                    </button>
                    <button
                      className="rounded-md border border-slate-700 px-2 py-1 hover:bg-slate-800"
                      onClick={() => askFor("quantify")}
                    >
                      Quantify
                    </button>
                    <button
                      className="rounded-md border border-slate-700 px-2 py-1 hover:bg-slate-800"
                      onClick={() => askFor("star")}
                    >
                      Make STAR
                    </button>
                  </div>
                )}

                {/* Suggestion area */}
                {suggestion && (
                  <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/50">
                    <div className="text-xs text-slate-400 mb-1">Suggestion:</div>
                    <div className="text-sm mb-2">{suggestion}</div>
                    <div className="flex gap-2">
                      <button
                        className="rounded-md bg-indigo-600 px-3 py-1.5 text-white"
                        onClick={() => replaceSelection(suggestion!)}
                      >
                        Replace selection
                      </button>
                      <button
                        className="rounded-md border border-slate-700 px-3 py-1.5"
                        onClick={() => setSuggestion(null)}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                <footer className="px-4 py-2 border-t border-slate-800 text-xs text-slate-400 flex justify-between">
                  <span>{resume.length} chars</span>
                  <span>Tip: ⌘/Ctrl + S to snapshot</span>
                </footer>
              </section>

              {/* Assistant Chat */}
              <section className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden flex flex-col shadow-sm">
                <header className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <h2 className="font-medium">Assistant Chat</h2>
                  <span className="text-xs text-slate-400">
                    Enter to send • Shift+Enter for newline
                  </span>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chat.length === 0 && (
                    <p className="text-slate-400 text-sm">
                      Ask for phrasing, impact verbs, or tailoring to a JD.
                    </p>
                  )}
                  {chat.map((m, i) => (
                    <div key={i} className={`max-w-[85%] ${m.role === "user" ? "ml-auto" : ""}`}>
                      <div
                        className={`px-3 py-2 rounded-xl text-sm border ${
                          m.role === "user"
                            ? "bg-indigo-500/10 border-indigo-400/30"
                            : "bg-slate-800/60 border-slate-700/60"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <div className="border-t border-slate-800 p-3">
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <textarea
                      className="bg-slate-800/60 border border-slate-700/70 rounded-xl px-3 py-2 outline-none resize-none min-h-[56px]"
                      placeholder="Write a strong bullet for my backend internship…"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={onKeyDown}
                    />
                    <button
                      onClick={handleSend}
                      disabled={sending || !input.trim()}
                      className="rounded-xl px-4 text-sm bg-indigo-500/90 hover:bg-indigo-500 text-white disabled:opacity-60"
                    >
                      {sending ? "Sending…" : "Send"}
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {/* ATS-ish JD Tailor Panel (will get more advanced in later chunks) */}
            <div className="mt-5">
              <JDPanel resume={resume} />
            </div>
          </>
        )}
      </main>

      {/* Toast */}
      {toast.msg && (
        <div className="fixed bottom-4 right-4 bg-slate-900/90 border border-slate-700 text-sm px-3 py-2 rounded-lg shadow">
          {toast.msg}
        </div>
      )}

      {/* Bullet Wizard Modal */}
      {showWizard && (
        <BulletWizard
          onInsert={(b) => {
            if (editorRef.current) {
              const el = editorRef.current;
              if (!sel) {
                const start = el.selectionStart ?? resume.length;
                const before = resume.slice(0, start);
                const after = resume.slice(start);
                const next = `${before}${
                  before && !before.endsWith("\n") ? "\n" : ""
                }${b}\n${after}`;
                setResume(next);
                debouncedSave(next);
              } else {
                replaceSelection(b);
              }
            } else {
              setResume((r) => `${r}${r.endsWith("\n") ? "" : "\n"}${b}\n`);
            }
          }}
          onClose={() => setShowWizard(false)}
        />
      )}
    </div>
  );
}
