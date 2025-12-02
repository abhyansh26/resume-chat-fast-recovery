// web/src/pages/Builder.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { getSession, saveResume, sendChat, snapshotSession } from "../api";
import BulletWizard from "../components/BulletWizard";
import JDPanel from "../components/JDPanel";
import TemplatePicker from "../components/TemplatePicker";
import type { ResumeModel } from "../types/resumeModel";

function useDebouncedCallback<T extends (...args: any[]) => any>(fn: T, delay = 700) {
  const t = useRef<number | undefined>(undefined);
  return (...args: Parameters<T>) => {
    if (t.current) window.clearTimeout(t.current);
    // @ts-ignore
    t.current = window.setTimeout(() => fn(...args), delay);
  };
}

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
  const [sessionId, setSessionId] = useState(() => {
    const existing = localStorage.getItem("sessionId");
    if (existing) return existing;
    const s = uuidv4();
    localStorage.setItem("sessionId", s);
    return s;
  });

  // ---- App state ----
  const [resume, setResume] = useState("");
  const [resumeModel, setResumeModel] = useState<ResumeModel | null>(null);
  const [chat, setChat] = useState<{ role: "user" | "assistant"; text: string; ts?: number }[]>([]);

  // Load state
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [snapshotState, setSnapshotState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // chat / AI calls
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // resume helpers
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const [sel, setSel] = useState<{ start: number; end: number; text: string } | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [metricsIdeas, setMetricsIdeas] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  const toast = useToast();
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // ---- Initial load ----
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const data = await getSession(sessionId);
        if (!ignore) {
          setResume(data.resume || "");
          setChat(data.chat || []);
          setLoadErr(null);
          // For now, resumeModel stays null until a template is applied.
        }
      } catch (e: any) {
        if (!ignore) setLoadErr(e?.message || "Failed to load session");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [sessionId]);

  // ---- Autosave resume (debounced) ----
  const debouncedSave = useDebouncedCallback(async (text: string) => {
    try {
      setSaveState("saving");
      await saveResume(sessionId, text);
      setSaveState("saved");
      toast.show("Saved ✓");
      setTimeout(() => setSaveState("idle"), 1000);
    } catch {
      setSaveState("error");
      toast.show("Save failed ⚠️");
      setTimeout(() => setSaveState("idle"), 1500);
    }
  }, 700);

  function onResumeChange(next: string) {
    setResume(next);
    debouncedSave(next);
  }

  // ---- selection helpers ----
  function captureSelection() {
    const el = editorRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const text = (resume || "").slice(start, end);
    setSel(text && start !== end ? { start, end, text } : null);
    // When user changes selection, clear previous suggestions/metrics
    setSuggestion(null);
    setMetricsIdeas(null);
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
    setMetricsIdeas(null);
  }

  // Insert suggestion as a new bullet below the current selection
  function insertSuggestionBelow(text: string) {
    if (!sel) return;
    const full = resume;
    const newlineIndex = full.indexOf("\n", sel.end);

    let before: string;
    let after: string;

    if (newlineIndex === -1) {
      // No newline after selection → append at end
      before = full.endsWith("\n") ? full : full + "\n";
      after = "";
    } else {
      before = full.slice(0, newlineIndex + 1);
      after = full.slice(newlineIndex + 1);
    }

    // Try to preserve bullet prefix if present
    const trimmed = sel.text.trimStart();
    let prefix = "- ";
    if (trimmed.startsWith("- ")) prefix = "- ";
    else if (trimmed.startsWith("• ")) prefix = "• ";
    else if (trimmed.startsWith("* ")) prefix = "* ";

    const newLine = `${prefix}${text}`;
    const next = `${before}${newLine}\n${after}`;

    setResume(next);
    debouncedSave(next);
    setSel(null);
    setSuggestion(null);
    setMetricsIdeas(null);
    toast.show("Inserted below");
  }

  // ---- Send chat (assistant box) ----
  async function handleSend() {
    const msg = input.trim();
    if (!msg || sending) return;
    setSending(true);
    try {
      setChat((c) => [...c, { role: "user", text: msg, ts: Date.now() }]);
      setInput("");
      const res = await sendChat(sessionId, msg);
      const assistantMessage = res.assistantMessage ?? "(no reply)";
      setChat((c) => [...c, { role: "assistant", text: assistantMessage, ts: Date.now() }]);
    } catch {
      setChat((c) => [
        ...c,
        {
          role: "assistant",
          text: "⚠️ Failed to reach assistant.",
          ts: Date.now(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  // ---- Quick Actions on selected text ----
  async function askFor(kind: "rephrase" | "shorten" | "quantify" | "star") {
    if (!sel?.text || sending) return;

    const instructions: Record<string, string> = {
      rephrase:
        "Rephrase this resume bullet to be more concise, professional, and impact-focused. Keep it one bullet:",
      shorten:
        "Shorten this resume bullet while keeping the key action, tools, and impact. Keep it one bullet:",
      quantify:
        "Rewrite this resume bullet to include realistic, measurable impact using numbers or percentages. " +
        "If exact numbers are unknown, you may use placeholders like X%, Y, N as a hint:",
      star:
        "Rewrite this resume bullet in STAR format (Situation, Task, Action, Result) but keep it in one concise bullet line:",
    };

    setSending(true);
    try {
      const prompt = `${instructions[kind]}\n\nCurrent bullet:\n${sel.text}`;
      const res = await sendChat(sessionId, prompt);
      const reply = res.assistantMessage ?? "";
      setSuggestion(reply || null);
      setMetricsIdeas(null); // clear metrics to avoid confusion

      // Also add to chat stream for traceability
      setChat((c) => [
        ...c,
        {
          role: "user",
          text: `[${kind.toUpperCase()}] on selection:\n${sel.text}`,
          ts: Date.now(),
        },
        {
          role: "assistant",
          text: reply || "(no suggestion)",
          ts: Date.now(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  // ---- Metrics helper for a selected bullet ----
  async function askMetricsHelper() {
    if (!sel?.text || sending) return;
    setSending(true);
    try {
      const prompt =
        "You are helping improve a resume bullet by adding measurable impact. " +
        "Given this bullet, suggest 3–5 specific metrics I could use, such as X%, N users, $Y saved, or time reductions. " +
        "If exact numbers are unknown, use placeholders like X%, N, or Y.\n\n" +
        "Bullet:\n" +
        sel.text;

      const res = await sendChat(sessionId, prompt);
      const reply = res.assistantMessage ?? "";
      setMetricsIdeas(reply || null);

      setChat((c) => [
        ...c,
        {
          role: "user",
          text: `[METRICS HELPER] for selection:\n${sel.text}`,
          ts: Date.now(),
        },
        {
          role: "assistant",
          text: reply || "(no metrics ideas)",
          ts: Date.now(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  // ---- Chat keyboard behavior ----
  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ---- Snapshot button ----
  async function handleSnapshot() {
    try {
      setSnapshotState("saving");
      await snapshotSession(sessionId);
      setSnapshotState("saved");
      toast.show("Snapshot saved ✓");
      setTimeout(() => setSnapshotState("idle"), 1000);
    } catch {
      setSnapshotState("error");
      toast.show("Snapshot failed ⚠️");
      setTimeout(() => setSnapshotState("idle"), 1500);
    }
  }

  // ---- Copy session id / new session / export resume ----
  async function copySession() {
    await navigator.clipboard.writeText(sessionId);
    toast.show("Session ID copied");
  }
  function newSession() {
    const s = uuidv4();
    localStorage.setItem("sessionId", s);
    setSessionId(s);
    setResume("");
    setResumeModel(null);
    setChat([]);
    setSel(null);
    setSuggestion(null);
    setMetricsIdeas(null);
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
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ---- Auto-scroll chat ----
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.length]);

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

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      {/* Header (page toolbar) */}
      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60 border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-indigo-500/20 border border-indigo-400/40 grid place-items-center">
              🗂️
            </div>
            <div>
              <h2 className="text-lg font-semibold">Resume Builder</h2>
              <p className="text-xs text-slate-400">
                Session:{" "}
                <span className="font-mono">
                  {sessionId.slice(0, 8)}…
                </span>
                <button
                  onClick={copySession}
                  className="ml-2 text-indigo-300 hover:text-indigo-200 underline underline-offset-2"
                >
                  copy
                </button>
                {resumeModel && (
                  <span className="ml-3 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    Structured template active
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWizard(true)}
              className="text-xs rounded-lg border border-slate-700 px-3 py-1.5 hover:bg-slate-800"
            >
              Bullet Wizard
            </button>
            <button
              onClick={exportResume}
              className="text-xs rounded-lg border border-slate-700 px-3 py-1.5 hover:bg-slate-800"
              title="Download resume.txt"
            >
              Export
            </button>
            <button
              onClick={newSession}
              className="text-xs rounded-lg border border-slate-700 px-3 py-1.5 hover:bg-slate-800"
              title="Start a fresh session"
            >
              New
            </button>
            <span
              className={`text-xs px-2 py-1 rounded ${
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
              className="text-sm rounded-xl border border-slate-700 px-4 py-2 hover:bg-slate-800 disabled:opacity-60"
              title="Write a durable snapshot (⌘/Ctrl + S)"
            >
              {snapshotLabel}
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        {loading ? (
          <div className="text-slate-400">Loading session…</div>
        ) : loadErr ? (
          <div className="text-rose-300">⚠️ {loadErr}</div>
        ) : (
          <>
            {/* Editor + Chat */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Resume Editor */}
              <section className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden flex flex-col shadow-sm">
                <header className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="font-medium">Resume Editor</h3>
                  <span className="text-xs text-slate-400">Autosaves while you type</span>
                </header>

                {/* Template picker */}
                <TemplatePicker
                  onApplyTemplate={(tmplText, tmplModel) => {
                    setResume(tmplText);
                    setResumeModel(tmplModel);
                    debouncedSave(tmplText);
                    setSel(null);
                    setSuggestion(null);
                    setMetricsIdeas(null);
                    toast.show("Template applied");
                  }}
                />

                <textarea
                  ref={editorRef}
                  onSelect={captureSelection}
                  onKeyUp={captureSelection}
                  className="flex-1 bg-transparent p-4 outline-none resize-none font-mono text-sm leading-relaxed min-h-[360px]"
                  placeholder="Paste or start your resume here… or pick a template above to jump-start."
                  value={resume}
                  onChange={(e) => onResumeChange(e.target.value)}
                />

                {/* Quick Actions (AI on selection) */}
                {sel && (
                  <div className="px-4 py-2 border-t border-slate-800 text-sm flex flex-wrap items-center gap-2">
                    <span className="text-slate-400 mr-1">Actions for selection:</span>
                    <button
                      className="rounded-md border border-slate-700 px-2 py-1 hover:bg-slate-800"
                      onClick={() => askFor("rephrase")}
                      disabled={sending}
                    >
                      Rephrase
                    </button>
                    <button
                      className="rounded-md border border-slate-700 px-2 py-1 hover:bg-slate-800"
                      onClick={() => askFor("shorten")}
                      disabled={sending}
                    >
                      Shorten
                    </button>
                    <button
                      className="rounded-md border border-slate-700 px-2 py-1 hover:bg-slate-800"
                      onClick={() => askFor("quantify")}
                      disabled={sending}
                    >
                      Quantify
                    </button>
                    <button
                      className="rounded-md border border-slate-700 px-2 py-1 hover:bg-slate-800"
                      onClick={() => askFor("star")}
                      disabled={sending}
                    >
                      Make STAR
                    </button>
                    <button
                      className="rounded-md border border-amber-500/60 text-amber-300 px-2 py-1 hover:bg-slate-800"
                      onClick={askMetricsHelper}
                      disabled={sending}
                    >
                      Metrics helper
                    </button>
                  </div>
                )}

                {/* Suggestion box */}
                {suggestion && (
                  <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/50">
                    <div className="text-xs text-slate-400 mb-1">Suggestion:</div>
                    <div className="text-sm mb-3 whitespace-pre-line">{suggestion}</div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-md bg-indigo-600 px-3 py-1.5 text-white text-xs"
                        onClick={() => replaceSelection(suggestion!)}
                      >
                        Replace selection
                      </button>
                      <button
                        className="rounded-md border border-slate-700 px-3 py-1.5 text-xs"
                        onClick={() => insertSuggestionBelow(suggestion!)}
                      >
                        Insert below selection
                      </button>
                      <button
                        className="rounded-md border border-slate-700 px-3 py-1.5 text-xs"
                        onClick={() => setSuggestion(null)}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {/* Metrics ideas box */}
                {metricsIdeas && (
                  <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/40">
                    <div className="text-xs text-amber-300 mb-1">Metrics helper ideas:</div>
                    <div className="text-sm mb-2 whitespace-pre-line">{metricsIdeas}</div>
                    <p className="text-[11px] text-slate-400">
                      Tip: Use these numbers (or placeholders like X%, N, Y) when editing the bullet above.
                    </p>
                    <div className="mt-2">
                      <button
                        className="rounded-md border border-slate-700 px-3 py-1.5 text-xs"
                        onClick={() => setMetricsIdeas(null)}
                      >
                        Hide metrics ideas
                      </button>
                    </div>
                  </div>
                )}

                <footer className="px-4 py-2 border-t border-slate-800 text-xs text-slate-400 flex justify-between">
                  <span>{resume.length} chars</span>
                  <span>Tip: Select a bullet to see AI actions • ⌘/Ctrl + S to snapshot</span>
                </footer>
              </section>

              {/* Chat Panel */}
              <section className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden flex flex-col shadow-sm">
                <header className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="font-medium">Assistant Chat</h3>
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

            {/* ATS-ish JD Tailor Panel */}
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
                const next = `${before}${before && !before.endsWith("\n") ? "\n" : ""}${b}\n${after}`;
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
