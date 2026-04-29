from google.adk.agents import Agent

from .prompt import AGENT_INSTRUCTION

root_agent = Agent(
    name="bank_agent",
    model="gemini-2.5-flash",
    description="A helpful banking assistant.",
    instruction=AGENT_INSTRUCTION,
)
