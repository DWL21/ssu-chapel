from fastapi import FastAPI
from fastapi.responses import JSONResponse
import threading
from scheduler import run_scheduler

app = FastAPI(title="ssu-chapel backend", version="0.1.0")


@app.get("/health")
async def health() -> JSONResponse:
    return JSONResponse({"status": "ok"})


@app.on_event("startup")
def start_scheduler():
    t = threading.Thread(target=run_scheduler)
    t.daemon = True
    t.start()