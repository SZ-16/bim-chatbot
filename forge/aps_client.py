import base64
import os
import time
import uuid

import httpx
from dotenv import load_dotenv

load_dotenv()

APS_BASE = "https://developer.api.autodesk.com"
CLIENT_ID = os.getenv("FORGE_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("FORGE_CLIENT_SECRET", "")
BUCKET_KEY = os.getenv("FORGE_BUCKET", "bim-chatbot-dev")

SCOPES = "data:read data:write data:create bucket:create bucket:read viewables:read"

_token_cache: dict = {"access_token": None, "expires_at": 0.0}


class ForgeConfigError(Exception):
    pass


class ForgeAPIError(Exception):
    pass


def _require_credentials() -> None:
    if not CLIENT_ID or not CLIENT_SECRET:
        raise ForgeConfigError(
            "FORGE_CLIENT_ID and FORGE_CLIENT_SECRET must be set in .env. "
            "Create an app at https://aps.autodesk.com/"
        )


def get_access_token() -> str:
    _require_credentials()

    if _token_cache["access_token"] and time.time() < _token_cache["expires_at"]:
        return _token_cache["access_token"]

    response = httpx.post(
        f"{APS_BASE}/authentication/v2/token",
        data={
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "grant_type": "client_credentials",
            "scope": SCOPES,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=30.0,
    )
    if response.status_code != 200:
        raise ForgeAPIError(f"Failed to authenticate with APS: {response.text}")

    data = response.json()
    _token_cache["access_token"] = data["access_token"]
    _token_cache["expires_at"] = time.time() + data.get("expires_in", 3600) - 60
    return data["access_token"]


def _auth_headers() -> dict:
    return {"Authorization": f"Bearer {get_access_token()}"}


def ensure_bucket() -> str:
    bucket_key = BUCKET_KEY.lower()
    headers = {**_auth_headers(), "Content-Type": "application/json"}

    detail = httpx.get(
        f"{APS_BASE}/oss/v2/buckets/{bucket_key}/details",
        headers=headers,
        timeout=30.0,
    )
    if detail.status_code == 200:
        return bucket_key

    create = httpx.post(
        f"{APS_BASE}/oss/v2/buckets",
        headers=headers,
        json={"bucketKey": bucket_key, "policyKey": "transient"},
        timeout=30.0,
    )
    if create.status_code not in (200, 409):
        raise ForgeAPIError(f"Failed to create OSS bucket: {create.text}")

    return bucket_key


def encode_urn(object_id: str) -> str:
    return base64.b64encode(object_id.encode("utf-8")).decode("utf-8").rstrip("=")


def decode_urn(encoded_urn: str) -> str:
    padding = "=" * (-len(encoded_urn) % 4)
    return base64.b64decode(encoded_urn + padding).decode("utf-8")


def upload_object(file_bytes: bytes, filename: str) -> tuple[str, str]:
    bucket_key = ensure_bucket()
    safe_name = f"{uuid.uuid4().hex}_{filename.replace(' ', '_')}"
    headers = _auth_headers()

    signed = httpx.post(
        f"{APS_BASE}/oss/v2/buckets/{bucket_key}/objects/{safe_name}/signeds3upload",
        headers={**headers, "Content-Type": "application/json"},
        json={},
        timeout=30.0,
    )
    if signed.status_code != 200:
        raise ForgeAPIError(f"Failed to get signed upload URL: {signed.text}")

    signed_data = signed.json()
    upload_key = signed_data["uploadKey"]
    upload_url = signed_data["urls"][0]

    put = httpx.put(upload_url, content=file_bytes, timeout=120.0)
    if put.status_code not in (200, 201):
        raise ForgeAPIError(f"Failed to upload file to OSS: {put.status_code}")

    complete = httpx.post(
        f"{APS_BASE}/oss/v2/buckets/{bucket_key}/objects/{safe_name}/signeds3upload/{upload_key}/complete",
        headers={**headers, "Content-Type": "application/json"},
        json={"uploadKey": upload_key},
        timeout=30.0,
    )
    if complete.status_code != 200:
        raise ForgeAPIError(f"Failed to complete OSS upload: {complete.text}")

    object_id = f"urn:adsk.objects:os.object:{bucket_key}/{safe_name}"
    return object_id, encode_urn(object_id)


def start_translation(encoded_urn: str) -> None:
    response = httpx.post(
        f"{APS_BASE}/modelderivative/v2/designdata/job",
        headers={**_auth_headers(), "Content-Type": "application/json"},
        json={
            "input": {"urn": encoded_urn},
            "output": {
                "formats": [
                    {"type": "svf2", "views": ["2d", "3d"]},
                ]
            },
        },
        timeout=30.0,
    )
    if response.status_code not in (200, 201):
        raise ForgeAPIError(f"Failed to start model translation: {response.text}")


def get_translation_status(encoded_urn: str) -> dict:
    response = httpx.get(
        f"{APS_BASE}/modelderivative/v2/designdata/{encoded_urn}/manifest",
        headers=_auth_headers(),
        timeout=30.0,
    )

    if response.status_code == 404:
        return {"status": "pending", "progress": "0%", "messages": []}

    if response.status_code != 200:
        raise ForgeAPIError(f"Failed to read translation manifest: {response.text}")

    manifest = response.json()
    status = manifest.get("status", "pending").lower()

    if status == "success":
        return {"status": "success", "progress": "100%", "messages": manifest.get("derivatives", [])}

    if status == "failed":
        return {
            "status": "failed",
            "progress": manifest.get("progress", "0%"),
            "messages": manifest.get("messages", []),
        }

    return {
        "status": "inprogress",
        "progress": manifest.get("progress", "0%"),
        "messages": manifest.get("messages", []),
    }


def upload_and_translate(file_bytes: bytes, filename: str) -> dict:
    object_id, encoded_urn = upload_object(file_bytes, filename)
    start_translation(encoded_urn)
    status = get_translation_status(encoded_urn)

    return {
        "urn": encoded_urn,
        "object_id": object_id,
        "file_name": filename,
        "status": status["status"],
        "progress": status["progress"],
    }
