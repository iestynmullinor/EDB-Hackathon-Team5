# .tools/financial_profile_tool.py

from typing import Any

DEFAULT_FINANCIAL_PROFILE = {
    "income": 0.0,
    "bills": 0.0,
    "rent": 0.0,
    "essentials": [],
}

def build_user_finances(
    financial_profile: dict[str, Any],
    customer_financial_goals: list[str],
) -> dict[str, Any]:
    return {
        "financial_profile": financial_profile,
        "customer_financial_goals": customer_financial_goals,
    }