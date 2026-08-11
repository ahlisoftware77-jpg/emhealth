from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class CompareRequest(BaseModel):
    file1_name: str
    file2_name: str
    key_columns_file1: List[str]
    key_columns_file2: List[str]
    match_mode: str = "exact"  # "exact" or "similar"
    similarity_threshold: float = Field(80.0, ge=1.0, le=100.0)
    export_format: str = "xlsx"  # "xlsx" or "csv"

class RemoveDuplicateRequest(BaseModel):
    file_name: str
    target_columns: List[str]
    keep_strategy: str = "first"  # "first", "last", "unique"
    sort_column: Optional[str] = None
    sort_order: str = "asc" # "asc", "desc"
    export_format: str = "xlsx"

class MergeRequest(BaseModel):
    file_names: List[str]
    add_source_column: bool = True
    export_format: str = "xlsx"

class SplitRequest(BaseModel):
    file_name: str
    split_mode: str = "rows"  # "rows" or "column"
    max_rows_per_file: Optional[int] = 10000
    split_column: Optional[str] = None
    export_format: str = "xlsx"

class ImageRenameRequest(BaseModel):
    image_names: List[str]
    excel_file_name: str
    template: str = "{Nama}_{NIK}"
    match_excel_column: str
    prefix: str = ""
    suffix: str = ""
    regex_pattern: Optional[str] = None
    regex_replace: Optional[str] = None
    case_transform: str = "none"  # "none", "uppercase", "lowercase", "titlecase"
    output_target: str = "zip"  # "zip", "local", "cloudinary"

class ImageRenamePreviewRequest(BaseModel):
    sample_images: List[str]
    excel_file_name: str
    template: str = "{Nama}_{NIK}"
    match_excel_column: str
    prefix: str = ""
    suffix: str = ""
    regex_pattern: Optional[str] = None
    regex_replace: Optional[str] = None
    case_transform: str = "none"

class ImageCompressRequest(BaseModel):
    image_names: List[str]
    quality: int = Field(80, ge=1, le=100)
    max_width: Optional[int] = None
    max_height: Optional[int] = None
    target_format: str = "original"  # "original", "JPEG", "PNG", "WEBP"
    remove_metadata: bool = True
    output_target: str = "zip"  # "zip", "local", "cloudinary"

class OCRRequest(BaseModel):
    image_names: List[str]
    export_format: str = "txt"  # "txt", "csv", "xlsx"
    lang: str = "ind+eng"

class CodeGenRequest(BaseModel):
    code_type: str = "qr"  # "qr" or "barcode"
    content_list: List[str]
    excel_column: Optional[str] = None
    barcode_format: str = "code128"
    dark_color: str = "#000000"
    light_color: str = "#FFFFFF"

class CloudinaryUploadRequest(BaseModel):
    file_names: List[str]
    folder_path: str = "data_utility_center"
    tags: List[str] = []

class SettingsSchema(BaseModel):
    primary_storage_engine: str = "cloudinary"
    tesseract_cmd: Optional[str] = None
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: Optional[str] = ""
    openai_api_key: Optional[str] = ""
    gemini_api_key: Optional[str] = ""
    deepseek_api_key: Optional[str] = ""
    primary_ai_provider: Optional[str] = "openai"
    firebase_api_key: Optional[str] = ""
    firebase_auth_domain: Optional[str] = ""
    firebase_project_id: Optional[str] = ""
    firebase_service_account_json: Optional[str] = ""
    firebase_storage_bucket: Optional[str] = ""
    firebase_messaging_sender_id: Optional[str] = ""
    firebase_app_id: Optional[str] = ""

class PresetSchema(BaseModel):
    id: Optional[str] = None
    name: str
    category: str  # "rename", "compress", "compare", "ocr"
    configuration: Dict[str, Any]
    created_at: Optional[float] = None

class JobResponse(BaseModel):
    job_id: str
    task_type: str
    status: str  # "Waiting", "Running", "Completed", "Failed", "Retry"
    progress: float  # 0 to 100
    message: str
    result_url: Optional[str] = None
    download_filename: Optional[str] = None
    created_at: float
    updated_at: float
