from datetime import datetime
from pymongo import errors

from app.config.mongo import get_mongo_collection


def insert_policy_metadata(policy_name: str, file_name: str, insurer: str | None = None) -> None:
    """Insert or update policy metadata. Index creation is handled at app startup."""
    collection = get_mongo_collection()
    try:
        metadata = {
            "policy_name": policy_name,
            "file_name": file_name,
            "insurer": insurer,
            "upload_date": datetime.utcnow(),
        }
        # Use $set so re-uploads always refresh metadata (not $setOnInsert which skips existing docs).
        collection.update_one(
            {"file_name": file_name},
            {"$set": metadata},
            upsert=True,
        )
    except errors.PyMongoError as exc:
        raise RuntimeError(f"Failed to store policy metadata: {exc}") from exc


def policy_metadata_exists(file_name: str) -> bool:
    collection = get_mongo_collection()
    try:
        return collection.find_one({"file_name": file_name}, {"_id": 1}) is not None
    except errors.PyMongoError as exc:
        raise RuntimeError(f"Failed to query policy metadata: {exc}") from exc


def list_policy_metadata() -> list[dict[str, str]]:
    collection = get_mongo_collection()
    try:
        policies = collection.find({}, {"_id": 0, "policy_name": 1, "file_name": 1, "upload_date": 1})
        result = []
        for policy in policies:
            upload_date = policy.get("upload_date")
            result.append({
                "policy_name": policy.get("policy_name"),
                "file_name": policy.get("file_name"),
                # Guard against None upload_date to avoid AttributeError
                "upload_date": upload_date.isoformat() + "Z" if upload_date else None,
            })
        return result
    except errors.PyMongoError as exc:
        raise RuntimeError(f"Failed to list policies: {exc}") from exc


def delete_policy_metadata(file_name: str) -> bool:
    collection = get_mongo_collection()
    try:
        result = collection.delete_one({"file_name": file_name})
        return result.deleted_count > 0
    except errors.PyMongoError as exc:
        raise RuntimeError(f"Failed to delete policy metadata: {exc}") from exc

