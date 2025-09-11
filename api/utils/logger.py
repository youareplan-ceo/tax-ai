import os, json, datetime
LOG_DIR = os.getenv("LOG_DIR","./logs")
os.makedirs(LOG_DIR, exist_ok=True)
def log_jsonl(record: dict, name: str = "ai_calls"):
    path = os.path.join(LOG_DIR, f"{name}.jsonl")
    record = dict(record)
    record.setdefault("ts", datetime.datetime.utcnow().isoformat()+"Z")
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
    return path
