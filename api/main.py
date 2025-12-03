# main.py
import os, json, time
from typing import List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from pydantic import BaseModel
import httpx

# ---------------- Env ----------------
LOCAL_DEV = os.getenv("LOCAL_DEV", "0") == "1"
DDB_TABLE = os.getenv("DDB_TABLE", "Sessions")
S3_BUCKET = os.getenv("SNAPSHOT_BUCKET", "resume-snapshots")

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "mock").lower()  # mock | groq | openai
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL   = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL   = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

ALLOWED_ORIGINS_ENV = os.getenv("ALLOWED_ORIGINS", "")

# ---------------- App ----------------
app = FastAPI(title="Resume Chat API")

# ---- CORS: allow all configured origins, or "*" as a fallback ----
allowed_origins = [o.strip() for o in ALLOWED_ORIGINS_ENV.split(",") if o.strip()]
if not allowed_origins:
    # fallback – used only if env var is empty
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- Models ----------------
class SessionPayload(BaseModel):
    resume: str
    chat: List[dict]

class ResumeUpdate(BaseModel):
    text: str

class ChatRequest(BaseModel):
    sessionId: str
    message: str

# ---------------- Storage ----------------
if LOCAL_DEV:
    _mem_resume: dict[str, str] = {}
    _mem_chat: dict[str, List[dict]] = {}
else:
    import boto3
    from boto3.dynamodb.conditions import Key
    ddb = boto3.resource("dynamodb").Table(DDB_TABLE)
    s3 = boto3.client("s3")

def now_ms() -> int:
    return int(time.time() * 1000)

def save_resume(session_id: str, text: str):
    if LOCAL_DEV:
        _mem_resume[session_id] = text
        return
    ddb.put_item(Item={
        "sessionId": session_id,
        "itemKey": "resume#latest",
        "text": text,
        "updatedAt": now_ms(),
    })

def get_resume(session_id: str) -> Optional[str]:
    if LOCAL_DEV:
        return _mem_resume.get(session_id)
    resp = ddb.get_item(Key={"sessionId": session_id, "itemKey": "resume#latest"})
    return resp.get("Item", {}).get("text")

def append_chat(session_id: str, role: str, text: str, ts: Optional[int] = None):
    ts = ts or now_ms()
    if LOCAL_DEV:
        _mem_chat.setdefault(session_id, []).append({"role": role, "text": text, "ts": ts})
        return
    ddb.put_item(Item={
        "sessionId": session_id,
        "itemKey": f"chat#{ts}",
        "role": role,
        "text": text,
        "ts": ts,
    })

def list_chat(session_id: str, last_n: int = 50) -> List[dict]:
    if LOCAL_DEV:
        return _mem_chat.get(session_id, [])[-last_n:]
    resp = ddb.query(
        KeyConditionExpression=Key("sessionId").eq(session_id) & Key("itemKey").begins_with("chat#"),
        ScanIndexForward=True,
    )
    items = resp.get("Items", [])
    msgs = [{"role": it["role"], "text": it["text"], "ts": it["ts"]} for it in items]
    return msgs[-last_n:]

def write_snapshot(session_id: str, payload: SessionPayload):
    if LOCAL_DEV:
        return
    s3.put_object(
        Bucket=S3_BUCKET,
        Key=f"sessions/{session_id}/latest.json",
        Body=json.dumps(payload.model_dump()).encode("utf-8"),
        ContentType="application/json",
    )

def read_snapshot(session_id: str) -> Optional[SessionPayload]:
    if LOCAL_DEV:
        return None
    try:
        obj = s3.get_object(Bucket=S3_BUCKET, Key=f"sessions/{session_id}/latest.json")
        data = json.loads(obj["Body"].read().decode("utf-8"))
        return SessionPayload(**data)
    except Exception:
        return None

def rehydrate_from_snapshot(session_id: str) -> Optional[SessionPayload]:
    snap = read_snapshot(session_id)
    if not snap:
        return None
    save_resume(session_id, snap.resume)
    for msg in snap.chat:
        append_chat(session_id, msg["role"], msg["text"], msg.get("ts"))
    return snap

# ---------------- LLM ----------------
def generate_reply(prompt: str) -> str:
    """
    Returns a rewritten resume bullet or assistant text.
    Provider controlled by env var LLM_PROVIDER: mock | groq | openai
    """
    if LLM_PROVIDER == "groq":
        if not GROQ_API_KEY:
            return "LLM not configured (missing GROQ_API_KEY)."
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": GROQ_MODEL,
                "messages": [
                    {"role": "system", "content": "You are a concise resume assistant. Improve clarity, impact, and metrics."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.4,
                "max_tokens": 120,
            }
            with httpx.Client(timeout=20) as client:
                r = client.post(url, headers=headers, json=payload)
                r.raise_for_status()
                data = r.json()
                return data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            return f"LLM error (groq): {str(e)}"

    if LLM_PROVIDER == "openai":
        if not OPENAI_API_KEY:
            return "LLM not configured (missing OPENAI_API_KEY)."
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": OPENAI_MODEL,
                "messages": [
                    {"role": "system", "content": "You are a concise resume assistant. Improve clarity, impact, and metrics."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.4,
                "max_tokens": 120,
            }
            with httpx.Client(timeout=20) as client:
                r = client.post(url, headers=headers, json=payload)
                r.raise_for_status()
                data = r.json()
                return data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            return f"LLM error (openai): {str(e)}"

    # Fallback mock
    return f"Here’s a clearer version: {prompt}"

# ---------------- Routes ----------------
@app.get("/")
def root():
    return {"ok": True, "hint": "See /health, /session/{id}, /chat"}

@app.get("/health")
def health():
    return {"ok": True, "ts": now_ms(), "local": LOCAL_DEV}

@app.get("/llm/status")
def llm_status():
    provider = LLM_PROVIDER
    has_key = bool(GROQ_API_KEY or OPENAI_API_KEY)
    return {"provider": provider, "apiKeyPresent": has_key, "model": GROQ_MODEL if provider == "groq" else OPENAI_MODEL}

@app.get("/session/{sessionId}")
def get_session(sessionId: str):
    resume = get_resume(sessionId)
    chat = list_chat(sessionId)
    if (resume is None) and (not chat):
        start = now_ms()
        snap = rehydrate_from_snapshot(sessionId)
        if snap:
            return {"resume": snap.resume, "chat": snap.chat, "rehydratedInMs": now_ms() - start}
        return {"resume": "", "chat": []}
    return {"resume": resume or "", "chat": chat}

@app.put("/resume/{sessionId}")
def put_resume(sessionId: str, body: ResumeUpdate):
    save_resume(sessionId, body.text)
    return {"saved": True, "updatedAt": now_ms()}

@app.post("/chat")
def post_chat(req: ChatRequest):
    append_chat(req.sessionId, "user", req.message)
    reply = generate_reply(req.message)
    append_chat(req.sessionId, "assistant", reply)
    return {"assistantMessage": reply}

@app.post("/snapshot/{sessionId}")
def snapshot(sessionId: str):
    payload = SessionPayload(resume=get_resume(sessionId) or "", chat=list_chat(sessionId))
    write_snapshot(sessionId, payload)
    return {"snapshotted": True, "countMessages": len(payload.chat)}

# Lambda handler
handler = Mangum(app)
