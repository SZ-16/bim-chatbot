from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request

from auth import verify_token
from forge.aps_client import (
    ForgeAPIError,
    ForgeConfigError,
    get_access_token,
    get_translation_status,
    upload_and_translate,
)
from limiter import limiter

router = APIRouter(prefix="/forge", tags=["forge"])

FORGE_EXTENSIONS = {
    ".rvt", ".ifc", ".dwg", ".nwd", ".nwc", ".dxf",
    ".fbx", ".obj", ".3ds", ".step", ".stp", ".iges", ".igs",
}


@router.get("/token")
@limiter.limit("30/minute")
def forge_viewer_token(request: Request, user: str = Depends(verify_token)):
    try:
        token = get_access_token()
        return {"access_token": token, "expires_in": 3600}
    except ForgeConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ForgeAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/models/upload")
@limiter.limit("5/minute")
async def upload_model(
    request: Request,
    file: UploadFile = File(...),
    user: str = Depends(verify_token),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="File name is required.")

    extension = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if extension not in FORGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported BIM file type '{extension}'. Supported: {', '.join(sorted(FORGE_EXTENSIONS))}",
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        return upload_and_translate(file_bytes, file.filename)
    except ForgeConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ForgeAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/models/{urn}/status")
@limiter.limit("60/minute")
def model_translation_status(request: Request, urn: str, user: str = Depends(verify_token)):
    try:
        return get_translation_status(urn)
    except ForgeConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ForgeAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
