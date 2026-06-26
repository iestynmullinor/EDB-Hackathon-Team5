from functools import cached_property
import os
from google.adk.models.google_llm import Gemini
from google.genai import Client



class VertexGemini(Gemini):
    """Gemini model that prefers the Gemini Developer API key when available,
    falling back to Vertex AI (ADC) only if no GOOGLE_API_KEY is set."""

    @cached_property
    def api_client(self) -> Client:
        api_key = os.getenv("GOOGLE_API_KEY")
        if api_key:
            return Client(api_key=api_key)

        return Client(
            vertexai=True,
            project=os.getenv("GOOGLE_CLOUD_PROJECT"),
            location=os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1"),
        )