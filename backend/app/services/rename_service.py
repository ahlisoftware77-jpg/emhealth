import re
import os
import shutil
import zipfile
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
import pandas as pd
from datetime import datetime
from app.services.excel_service import ExcelService
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class RenameService:
    @staticmethod
    def generate_new_name(
        template: str,
        excel_row: Dict[str, Any],
        running_number: int,
        prefix: str = "",
        suffix: str = "",
        regex_pattern: Optional[str] = None,
        regex_replace: Optional[str] = None,
        case_transform: str = "none"
    ) -> str:
        new_name = template
        
        # Replace tokens like {Nama}, {NIK}, {NoHP}, {Tanggal}, {RunningNumber}
        new_name = new_name.replace("{RunningNumber}", str(running_number).zfill(4))
        new_name = new_name.replace("{Tanggal}", datetime.now().strftime("%Y%m%d"))
        
        for col, val in excel_row.items():
            placeholder = f"{{{col}}}"
            if placeholder in new_name:
                new_name = new_name.replace(placeholder, str(val).strip())

        # Clean remaining unmapped placeholders
        new_name = re.sub(r"\{.*?\}", "", new_name)

        # Regex replacement if provided
        if regex_pattern:
            try:
                new_name = re.sub(regex_pattern, regex_replace or "", new_name)
            except Exception as e:
                logger.warning(f"Regex error: {e}")

        # Prefix & Suffix
        new_name = f"{prefix}{new_name}{suffix}".strip()

        # Case Transformation
        if case_transform == "uppercase":
            new_name = new_name.upper()
        elif case_transform == "lowercase":
            new_name = new_name.lower()
        elif case_transform == "titlecase":
            new_name = new_name.title()

        # Sanitize invalid file path characters
        new_name = "".join(c for c in new_name if c.isalnum() or c in (" ", "_", "-")).strip()
        return new_name or f"renamed_{running_number}"

    @staticmethod
    def preview_rename(
        sample_image_names: List[str],
        excel_path: Path,
        template: str,
        match_excel_column: str,
        prefix: str = "",
        suffix: str = "",
        regex_pattern: Optional[str] = None,
        regex_replace: Optional[str] = None,
        case_transform: str = "none"
    ) -> List[Dict[str, Any]]:
        df = ExcelService.load_dataframe(excel_path)
        records = df.to_dict(orient="records")
        preview_list = []

        # Index lookup map for matching column
        match_map = {}
        if match_excel_column in df.columns:
            for idx, r in enumerate(records):
                key = str(r.get(match_excel_column, "")).strip().lower()
                if key:
                    match_map[key] = r

        for idx, img_name in enumerate(sample_image_names):
            stem, ext = os.path.splitext(img_name)
            clean_stem = stem.strip().lower()
            
            # Find matching excel row or fallback to row index
            excel_row = match_map.get(clean_stem) or (records[idx] if idx < len(records) else {})
            
            new_stem = RenameService.generate_new_name(
                template=template,
                excel_row=excel_row,
                running_number=idx + 1,
                prefix=prefix,
                suffix=suffix,
                regex_pattern=regex_pattern,
                regex_replace=regex_replace,
                case_transform=case_transform
            )
            
            preview_list.append({
                "original_filename": img_name,
                "proposed_filename": f"{new_stem}{ext}",
                "matched_data": excel_row
            })

        return preview_list

    @staticmethod
    def batch_rename(
        image_paths: List[Path],
        excel_path: Path,
        template: str,
        match_excel_column: str,
        prefix: str = "",
        suffix: str = "",
        regex_pattern: Optional[str] = None,
        regex_replace: Optional[str] = None,
        case_transform: str = "none"
    ) -> Tuple[Path, Dict[str, Any]]:
        df = ExcelService.load_dataframe(excel_path)
        records = df.to_dict(orient="records")
        
        temp_out = settings.TEMP_DIR / f"batch_rename_{os.urandom(4).hex()}"
        temp_out.mkdir(parents=True, exist_ok=True)

        match_map = {}
        if match_excel_column in df.columns:
            for r in records:
                key = str(r.get(match_excel_column, "")).strip().lower()
                if key:
                    match_map[key] = r

        renamed_count = 0
        details = []

        for idx, img_path in enumerate(image_paths):
            ext = img_path.suffix
            clean_stem = img_path.stem.strip().lower()
            excel_row = match_map.get(clean_stem) or (records[idx] if idx < len(records) else {})

            new_stem = RenameService.generate_new_name(
                template=template,
                excel_row=excel_row,
                running_number=idx + 1,
                prefix=prefix,
                suffix=suffix,
                regex_pattern=regex_pattern,
                regex_replace=regex_replace,
                case_transform=case_transform
            )
            
            target_name = f"{new_stem}{ext}"
            target_path = temp_out / target_name
            
            # Copy and rename file
            shutil.copy2(img_path, target_path)
            renamed_count += 1
            details.append({
                "original": img_path.name,
                "renamed": target_name
            })

        # Zip result
        zip_filename = f"renamed_images_{os.urandom(4).hex()}.zip"
        zip_path = settings.OUTPUT_DIR / zip_filename

        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for f in temp_out.glob('*'):
                zipf.write(f, arcname=f.name)

        summary = {
            "total_images": len(image_paths),
            "renamed_count": renamed_count,
            "zip_filename": zip_filename,
            "renamed_files": details
        }
        return zip_path, summary
