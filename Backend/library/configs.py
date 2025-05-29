import json
import os

LOCAL_DATA_PATH = os.getenv("LOCAL_DATA_PATH")
LINK_EXPIRATION = int(os.getenv("LINK_EXPIRATION"))
BUCKET_NAME = os.getenv("BUCKET_NAME")  # Storage bucket
MAX_RETRIES = int(os.getenv("MAX_RETRIES"))
RETRY_DELAY = os.getenv("RETRY_DELAY")
BOOKS_BUCKET = os.getenv("BOOKS_BUCKET")


with open(LOCAL_DATA_PATH) as f:
    BOOKS_METADATA_DICT = json.load(f)

BOOKS_METADATA = list(BOOKS_METADATA_DICT.values())
SOURCE_TO_METADATA = {v["source"]: v for v in BOOKS_METADATA_DICT.values()}
