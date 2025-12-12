# Resume Chat with Fast Session Recovery

A cloud-native resume editor that **never loses your work** and helps you improve bullets using an AI assistant.

The app runs as a **two-pane editor**:

- **Left panel** – plain-text resume editor (autosave every ~700 ms of inactivity)
- **Right panel** – chat-based AI assistant (rephrase, shorten, quantify, STAR bullets)

All state is stored in the cloud so that a user can close the tab, change devices, or have their browser crash and still recover the same resume later.

---

## High-Level Architecture

**Frontend**

- React + TypeScript + Vite
- Served as a static SPA behind **AWS CloudFront**

**Backend**

- FastAPI application mounted on **AWS Lambda** via Mangum
- Exposed through **API Gateway** (REST HTTP endpoints)

**Storage**

- **DynamoDB** — “hot” store for the *current* resume text and recent chat history  
- **S3** — “cold” store for full JSON snapshots of a session (`sessions/<sessionId>/latest.json`)

**Session model**

- Browser generates a `sessionId` (UUID) and keeps it in `localStorage`
- All edits and chats are stored under that `sessionId` in DynamoDB
- Snapshots are written to S3 and can be used to rehydrate the session if the hot state is lost

---

## Repository Layout

```text
.
├── api/          # FastAPI backend (Lambda-friendly)
│   ├── main.py   # All API routes & storage logic
│   ├── requirements.txt
│   └── .env.example  # example env vars for local dev
├── web/          # React + Vite frontend
│   ├── src/
│   ├── package.json
│   └── .env.example  # points frontend to the backend
└── README.md
```

---

## How It Works (Short Version)

1. The browser loads the React SPA from CloudFront.
2. On first load, the app generates a `sessionId` and saves it in `localStorage`.
3. As you type in the resume editor:
   - Edits are **debounced (~700 ms)** and sent to `PUT /resume/{sessionId}`.
   - The backend writes the text into DynamoDB under `itemKey = "resume#latest"`.
4. When you use the AI assistant:
   - The UI calls `POST /chat` with `{ sessionId, message }`.
   - Lambda appends user + assistant messages to DynamoDB and returns the AI reply.
5. When you click “Snapshot”:
   - The API reads the latest resume + chat for that `sessionId`,
   - packs them into a `SessionPayload`, and writes
     `sessions/<sessionId>/latest.json` into the S3 snapshot bucket.
6. On a fresh tab or new device:
   - `GET /session/{sessionId}` first tries DynamoDB.
   - If DynamoDB is empty, it loads from S3 and **rehydrates** the hot store.

---

## Running Locally (No AWS Required)

Local mode uses **in-memory dictionaries** instead of DynamoDB/S3.  
You only need Python + Node.

### 1. Backend (FastAPI)

```bash
cd api

# Create and activate virtualenv (macOS / Linux)
python3 -m venv .venv
source .venv/bin/activate

# Install deps
pip install -r requirements.txt

# Copy example env and run in LOCAL_DEV mode
cp .env.example .env

# On macOS / Linux
export LOCAL_DEV=1

# Start API on http://127.0.0.1:8000
uvicorn main:app --reload --port 8000
```

You can check that it’s working with:

```bash
curl http://127.0.0.1:8000/health
# -> { "ok": true, "ts": ..., "local": true }
```

### 2. Frontend (React + Vite)

```bash
cd web

# Install npm deps
npm install

# Copy the example env (already points to http://127.0.0.1:8000)
cp .env.example .env

# Start Vite dev server (default: http://127.0.0.1:5173)
npm run dev
```

Open the URL printed by Vite and you should see:

- Left: resume editor with autosave status  
- Right: chat assistant that can rephrase bullets  

---

## Running Against Real AWS Resources (Production Mode)

For a real deployment you need:

- A DynamoDB table (default name: `Sessions`)
- An S3 bucket for snapshots (default: `resume-snapshots`)
- A Lambda function running `api/main.py`
- An API Gateway HTTP API pointing to the Lambda
- A CloudFront distribution serving the built frontend

### Backend env vars (used in `api/main.py`)

These are read by the backend:

- `LOCAL_DEV` — `"1"` for in-memory storage, `"0"` for AWS
- `DDB_TABLE` — DynamoDB table name (default: `Sessions`)
- `SNAPSHOT_BUCKET` — S3 bucket name for snapshots
- `LLM_PROVIDER` — `mock` (default), `groq`, or `openai`
- `GROQ_API_KEY` / `GROQ_MODEL` — only if using Groq
- `OPENAI_API_KEY` / `OPENAI_MODEL` — only if using OpenAI
- `ALLOWED_ORIGINS` — comma-separated list of allowed frontend origins

Set these as Lambda **environment variables** in the AWS console or via IaC  
(CloudFormation/Terraform/etc.). Do **not** store real values in Git.

### Frontend env vars

- `VITE_API_BASE_URL` — base URL of the API (e.g., `https://<api-id>.execute-api.us-east-1.amazonaws.com`)

This is set in `web/.env` (based on `web/.env.example`) and used in `web/src/api.ts`.

---

## Performance & Cloud vs Local

This repo is part of a graduate cloud computing project.  
We compare **local** vs **cloud** behavior:

- **Local (LOCAL_DEV=1)**
  - Storage: in-memory Python dicts
  - No network hop to AWS; great for fast iteration
  - State is lost when the process exits (no real durability)

- **Cloud (LOCAL_DEV=0)**
  - Storage: DynamoDB (hot) + S3 (cold snapshots)
  - Stronger durability and recoverability across crashes/devices
  - Automatically scalable API via Lambda + API Gateway
  - Observability via CloudWatch (invocations, errors, throttles, latency)

For load testing, you can write scripts that:

- Generate many unique `sessionId` values
- Call `/resume`, `/snapshot`, and `/chat` for each
- Compare:
  - **Response times** (p50/p95)
  - **Success vs 503 throttling**
  - **Throughput (requests/sec)**
  - **Resource usage** (Lambda duration, DynamoDB capacity)

The goal is to show **reproducible, cloud-backed behavior** versus purely local memory.

---

## Security Notes

- Never commit `.env` files or real API keys.
- AWS credentials must come from your local AWS CLI or environment, not from code.
- If you fork this repo:
  - Create your own DynamoDB table and S3 bucket.
  - Rotate any keys you accidentally exposed.

---

## Credits

- **Backend / cloud architecture:** FastAPI + Lambda, DynamoDB, S3, CloudWatch
- **Frontend:** React + Vite two-pane editor with autosave + AI helper
- **Original repo:** [`abhyansh26/resume-chat-fast-recovery`](https://github.com/abhyansh26/resume-chat-fast-recovery)

Enjoy hacking on it! 🙌
