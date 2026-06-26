#def main():
#    print("Hello from adkagents!")


import os
import uvicorn
from google.adk.cli.fast_api import get_fast_api_app
from fastapi.middleware.cors import CORSMiddleware

# 1. Grab the dynamic port assigned by Google Cloud Run
port = int(os.environ.get("PORT", 8080))

# 2. Wrap your ADK agent in a production-ready FastAPI web server
AGENT_DIR = os.path.dirname(os.path.abspath(__file__))
app = get_fast_api_app(
    agents_dir=AGENT_DIR,
    allow_origins=["*"],
    web=True,
    trace_to_cloud=os.environ.get("TRACE_TO_CLOUD", "false").lower() == "true",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import HTMLResponse
from front_of_house_agent.observability import store, CostGranularity

@app.get("/obs", response_class=HTMLResponse)
async def obs_dashboard():
    """Serves the frontend dashboard for agent observability."""
    html_path = os.path.join(AGENT_DIR, "front_of_house_agent", "observability", "dashboard.html")
    if os.path.exists(html_path):
        with open(html_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse(content="Dashboard file not found.", status_code=404)


@app.get("/obs/summary")
async def obs_summary(granularity: str | None = None):
    """Aggregated stats: sessions, total tokens, cost, avg latency.

    Optional ``?granularity=session|turn|cumulative`` query param overrides
    the default (env ``COST_GRANULARITY``).
    """
    gran = None
    if granularity:
        try:
            gran = CostGranularity(granularity.strip().lower())
        except ValueError:
            pass
    return store.get_summary(granularity=gran)


@app.get("/obs/traces")
async def obs_traces(limit: int = 100):
    """Individual LLM call records (newest first).

    Optional ``?limit=N`` query param controls the number of records returned
    (default 100).
    """
    return store.get_traces(limit=limit)


@app.get("/obs/tools")
async def obs_tools():
    """Per-tool call counts, success rates, and duration percentiles."""
    return store.get_tool_stats()


@app.post("/obs/reset")
async def obs_reset():
    """Clear all recorded observability data."""
    store.reset()
    return {"status": "ok", "message": "Observability data cleared"}


if __name__ == "__main__":
    # 3. Start the server!
    uvicorn.run(app, host="0.0.0.0", port=port)