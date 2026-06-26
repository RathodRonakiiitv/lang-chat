"""Chat API routes — POST /chat, GET /history, DELETE /session."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.chains.chatbot import create_chain
from app.memory.store import clear_session, get_history, get_or_create_memory
from app.schemas import ChatRequest, ChatResponse, HistoryResponse

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Send a message and receive a reply.

    When ``stream=True`` the response is a ``text/plain`` stream of tokens
    instead of the standard JSON envelope.
    """
    try:
        memory = get_or_create_memory(req.session_id)
        chain = create_chain(memory)

        if req.stream:
            # Stream tokens one-by-one for a polished, real-time UX
            async def token_generator():
                async for chunk in chain.astream(
                    {"input": req.message}
                ):
                    if "response" in chunk:
                        yield chunk["response"]

            return StreamingResponse(token_generator(), media_type="text/plain")

        # Standard JSON response
        result = await chain.ainvoke(
            {"input": req.message}
        )
        return ChatResponse(
            session_id=req.session_id,
            reply=result["response"],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{session_id}", response_model=HistoryResponse)
async def get_chat_history(session_id: str):
    """Retrieve the full conversation history for a session."""
    return HistoryResponse(
        session_id=session_id,
        messages=get_history(session_id),
    )


@router.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Clear all memory for a session."""
    success = clear_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": f"Session {session_id} cleared"}
