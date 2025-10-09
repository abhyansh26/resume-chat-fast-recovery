# Resume Chat with Fast Session Recovery — Starter

This is a starter repo for the Resume Chat MVP.

## Structure
```
apps/
  backend/      # FastAPI + WebSocket echo
  frontend/     # React (Vite) editor + chat shell
infra/
  terraform/    # Terraform skeleton
.github/
  workflows/    # GitHub Actions CI
```

## Quickstart (local dev)

### Backend
```bash
cd apps/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd apps/frontend
npm install
npm run dev  # opens http://localhost:5173
```

### Open the app
- Frontend dev server: http://localhost:5173
- Backend: http://localhost:8000/healthz

## CI
- GitHub Actions builds backend tests and frontend build on every PR.

## Next Steps
- Fill in AWS/Terraform and connect CI deploy when ready.
