from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import threading
import logging

from app.routers import subscription, notice, test_page

try:
    from app.scheuler import run_scheduler
except Exception as e:
    logging.getLogger(__name__).warning("scheduler disabled: %s", e)
    run_scheduler = None

app = FastAPI(title="ssu-chapel backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(subscription.router)
app.include_router(notice.router)
app.include_router(test_page.router)


@app.get("/health")
async def health() -> JSONResponse:
    return JSONResponse({"status": "ok"})


@app.on_event("startup")
def start_scheduler():
    if run_scheduler is None:
        return
    t = threading.Thread(target=run_scheduler)
    t.daemon = True
    t.start()
