"""LangChain conversational chain with per-session memory and streaming support."""

from datetime import date
import numexpr

from langchain_openai import ChatOpenAI
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import SystemMessage

from app.config import settings

def build_system_message() -> SystemMessage:
    today = str(date.today())
    return SystemMessage(
        content=(
            "You are a helpful, concise assistant.\n"
            "Use tools if necessary to answer the user's question.\n"
            f"Today's date: {today}"
        )
    )

@tool
def calculator(expression: str) -> str:
    """Useful for when you need to answer questions about math. Input should be a mathematical expression."""
    try:
        return str(numexpr.evaluate(expression))
    except Exception as e:
        return f"Error evaluating expression: {e}"

def create_agent():
    llm = ChatOpenAI(
        model=settings.model_name,
        temperature=settings.temperature,
        max_tokens=settings.max_tokens,
        streaming=True,
        api_key=settings.openai_api_key,
        base_url=settings.openai_base_url,
    )

    search = DuckDuckGoSearchRun()
    tools = [search, calculator]
    
    agent = create_react_agent(llm, tools, prompt=build_system_message())
    return agent

