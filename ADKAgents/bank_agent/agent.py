import os
from functools import cached_property

from dotenv import load_dotenv
from google.adk.agents import Agent
from google.adk.models.google_llm import Gemini
from google.genai import Client
from bank_agent.sub_agents.request_analysis_agent.agent import request_analysis_agent

from .observability import (
    after_model_callback,
    before_model_callback,
    setup_observability,
)
from .prompt import AGENT_INSTRUCTION
from .tools.bigquery_tool import (
    get_last_30_customer_transactions,
    get_user_summary,
    upsert_user_advice,
    upsert_user_profile,
)
from .tools.customersearch import customer_database_search, customer_id_search
from .tools.productsearch import vertex_vector_search
from .tools.ecommerce_tools import lookup_user_orders, check_product_stock, sales_reporting_query

load_dotenv()


# Initialise OpenTelemetry exporters and the metrics store.
setup_observability()


class VertexGemini(Gemini):
    """Gemini model that unconditionally uses Vertex AI (ADC) instead of an API key."""

    @cached_property
    def api_client(self) -> Client:
        return Client(
            vertexai=True,
            project=os.getenv("GOOGLE_CLOUD_PROJECT"),
            location=os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1"),
        )

root_agent = Agent(
    name="bank_agent",
    model=VertexGemini(model="gemini-2.5-flash"),
    description="A helpful banking assistant.",
    instruction=AGENT_INSTRUCTION,
    tools=[
        get_last_30_customer_transactions,
        get_user_summary,
        upsert_user_profile,
        upsert_user_advice,
    ],
    before_model_callback=before_model_callback,
    after_model_callback=after_model_callback,
    sub_agents=[request_analysis_agent]
)
