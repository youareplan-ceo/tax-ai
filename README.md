# YouaPlan EasyTax – v8 Source (FastAPI + PWA)
## Run
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8080

## UI (dev)
python -m http.server 5173 -d ui
