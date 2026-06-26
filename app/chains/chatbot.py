"""LangChain conversational chain with per-session memory and streaming support."""

from datetime import date

from langchain_openai import ChatOpenAI
from langchain_classic.chains import ConversationChain
from langchain_classic.memory import ConversationBufferWindowMemory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from app.config import settings


def build_system_prompt() -> ChatPromptTemplate:
    """Build the prompt template with system instructions, history placeholder, and human input."""
    today = str(date.today())
    return ChatPromptTemplate.from_messages(
        [
            (
                "system",
                (
                    "You are a helpful, concise assistant.\n"
                    "Answer clearly. If you don't know something, say so.\n"
                    f"Today's date: {today}"
                ),
            ),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{input}"),
        ]
    )


def create_chain(memory: ConversationBufferWindowMemory) -> ConversationChain:
    """Create a ConversationChain wired to the given session memory.

    The chain uses streaming-enabled ChatOpenAI so callers can consume
    tokens incrementally via ``astream()``.
    """
    llm = ChatOpenAI(
        model=settings.model_name,
        temperature=settings.temperature,
        max_tokens=settings.max_tokens,
        streaming=True,
        api_key=settings.openai_api_key,
        base_url=settings.openai_base_url,
    )

    return ConversationChain(
        llm=llm,
        memory=memory,
        prompt=build_system_prompt(),
        verbose=False,
    )

