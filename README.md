# 🤖 LangChain Chatbot API

> A production-ready, multi-session conversational AI API with persistent memory, streaming responses, and a clean REST interface.

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-0.3+-1C3C3C?logo=langchain&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?logo=openai&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7+-DC382D?logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

---

## ✨ Features

- **Multi-session memory** — each session gets isolated `ConversationBufferWindowMemory(k=10)`, managing per-user state like a real production system
- **Streaming responses** — `StreamingResponse` with async token generation for real-time UX
- **Async-first** — built on FastAPI with `ainvoke` / `astream` throughout
- **Clean REST interface** — `POST /chat`, `GET /history`, `DELETE /session`
- **Dockerized** — one-command deployment with `docker compose up`
- **Tested** — pytest suite covering all endpoints

---

## 🏗️ Architecture

```
Client (HTTP)  ──►  FastAPI  ──►  LangChain ConversationChain  ──►  OpenAI GPT-4o-mini
                       │                      │
                  Session Store          Memory (per-session)
                  (in-memory / Redis)    ConversationBufferWindowMemory(k=10)
```

---

## 🚀 Quick Start

### 1. Clone & configure

```bash
git clone https://github.com/YOUR_USERNAME/langchain-chatbot-api.git
cd langchain-chatbot-api
cp .env.example .env   # or edit .env directly
```

Set your OpenAI key in `.env`:

```
OPENAI_API_KEY=sk-your-key-here
```

### 2. Run with Docker (recommended)

```bash
docker compose up --build
```

### 3. Or run locally

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API will be available at **http://localhost:8000**.  
Interactive docs at **http://localhost:8000/docs**.

---

## 📡 API Endpoints

| Method   | Endpoint                    | Description                          |
|----------|-----------------------------|--------------------------------------|
| `GET`    | `/health`                   | Liveness probe                       |
| `POST`   | `/chat/`                    | Send a message, get a reply          |
| `GET`    | `/chat/history/{session_id}`| Get conversation history for session |
| `DELETE` | `/chat/session/{session_id}`| Clear session memory                 |

### Example: Send a message

```bash
curl -X POST http://localhost:8000/chat/ \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "user-123",
    "message": "What is the capital of France?",
    "stream": false
  }'
```

**Response:**

```json
{
  "session_id": "user-123",
  "reply": "The capital of France is Paris.",
  "tokens_used": null
}
```

### Example: Stream a response

```bash
curl -X POST http://localhost:8000/chat/ \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "user-456",
    "message": "Explain quantum computing in 3 sentences.",
    "stream": true
  }'
```

Tokens arrive incrementally as `text/plain`.

### Example: Get history

```bash
curl http://localhost:8000/chat/history/user-123
```

### Example: Delete session

```bash
curl -X DELETE http://localhost:8000/chat/session/user-123
```

---

## 🧪 Running Tests

```bash
pytest tests/ -v
```

> **Note:** Tests that hit the `/chat/` endpoint require a valid `OPENAI_API_KEY`.

---

## 📁 Project Structure

```
langchain-chatbot-api/
├── app/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Settings from .env
│   ├── schemas.py           # Pydantic request/response models
│   ├── routes/
│   │   └── chat.py          # Chat REST endpoints
│   ├── chains/
│   │   └── chatbot.py       # LangChain chain + prompt logic
│   └── memory/
│       └── store.py         # Per-session memory management
├── tests/
│   └── test_chat.py         # Endpoint tests
├── .env                     # Environment variables (not committed)
├── .gitignore
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 🔧 Configuration

| Variable        | Default               | Description                     |
|-----------------|-----------------------|---------------------------------|
| `OPENAI_API_KEY`| *(required)*          | Your OpenAI API key             |
| `REDIS_URL`     | `redis://localhost:6379` | Redis connection string       |
| `MODEL_NAME`    | `gpt-4o-mini`         | OpenAI model to use             |
| `MAX_TOKENS`    | `1000`                | Max tokens per response         |

---

## 🚀 Bonus Upgrades

- [ ] Swap in-memory store for **Redis-backed `RedisChatMessageHistory`**
- [ ] Add **rate limiting** with `slowapi`
- [ ] Add **JWT auth** for multi-user scenarios
- [ ] Deploy to **Railway / Render / Fly.io** and link the live URL
- [ ] Add **WebSocket** support for bidirectional streaming

---

## 📄 License

MIT
