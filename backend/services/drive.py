import io
import os
import uuid
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload, MediaIoBaseDownload

DRIVE_SCOPE = ['https://www.googleapis.com/auth/drive.file']

class DriveService:
    def __init__(self, credentials_path="credentials.json"):
        self._mock_storage = {} # 仮想ドライブ（メモリ保存）
        self._is_mock = False
        
        # クレデンシャルファイルがない、または読み込めない場合はMockモードで起動
        if not os.path.exists(credentials_path):
            print(f"⚠️ Warning: '{credentials_path}' not found. Switch to In-Memory Mock Drive Mode.")
            self._is_mock = True
            return

        try:
            self._credentials = self._load_credentials(credentials_path)
            self._service = build('drive', 'v3', credentials=self._credentials)
            print("✅ Connected to Google Drive.")
        except Exception as e:
            print(f"⚠️ Error connecting to Drive: {e}. Switch to In-Memory Mock Drive Mode.")
            self._is_mock = True

    def _load_credentials(self, path):
        return service_account.Credentials.from_service_account_file(path, scopes=DRIVE_SCOPE)

    def upload_stream(self, file_obj, filename, mime_type):
        """ファイルをアップロードし、File IDを返す"""
        if self._is_mock:
            # Mock: メモリ上に保存し、ダミーIDを返す
            file_id = str(uuid.uuid4())
            # ポインタを先頭に戻してから読み込む
            if hasattr(file_obj, 'seek'):
                file_obj.seek(0)
            data = file_obj.read()
            
            self._mock_storage[file_id] = {
                "name": filename,
                "mime_type": mime_type,
                "data": data
            }
            print(f"[Mock] Uploaded {filename} (ID: {file_id})")
            return file_id
        
        # Real: Google Driveへアップロード
        media = MediaIoBaseUpload(file_obj, mimetype=mime_type, resumable=True)
        file_metadata = {'name': filename}
        # 親フォルダ指定があればここで parents=[folder_id] を追加可能
        file = self._service.files().create(body=file_metadata, media_body=media, fields='id').execute()
        return file.get('id')

    def get_file_stream(self, file_id):
        """File IDからファイルをダウンロードし、BytesIOを返す"""
        if self._is_mock:
            # Mock: メモリから取得
            if file_id not in self._mock_storage:
                raise Exception(f"[Mock] File {file_id} not found in memory.")
            
            data = self._mock_storage[file_id]["data"]
            return io.BytesIO(data)

        # Real: Google Driveからダウンロード
        request = self._service.files().get_media(fileId=file_id)
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while done is False:
            status, done = downloader.next_chunk()
        
        fh.seek(0)
        return fh