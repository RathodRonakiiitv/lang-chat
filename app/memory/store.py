"""Per-session conversation memory store using Redis.

This uses `RedisChatMessageHistory` to store the chat history in a Redis database.
"""

from langchain_community.chat_message_histories import RedisChatMessageHistory
from langchain_classic.memory import ConversationBufferWindowMemory
from typing import Dict, List, Any
from app.config import settings

def get_or_create_memory(session_id: str, k: int = 10) -> ConversationBufferWindowMemory:
    """Return existing memory for *session_id*, or create a new one.

    Args:
        session_id: Unique identifier for the chat session.
        k: Number of recent exchanges to keep in the sliding window.
    """
    message_history = RedisChatMessageHistory(
        session_id=session_id,
        url=settings.redis_url
    )
    
    return ConversationBufferWindowMemory(
        chat_memory=message_history,
        k=k,
        return_messages=True,
        memory_key="history",
    )

def clear_session(session_id: str) -> bool:
    """Delete all memory for a session. Returns ``True`` if it existed."""
    message_history = RedisChatMessageHistory(
        session_id=session_id,
        url=settings.redis_url
    )
    message_history.clear()
    return True

def get_history(session_id: str) -> List[Dict[str, Any]]:
    """Return the full message history for a session as a list of dicts."""
    message_history = RedisChatMessageHistory(
        session_id=session_id,
        url=settings.redis_url
    )
    return [
        {"role": msg.type, "content": msg.content}
        for msg in message_history.messages
    ]
