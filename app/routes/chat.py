"""Chat API routes — POST /chat, GET /history, DELETE /session."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.chains.chatbot import create_agent
from app.memory.store import clear_session, get_history, get_or_create_memory
from app.schemas import ChatRequest, ChatResponse, HistoryResponse

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/", response_model=ChatResponse)
async def chat(req: ChatRequest):
    try:
        memory = get_or_create_memory(req.session_id)
        agent = create_agent()
        
        # Safely convert messages from Redis for langgraph compatibility
        history_messages = []
        for msg in memory.chat_memory.messages:
            if isinstance(msg, dict):
                role = "user" if msg.get("type") == "human" or msg.get("role") == "human" else "assistant"
                content = msg.get("content", "")
            else:
                role = "user" if getattr(msg, "type", "") == "human" else "assistant"
                content = getattr(msg, "content", "")
            history_messages.append((role, content))
        
        messages_input = history_messages + [("user", req.message)]

        if req.stream:
            async def token_generator():
                final_content = ""
                async for event in agent.astream_events(
                    {"messages": messages_input},
                    version="v2"
                ):
                    kind = event["event"]
                    if kind == "on_chat_model_stream":
                        chunk = event["data"]["chunk"]
                        # Filter out tool_calls from final output
                        if chunk.content and not chunk.tool_call_chunks:
                            final_content += chunk.content
                            yield chunk.content
                
                # Save to redis memory manually after streaming ends
                memory.save_context({"input": req.message}, {"output": final_content})

            return StreamingResponse(token_generator(), media_type="text/plain")

        # Standard JSON response
        result = await agent.ainvoke({"messages": messages_input})
        final_output = result["messages"][-1].content
        memory.save_context({"input": req.message}, {"output": final_output})
        
        return ChatResponse(
            session_id=req.session_id,
            reply=final_output,
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
