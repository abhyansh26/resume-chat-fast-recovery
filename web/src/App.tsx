import { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { getSession, saveResume, sendChat } from "./api";

type Msg = { role: "user" | "assistant"; text: string; ts?: number };

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function useSessionId() {
  return useMemo(() => {
    let id = localStorage.getItem("sessionId");
    if (!id) {
      id = uuidv4();
      localStorage.setItem("sessionId", id);
    }
    return id;
  }, []);
}

function SavePill({ state }: { state: "idle" | "saving" | "saved" }) {
  if (state === "idle") return null;
  return (
    <span
      className={
        "ml-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium " +
        (state === "saving"
          ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30"
          : "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30")
      }
      aria-live="polite"
    >
      <span
        className={
          "h-1.5 w-1.5 rounded-full " +
          (state === "saving"
            ? "bg-amber-400 animate-pulse"
            : "bg-emerald-400")
        }
      />
      {state === "saving" ? "Saving…" : "Saved"}
    </span>
  );
}

export default function App() {
  const sessionId = useSessionId();
  const [resume, setResume] = useState("");
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [chat, setChat] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const saveTimer = useRef<number | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Load existing session from backend
  useEffect(() => {
    (async () => {
      try {
        const data = await getSession(sessionId);
        setResume(data.resume || "");
        setChat(data.chat || []);
      } catch (e) {
        console.error(e);
        alert("Failed to load session");
      }
    })();
  }, [sessionId]);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chat]);

  // 🧊 Cold snapshot trigger when user closes or refreshes the tab
  useEffect(() => {
    const handleUnload = () => {
      if (!sessionId) return;
      try {
        const url = `${API_BASE}/snapshot/${sessionId}`;
        const blob = new Blob([], { type: "application/json" }); // minimal body to make it POST
        navigator.sendBeacon(url, blob);
      } catch (err) {
        console.error("Failed to send snapshot on unload:", err);
      }
    };
  
    window.addEventListener("visibilitychange", () => {
      // Backup also when user switches away (optional safety)
      if (document.visibilityState === "hidden") handleUnload();
    });
    window.addEventListener("beforeunload", handleUnload);
  
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("visibilitychange", handleUnload);
    };
  }, [sessionId]);

  // Resume editor autosave logic
  function onResumeChange(next: string) {
    setResume(next);
    setSaving("saving");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      try {
        await saveResume(sessionId, next);
        setSaving("saved");
        setTimeout(() => setSaving("idle"), 900);
      } catch {
        setSaving("idle");
        alert("Failed to save. Please retry.");
      }
    }, 900);
  }

  // Chat send logic
  async function onSend() {
    const trimmed = input.trim();
    if (!trimmed) return;
    const userMsg: Msg = { role: "user", text: trimmed, ts: Date.now() };
    setChat((prev) => [...prev, userMsg]);
    setInput("");
    try {
      const res = await sendChat(sessionId, trimmed);
      const assistant: Msg = {
        role: "assistant",
        text: res.assistantMessage,
        ts: Date.now(),
      };
      setChat((prev) => [...prev, assistant]);
    } catch {
      alert("Failed to send chat. Try again.");
    }
  }

  // Manual backup trigger
  async function handleBackupNow() {
    try {
      const res = await fetch(`${API_BASE}/snapshot/${sessionId}`, {
        method: "POST",
      });
      if (res.ok) {
        alert("✅ Backup saved to S3!");
      } else {
        alert("❌ Backup failed — check logs.");
      }
    } catch (err) {
      console.error("Backup failed:", err);
      alert("❌ Backup failed — network error.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-800/70 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-emerald-400 shadow-md" />
            <h1 className="text-lg font-semibold tracking-tight">
              Resume Chat — Fast Recovery
            </h1>
          </div>
          <div className="flex items-center text-xs text-slate-300">
            <span className="truncate max-w-[140px] rounded-md bg-slate-800/80 px-2 py-1 ring-1 ring-slate-700/80">
              Session: {sessionId.slice(0, 8)}…
            </span>
            <SavePill state={saving} />
            <button
              onClick={handleBackupNow}
              className="ml-3 rounded-md border border-slate-700/70 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800/60"
            >
              💾 Backup Now
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 md:grid-cols-2">
        <section className="flex h-[80vh] flex-col rounded-2xl border border-slate-800/70 bg-slate-900/60 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <h2 className="text-sm font-medium text-slate-300">
              Resume Editor
            </h2>
            <span className="text-xs text-slate-400">
              {resume.trim().length} chars
            </span>
          </div>
          <textarea
            value={resume}
            onChange={(e) => onResumeChange(e.target.value)}
            placeholder="Start typing your resume here…"
            className="h-full flex-1 resize-none rounded-b-2xl bg-transparent px-4 pb-4 pt-3 font-mono text-sm leading-relaxed outline-none placeholder:text-slate-500 focus:ring-0"
          />
        </section>

        <section className="flex h-[80vh] flex-col rounded-2xl border border-slate-800/70 bg-slate-900/60 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <h2 className="text-sm font-medium text-slate-300">Chat</h2>
            <span className="text-[11px] text-slate-400">Assistant is ready</span>
          </div>

          <div
            ref={chatScrollRef}
            className="flex-1 space-y-3 overflow-y-auto p-4"
          >
            {chat.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-800/80 p-4 text-center text-sm text-slate-400">
                No messages yet — ask the assistant to improve a bullet point or tailor to a job posting.
              </div>
            )}
            {chat.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={
                    "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ring-1 " +
                    (m.role === "user"
                      ? "bg-indigo-500/15 text-indigo-100 ring-indigo-500/30"
                      : "bg-slate-800/60 text-slate-100 ring-slate-700/60")
                  }
                >
                  <div className="mb-0.5 text-[10px] uppercase tracking-wide opacity-70">
                    {m.role}
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {m.text}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 p-3">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey ? onSend() : undefined
                }
                placeholder="Ask for help with your resume…"
                className="flex-1 rounded-xl bg-slate-800/70 px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none ring-1 ring-slate-700/70 focus:ring-indigo-500/40"
              />
              <button
                onClick={onSend}
                disabled={!input.trim()}
                className="rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-indigo-900/30 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-6 pt-2 text-center text-[11px] text-slate-500">
        Cloud-native fast session recovery demo — DynamoDB (hot) + S3 snapshots (cold).
      </footer>
    </div>
  );
}