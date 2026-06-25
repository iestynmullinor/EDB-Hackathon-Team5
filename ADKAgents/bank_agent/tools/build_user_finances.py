# .tools/financial_profile_tool.py

from typing import Any


def build_user_finances(common_expenses: dict[str, dict[str, float]],
    customer_financial_goals: list[str],
) -> dict[str, Any]:
    """
    Stores or returns the customer's inferred financial profile.

    The agent is responsible for inferring all expense values and financial goals
    before calling this tool.
    """

    return {
        "common_expenses": common_expenses,
        "customer_financial_goals": customer_financial_goals,
    }