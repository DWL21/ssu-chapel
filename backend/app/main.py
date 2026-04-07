from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI(title="ssu-chapel backend", version="0.1.0")


@app.get("/health")
async def health() -> JSONResponse:
    return JSONResponse({"status": "ok"})
