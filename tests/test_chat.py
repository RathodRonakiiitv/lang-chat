"""Tests for the chat API endpoints.

These tests exercise the FastAPI routes via ``TestClient``.
They require a valid ``OPENAI_API_KEY`` in the environment (or ``.env``).
"""

import uuid

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    """Health endpoint returns 200."""
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_chat_response():
    """A basic chat round-trip returns a non-empty reply."""
    session_id = str(uuid.uuid4())
    res = client.post(
        "/chat/",
        json={
            "session_id": session_id,
            "message": "What is 2 + 2?",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert len(data["reply"]) > 0


def test_session_history():
    """After sending a message, the history endpoint returns at least one entry."""
    session_id = str(uuid.uuid4())
    client.post(
        "/chat/",
        json={"session_id": session_id, "message": "My name is Alex"},
    )
    res = client.get(f"/chat/history/{session_id}")
    assert res.status_code == 200
    assert len(res.json()["messages"]) >= 1


def test_delete_session():
    """Deleting a session returns 200; deleting again returns 404."""
    session_id = str(uuid.uuid4())
    client.post(
        "/chat/",
        json={"session_id": session_id, "message": "Hello"},
    )
    res = client.delete(f"/chat/session/{session_id}")
    assert res.status_code == 200

    # Second delete should 404
    res = client.delete(f"/chat/session/{session_id}")
    assert res.status_code == 404


def test_empty_history():
    """Querying history for a non-existent session returns an empty list."""
    session_id = str(uuid.uuid4())
    res = client.get(f"/chat/history/{session_id}")
    assert res.status_code == 200
    assert res.json()["messages"] == []
