import os

from dotenv import load_dotenv
from google.cloud import bigquery

from ..observability.tool_tracer import traced_tool

load_dotenv()

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "")
BQ_DATASET = os.getenv("BQ_DATASET", "")
ECOMMERCE_DATASET = os.getenv("ECOMMERCE_DATASET", "ecommerce_data")


def _bigquery_client() -> bigquery.Client:
    """Creates a BigQuery client, falling back to ADC's default project."""
    return bigquery.Client(project=PROJECT_ID if PROJECT_ID else None)


@traced_tool
def get_user_advice(customer_id: str) -> dict:
    """Gets a customer's advice and spice level from BigQuery.

    Reads from the `{dataset}.user_advice` table, whose schema is:
    `customer_id STRING, advice STRING, spice_level NUMERIC`.

    Args:
        customer_id: The customer ID to fetch, e.g. "C001".

    Returns:
        A dictionary containing `advice` and `spice_level`, or an `error` key if
        the lookup fails.
    """
    customer_id = customer_id.strip() if customer_id else ""
    if not customer_id:
        return {"error": "customer_id is required."}
    if not BQ_DATASET:
        return {"error": "BQ_DATASET is not configured."}

    try:
        client = _bigquery_client()
        sql = f"""
        SELECT advice, spice_level
        FROM `{BQ_DATASET}.user_advice`
        WHERE customer_id = @customer_id
        LIMIT 1
        """
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("customer_id", "STRING", customer_id),
            ]
        )

        print(f"Running BigQuery user_advice lookup for customer_id={customer_id}")
        rows = list(client.query(sql, job_config=job_config).result())
        if not rows:
            return {"advice": None, "spice_level": None}

        row = rows[0]
        return {"advice": row.advice, "spice_level": float(row.spice_level)}

    except Exception as e:
        return {"error": f"BigQuery Error: {str(e)}"}
