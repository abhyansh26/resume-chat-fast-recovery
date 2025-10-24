# Resume Chat — Fast Session Recovery (Monorepo)

Folders:
- api/  -> FastAPI (Lambda)
- web/  -> React (Vite)
- load/ -> Locust (load tests, optional later)
- docs/ -> Diagrams & notes

Local run:
- API: uvicorn (LOCAL_DEV=1)
- Web: Vite dev server (points to http://127.0.0.1:8000)

## Setup (web)
1. Copy env: `cp web/.env.example web/.env`
2. Start API (port 8000), then in `web/`: `npm run dev`
