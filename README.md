# Remove BG Browser App

A browser-first background remover using FastAPI + rembg.

## Local run

1. Extract the ZIP.
2. Double click `START-WEBSITE.bat`.
3. Open `http://127.0.0.1:7000`.

## Deploy online

### Render
- Push this folder to GitHub.
- Create a new Web Service on Render.
- Render will detect `render.yaml`.
- Deploy, then open your Render URL.

### Railway
- Push to GitHub.
- Create a new project from GitHub repo.
- Start command:
  `uvicorn app:app --host 0.0.0.0 --port $PORT`

## Notes
- First run can take longer because rembg downloads its model.
- The website frontend is served by the same backend, so it works in the browser like a real app.
