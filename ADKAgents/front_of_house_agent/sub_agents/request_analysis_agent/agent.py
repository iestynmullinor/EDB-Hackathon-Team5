from google.adk.agents import Agent
from front_of_house_agent.llm.gemini import VertexGemini
from front_of_house_agent.sub_agents.request_analysis_agent.prompt import REQUEST_ANALYSIS_AGENT_PROMPT
from front_of_house_agent.tools.bigquery_tool import get_last_30_customer_transactions, get_user_summary, upsert_user_advice, upsert_user_profile

request_analysis_agent = Agent(
    name="request_analysis_agent",
    model=VertexGemini(model="gemini-2.5-flash"),
    description="Creates the user's profile and advice",
    instruction=REQUEST_ANALYSIS_AGENT_PROMPT,
    tools=[get_last_30_customer_transactions, get_user_summary, upsert_user_advice, upsert_user_profile]
)