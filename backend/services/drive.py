# backend/services/drive.py
import io
import json
import os
from typing import Optional

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload, MediaIoBaseUpload

DRIVE_SCOPE = ["https://www.googleapis.com/auth/drive.file"]
DEFAULT_CREDENTIALS_PATH = "credentials.json"
DEFAULT_FOLDER_ENV = "GOOGLE_DRIVE_FOLDER_ID"


class DriveService:
    def __init__(self, credentials_path: Optional[str] = None, folder_id: Optional[str] = None):
        self._credentials = self._load_credentials(credentials_path)
        self._service = build("drive", "v3", credentials=self._credentials)
        self._folder_id = folder_id or os.getenv(DEFAULT_FOLDER_ENV)

    def upload_stream(self, file_obj, filename: str, mime_type: str) -> str:
        if hasattr(file_obj, "seek"):
            file_obj.seek(0)

        media = MediaIoBaseUpload(file_obj, mimetype=mime_type, resumable=False)
        body = {"name": filename}
        if self._folder_id:
            body["parents"] = [self._folder_id]

        response = (
            self._service.files()
            .create(body=body, media_body=media, fields="id")
            .execute()
        )
        return response["id"]

    def get_file_stream(self, file_id: str) -> io.BytesIO:
        request = self._service.files().get_media(fileId=file_id)
        buffer = io.BytesIO()
        downloader = MediaIoBaseDownload(buffer, request)
        done = False
        while not done:
            _, done = downloader.next_chunk()
        buffer.seek(0)
        return buffer

    def _load_credentials(self, credentials_path: Optional[str]):
        json_env = os.getenv("GOOGLE_DRIVE_CREDENTIALS_JSON")
        if json_env:
            info = json.loads(json_env)
            return service_account.Credentials.from_service_account_info(info, scopes=DRIVE_SCOPE)

        path = credentials_path or os.getenv("GOOGLE_DRIVE_CREDENTIALS_PATH") or DEFAULT_CREDENTIALS_PATH
        return service_account.Credentials.from_service_account_file(path, scopes=DRIVE_SCOPE)
