import os
from functools import cached_property

from dotenv import load_dotenv
from google.adk.agents import Agent
from google.adk.models.google_llm import Gemini
from google.genai import Client
from enforcer_agent.llm.gemini import VertexGemini

from .observability import (
    after_model_callback,
    before_model_callback,
    setup_observability,
)
from .prompt import AGENT_INSTRUCTION
from .tools.bigquery_tool import (
    get_user_advice,
)
from pydantic import BaseModel, Field


load_dotenv()

class EnforcerReponse(BaseModel):
    approve: bool = Field(description="Whether to approve or decline the transaction. True for approve, False for decline.")
    notification: str = Field(description="What to include in the notification. Always include this.")

# Initialise OpenTelemetry exporters and the metrics store.
setup_observability()


root_agent = Agent(
    name="enforcer_agent",
    model=VertexGemini(model="gemini-2.5-flash"),
    description="Enforces the rules people set on their transactions",
    instruction=AGENT_INSTRUCTION,
    tools=[get_user_advice],
    before_model_callback=before_model_callback,
    after_model_callback=after_model_callback,
    output_schema=EnforcerReponse
)

