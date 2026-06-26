import os
from functools import cached_property

from dotenv import load_dotenv
from google.adk.agents import Agent
from google.adk.models.google_llm import Gemini
from google.genai import Client
from front_of_house_agent.llm.gemini import VertexGemini
from front_of_house_agent.sub_agents.request_analysis_agent.agent import request_analysis_agent

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
from .tools.spiciness_tool import spiciness_tool
from .tools.productsearch import vertex_vector_search
from .tools.ecommerce_tools import lookup_user_orders, check_product_stock, sales_reporting_query
from .tools.build_user_finances import build_user_finances

load_dotenv()


# Initialise OpenTelemetry exporters and the metrics store.
setup_observability()


root_agent = Agent(
    name="front_of_house_agent",
    model=VertexGemini(model="gemini-2.5-flash"),
    description="A helpful banking assistant.",
    instruction=AGENT_INSTRUCTION,
    tools=[spiciness_tool, build_user_finances],
    before_model_callback=before_model_callback,
    after_model_callback=after_model_callback,
    sub_agents=[request_analysis_agent]
)

