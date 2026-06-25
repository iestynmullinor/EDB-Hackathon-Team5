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
def get_last_30_customer_transactions(customer_id: str) -> str:
    """Returns the last 30 transactions for a customer from BigQuery.

    Looks up the customer's accounts in the `{dataset}.accounts` table, then
    returns matching rows from the `{dataset}.transactions` table ordered by
    most recent transaction date first.

    Args:
        customer_id: The customer ID to find transactions for, e.g. "C001".

    Returns:
        A plain-text table of the customer's most recent transactions, or an
        error/no-results message.
    """
    if not customer_id or not customer_id.strip():
        return "ERROR: customer_id is required."

    try:
        client = _bigquery_client()
        sql = f"""
        SELECT *
        FROM `{BQ_DATASET}.transactions` AS t
        WHERE t.customer_id = @customer_id
        ORDER BY t.transaction_ts DESC
        LIMIT 30
        """
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("customer_id", "STRING", customer_id.strip())
            ]
        )

        print(f"Running BigQuery customer transactions lookup for customer_id={customer_id.strip()}")
        result_df = client.query(sql, job_config=job_config).to_dataframe()

        if result_df.empty:
            return f"No transactions found for customer_id {customer_id.strip()}."

        return result_df.to_string(index=False)

    except Exception as e:
        return f"BigQuery Error: {str(e)}"


@traced_tool
def get_user_summary(customer_id: str) -> str:
    """Returns a customer's summary information from BigQuery.

    Looks up the customer in the `{dataset}.user_summary` table by
    `customer_id` and returns the matching row.

    Args:
        customer_id: The customer ID to find summary information for, e.g. "C001".

    Returns:
        A plain-text table containing the customer's summary information, or an
        error/no-results message.
    """
    customer_id = customer_id.strip() if customer_id else ""
    if not customer_id:
        return "ERROR: customer_id is required."
    if not BQ_DATASET:
        return "ERROR: BQ_DATASET is not configured."

    try:
        client = _bigquery_client()
        sql = f"""
        SELECT *
        FROM `{BQ_DATASET}.user_summary`
        WHERE customer_id = @customer_id
        LIMIT 1
        """
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("customer_id", "STRING", customer_id)
            ]
        )

        print(f"Running BigQuery user_summary lookup for customer_id={customer_id}")
        result_df = client.query(sql, job_config=job_config).to_dataframe()

        if result_df.empty:
            return f"No user summary found for customer_id {customer_id}."

        return result_df.to_string(index=False)

    except Exception as e:
        return f"BigQuery Error: {str(e)}"


@traced_tool
def upsert_user_profile(customer_id: str, profile: str) -> str:
    """Creates or replaces a customer's profile in BigQuery.

    Writes to the `{dataset}.user_profile` table, whose schema is:
    `customer_id STRING, profile STRING`. If a row already exists for the
    customer, its profile is replaced. Otherwise, a new row is inserted.

    Args:
        customer_id: The customer ID to create or update, e.g. "C001".
        profile: The profile text to store for the customer.

    Returns:
        A success message, or an error message if the write fails.
    """
    customer_id = customer_id.strip() if customer_id else ""
    if not customer_id:
        return "ERROR: customer_id is required."
    if profile is None:
        return "ERROR: profile is required."
    if not BQ_DATASET:
        return "ERROR: BQ_DATASET is not configured."

    try:
        client = _bigquery_client()
        sql = f"""
        MERGE `{BQ_DATASET}.user_profile` AS target
        USING (SELECT @customer_id AS customer_id, @profile AS profile) AS source
        ON target.customer_id = source.customer_id
        WHEN MATCHED THEN
          UPDATE SET profile = source.profile
        WHEN NOT MATCHED THEN
          INSERT (customer_id, profile)
          VALUES (source.customer_id, source.profile)
        """
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("customer_id", "STRING", customer_id),
                bigquery.ScalarQueryParameter("profile", "STRING", profile),
            ]
        )

        print(f"Running BigQuery user_profile upsert for customer_id={customer_id}")
        client.query(sql, job_config=job_config).result()
        return f"Successfully saved profile for customer_id {customer_id}."

    except Exception as e:
        return f"BigQuery Error: {str(e)}"


@traced_tool
def upsert_user_advice(customer_id: str, advice: str, spice_level: float) -> str:
    """Creates or replaces a customer's advice in BigQuery.

    Writes to the `{dataset}.user_advice` table, whose schema is:
    `customer_id STRING, advice STRING, spice_level NUMERIC`. If a row already
    exists for the customer, its advice and spice level are replaced. Otherwise,
    a new row is inserted.

    Args:
        customer_id: The customer ID to create or update, e.g. "C001".
        advice: The advice text to store for the customer.
        spice_level: The advice strictness level. Must be 1, 2, or 3, where 1
            is the lowest and 3 is the highest.

    Returns:
        A success message, or an error message if the write fails.
    """
    customer_id = customer_id.strip() if customer_id else ""
    if not customer_id:
        return "ERROR: customer_id is required."
    if advice is None:
        return "ERROR: advice is required."
    try:
        spice_level = float(spice_level)
    except (TypeError, ValueError):
        return "ERROR: spice_level must be a number: 1, 2, or 3."
    if spice_level not in (1.0, 2.0, 3.0):
        return "ERROR: spice_level must be 1, 2, or 3."
    if not BQ_DATASET:
        return "ERROR: BQ_DATASET is not configured."

    try:
        client = _bigquery_client()
        sql = f"""
        MERGE `{BQ_DATASET}.user_advice` AS target
        USING (
          SELECT @customer_id AS customer_id, @advice AS advice, @spice_level AS spice_level
        ) AS source
        ON target.customer_id = source.customer_id
        WHEN MATCHED THEN
          UPDATE SET advice = source.advice, spice_level = source.spice_level
        WHEN NOT MATCHED THEN
          INSERT (customer_id, advice, spice_level)
          VALUES (source.customer_id, source.advice, source.spice_level)
        """
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("customer_id", "STRING", customer_id),
                bigquery.ScalarQueryParameter("advice", "STRING", advice),
                bigquery.ScalarQueryParameter("spice_level", "NUMERIC", spice_level),
            ]
        )

        print(f"Running BigQuery user_advice upsert for customer_id={customer_id}")
        client.query(sql, job_config=job_config).result()
        return f"Successfully saved advice for customer_id {customer_id} with spice_level {spice_level:g}."

    except Exception as e:
        return f"BigQuery Error: {str(e)}"
