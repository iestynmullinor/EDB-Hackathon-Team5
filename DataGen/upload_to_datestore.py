from google.cloud import firestore
import os
import json
from pathlib import Path

DOCUMENTS_DIR: Path = Path(__file__).parent / "documents"


def upload_to_gcp():
    db = firestore.Client(project=os.getenv("GOOGLE_CLOUD_PROJECT"))

    for file in DOCUMENTS_DIR.glob("*.json"):
        print(f"uploading file {file.name}")
        content: dict = json.loads(file.read_text())

        doc_ref = db.collection("customers").document(file.stem)
        doc_ref.set(content)


if __name__ == "__main__":
    upload_to_gcp()

