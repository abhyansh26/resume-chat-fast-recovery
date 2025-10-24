import { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { getSession, saveResume, sendChat } from "./api";

type Msg = { role: "user" | "assistant"; text: string; ts?: number };

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

export default function App() {
  const sessionId = useSessionId();
  const [resume, setResume] = useState("");
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [chat, setChat] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const saveTimer = useRef<number | null>(null);

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

  function onResumeChange(next: string) {
    setResume(next);
    setSaving("saving");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      try {
        await saveResume(sessionId, next);
        setSaving("saved");
        setTimeout(() => setSaving("idle"), 800);
      } catch {
        setSaving("idle");
        alert("Failed to save. Please retry.");
      }
    }, 1000);
  }

  async function onSend() {
    const trimmed = input.trim();
    if (!trimmed) return;
    const userMsg: Msg = { role: "user", text: trimmed, ts: Date.now() };
    setChat(prev => [...prev, userMsg]);
    setInput("");

    try {
      const res = await sendChat(sessionId, trimmed);
      const assistant: Msg = { role: "assistant", text: res.assistantMessage, ts: Date.now() };
      setChat(prev => [...prev, assistant]);
    } catch {
      alert("Failed to send chat. Try again.");
    }
  }

  return (
    <div style={{display: "flex", height: "100vh", fontFamily: "system-ui", gap: 12, padding: 12}}>
      <div style={{flex: 1, display: "flex", flexDirection: "column"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
          <h2 style={{margin:0}}>Resume Editor</h2>
          <small>Session: {sessionId.slice(0,8)}… {saving === "saving" ? "Saving…" : saving === "saved" ? "Saved" : ""}</small>
        </div>
        <textarea
          value={resume}
          onChange={(e) => onResumeChange(e.target.value)}
          placeholder="Start typing your resume here…"
          style={{flex:1, width:"100%", resize:"none", padding:10, fontSize:14, lineHeight:1.4}}
        />
      </div>

      <div style={{width: "40%", display: "flex", flexDirection: "column"}}>
        <h2 style={{margin:0, marginBottom:8}}>Chat</h2>
        <div style={{flex:1, border:"1px solid #ddd", borderRadius:8, padding:10, overflowY:"auto"}}>
          {chat.map((m, i) => (
            <div key={i} style={{marginBottom:8, textAlign: m.role === "user" ? "right" : "left"}}>
              <div style={{
                display:"inline-block",
                padding:"8px 10px",
                borderRadius:8,
                background: m.role === "user" ? "#e8f0fe" : "#f1f3f4"
              }}>
                <strong style={{fontSize:12, opacity:0.7}}>{m.role}</strong><br/>
                <span>{m.text}</span>
              </div>
            </div>
          ))}
          {chat.length === 0 && <div style={{opacity:0.6}}>No messages yet</div>}
        </div>
        <div style={{display:"flex", gap:8, marginTop:8}}>
          <input
            value={input}
            onChange={(e)=>setInput(e.target.value)}
            onKeyDown={(e)=> e.key==="Enter" ? onSend() : undefined}
            placeholder="Ask for help with your resume…"
            style={{flex:1, padding:10, border:"1px solid #ddd", borderRadius:8}}
          />
          <button onClick={onSend} style={{padding:"10px 16px", borderRadius:8}}>Send</button>
        </div>
      </div>
    </div>
  );
}
