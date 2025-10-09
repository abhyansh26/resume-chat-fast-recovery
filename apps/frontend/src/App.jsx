import React, { useEffect, useRef, useState } from 'react'

export default function App() {
  const [connected, setConnected] = useState(false)
  const [log, setLog] = useState([])
  const [input, setInput] = useState('')
  const wsRef = useRef(null)
  const [resumeText, setResumeText] = useState('Type your resume here...')
  const saveTimer = useRef(null)

  const connect = () => {
    if (wsRef.current) wsRef.current.close()
    const ws = new WebSocket('ws://localhost:8000/ws')
    ws.onopen = () => setConnected(true)
    ws.onmessage = (e) => setLog((L) => [...L, e.data])
    ws.onclose = () => setConnected(false)
    wsRef.current = ws
  }

  const send = () => {
    if (!wsRef.current || wsRef.current.readyState !== 1) return
    wsRef.current.send(input)
    setInput('')
  }

  // Simple autosave demo (console log)
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      console.log('[autosave] ', resumeText.slice(0, 40) + '...')
    }, 500)
    return () => clearTimeout(saveTimer.current)
  }, [resumeText])

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 16, display: 'grid', gap: 16 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Resume Chat (MVP)</h1>
        <button onClick={connect}>{connected ? 'Reconnect' : 'Connect'}</button>
      </header>

      <main style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <section>
          <h2>Resume Editor</h2>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            rows={20}
            style={{ width: '100%' }}
          />
          <p style={{ opacity: 0.7, fontSize: 12 }}>
            Autosave demo logs to console every ~0.5s after typing stops.
          </p>
        </section>

        <section>
          <h2>Chat</h2>
          <div style={{ border: '1px solid #ccc', padding: 8, height: 320, overflow: 'auto', background: '#fafafa' }}>
            {log.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message"
              style={{ flex: 1 }}
            />
            <button onClick={send} disabled={!connected}>Send</button>
          </div>
          <p style={{ opacity: 0.7, fontSize: 12 }}>
            WebSocket at <code>ws://localhost:8000/ws</code>. Backend must be running.
          </p>
        </section>
      </main>
    </div>
  )
}
