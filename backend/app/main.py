import logging
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("plantdoc")

# Raw FastAPI App
app = FastAPI(
    title="PlantDoc AI API",
    version="1.0.0",
    description="Unified FastAPI Backend for PlantDoc AI",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ASGI Middleware to handle Vercel Serverless Path Rewrites
class VercelPathMiddleware:
    """
    Normalizes ASGI request paths when running inside Vercel Serverless Functions.
    Strips internal function paths like /api/index.py, /api/index, /api/main.py to restore root /docs and /health.
    """
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            path = scope.get("path", "")
            for prefix in ["/api/index.py", "/api/index", "/api/main.py", "/api/main"]:
                if path.startswith(prefix):
                    path = path[len(prefix):]
                    if not path.startswith("/"):
                        path = "/" + path
                    scope["path"] = path
                    break
        await self.app(scope, receive, send)


app.add_middleware(VercelPathMiddleware)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        loc = ".".join([str(x) for x in err.get("loc", []) if x not in ("body", "query", "path")])
        errors.append({"path": loc or "body", "message": err.get("msg", "Invalid input")})
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "success": False,
            "message": "Validation failed",
            "errors": errors,
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict):
        content = exc.detail
        if "success" not in content:
            content["success"] = False
    else:
        content = {
            "success": False,
            "message": str(exc.detail),
        }
    return JSONResponse(status_code=exc.status_code, content=content)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception occurred: %s", str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "Internal server error",
        },
    )


@app.get("/")
async def root():
    return {
        "success": True,
        "message": "🌱 PlantDoc AI Backend is Live!",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "plantdoc-backend"}


app.include_router(api_router)
