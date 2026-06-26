"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.chat import router

app = FastAPI(
    title="LangChain Chatbot API",
    description="A production-ready conversational AI API with multi-session memory and streaming",
    version="1.0.0",
)

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health")
async def health():
    """Liveness probe — returns 200 when the service is running."""
    return {"status": "ok"}
