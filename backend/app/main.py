from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import admin_routes, user_routes


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create MongoDB unique index once at startup instead of on every insert.
    try:
        from app.config.mongo import get_mongo_collection
        collection = get_mongo_collection()
        collection.create_index("file_name", unique=True, background=True)
    except Exception:
        pass  # MongoDB may not be available; routes will handle errors individually.
    yield


app = FastAPI(title="Insurance AI RAG Backend", version="1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "Health insurance RAG backend is running."}


app.include_router(user_routes.router)
app.include_router(admin_routes.router)
