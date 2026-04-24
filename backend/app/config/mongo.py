from pymongo import MongoClient, errors

from app.config.settings import settings


def get_mongo_collection():
    try:
        client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=2000)
        client.admin.command("ping")
        db = client[settings.MONGO_DB_NAME]
        return db[settings.MONGO_COLLECTION_NAME]
    except errors.PyMongoError as exc:
        raise ConnectionError(f"MongoDB connection failed: {exc}") from exc
