import logging

from fastapi import FastAPI

from app.api.predict import router as predict_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s %(message)s",
)

app = FastAPI(title="PlantDoc AI Service", version="1.0.0")
app.include_router(predict_router)


@app.get("/health")
def health():
    return {"status": "ok"}
