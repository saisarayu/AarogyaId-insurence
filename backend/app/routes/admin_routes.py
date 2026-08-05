from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from pathlib import Path

from app.services.parser_service import chunk_text, extract_text
from app.services.policy_metadata_service import (
    delete_policy_metadata,
    insert_policy_metadata,
    list_policy_metadata,
    policy_metadata_exists,
)
from app.services.rag_service import (
    delete_policy_chunks,
    list_uploaded_documents,
    store_policy_chunks,
)

router = APIRouter(tags=["admin"])

# Absolute path so uvicorn can be started from any directory.
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "policies"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)



@router.post("/upload-policy")
async def upload_policy(file: UploadFile = File(...)):
    try:
        if file.filename is None:
            raise HTTPException(status_code=400, detail="Uploaded file must have a filename.")

        file_path = UPLOAD_DIR / file.filename
        content = await file.read()
        file_path.write_bytes(content)

        try:
            text = extract_text(str(file_path))
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))

        metadata_available = True
        try:
            exists = policy_metadata_exists(file.filename)
            if exists is True:
                raise HTTPException(status_code=400, detail=f"Policy '{file.filename}' already exists.")
            if exists is None:
                metadata_available = False
        except RuntimeError as exc:
            raise HTTPException(status_code=500, detail=str(exc))

        chunks = chunk_text(text)
        if not chunks:
            raise HTTPException(status_code=400, detail="Uploaded document contained no usable text.")

        # Store embeddings/chunks in ChromaDB.
        store_policy_chunks(
            policy_name=file.filename,
            source_file=file.filename,
            chunks=chunks,
        )

        insert_policy_metadata(
            policy_name=file.filename,
            file_name=file.filename,
            insurer=None,
        )

        response = {
            "message": "Upload successful and stored in vector DB.",
            "policy_name": file.filename,
            "uploaded_at": datetime.utcnow().isoformat() + "Z",
            "chunk_count": len(chunks),
        }

        if not metadata_available:
            response["warning"] = (
                "Policy metadata store is unavailable. The policy was uploaded to the vector database, "
                "but metadata information could not be saved."
            )

        return response
    except Exception as e:
        import traceback
        error_msg = f"{type(e).__name__}: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_msg)


@router.get("/policies")
def list_policies():
    try:
        policies = list_policy_metadata()
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return {"policies": policies}


@router.delete("/delete-policy")
def delete_policy(file_name: str = Query(..., description="The filename of the policy to delete")):
    try:
        metadata_deleted = delete_policy_metadata(file_name)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    vector_deleted = delete_policy_chunks(file_name)

    if metadata_deleted is None:
        if vector_deleted:
            return {
                "message": (
                    f"Policy '{file_name}' deleted from ChromaDB. MongoDB metadata store "
                    "was unavailable, so metadata may still exist."
                )
            }
        raise HTTPException(
            status_code=500,
            detail=(
                f"Policy '{file_name}' could not be deleted because the MongoDB metadata "
                "store is unavailable and the vector document was not found."
            ),
        )

    if not metadata_deleted and not vector_deleted:
        raise HTTPException(status_code=404, detail=f"Policy '{file_name}' not found.")
    if not metadata_deleted:
        raise HTTPException(
            status_code=500,
            detail=f"Policy '{file_name}' could not be removed from metadata store.",
        )
    if not vector_deleted:
        raise HTTPException(
            status_code=500,
            detail=f"Policy '{file_name}' could not be removed from vector DB.",
        )

    return {"message": f"Policy '{file_name}' deleted from MongoDB and ChromaDB."}
