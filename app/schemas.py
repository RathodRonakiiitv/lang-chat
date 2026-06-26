from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class ChatRequest(BaseModel):
    """Request body for the chat endpoint."""

    session_id: str = Field(..., min_length=1, max_length=64, description="Unique session identifier")
    message: str = Field(..., min_length=1, max_length=2000, description="User message to send")
    stream: bool = Field(default=False, description="Enable token-by-token streaming response")


class ChatResponse(BaseModel):
    """Standard (non-streaming) chat response."""

    session_id: str
    reply: str
    tokens_used: Optional[int] = None


class HistoryResponse(BaseModel):
    """Response containing the conversation history for a session."""

    session_id: str
    messages: List[Dict[str, Any]]
