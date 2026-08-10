import os
import zipfile
import qrcode
import barcode
from barcode.writer import ImageWriter
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class CodeGenService:
    @staticmethod
    def generate_qr(
        text: str,
        output_path: Path,
        dark_color: str = "#000000",
        light_color: str = "#FFFFFF"
    ) -> Path:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        qr.add_data(text)
        qr.make(fit=True)
        img = qr.make_image(fill_color=dark_color, back_color=light_color)
        img.save(output_path)
        return output_path

    @staticmethod
    def generate_barcode(
        text: str,
        output_path_no_ext: Path,
        barcode_type: str = "code128"
    ) -> Path:
        try:
            code_cls = barcode.get_barcode_class(barcode_type.lower())
            bc = code_cls(text, writer=ImageWriter())
            full_path = bc.save(output_path_no_ext)
            return Path(full_path)
        except Exception as e:
            logger.error(f"Barcode error for '{text}': {e}")
            # Fallback to code128
            code_cls = barcode.get_barcode_class("code128")
            bc = code_cls(text, writer=ImageWriter())
            full_path = bc.save(output_path_no_ext)
            return Path(full_path)

    @staticmethod
    def batch_generate(
        code_type: str,  # "qr" or "barcode"
        content_list: List[str],
        barcode_format: str = "code128",
        dark_color: str = "#000000",
        light_color: str = "#FFFFFF"
    ) -> Tuple[Path, Dict[str, Any]]:
        temp_dir = settings.TEMP_DIR / f"code_gen_{os.urandom(4).hex()}"
        temp_dir.mkdir(parents=True, exist_ok=True)

        generated_files = []
        for idx, text in enumerate(content_list):
            clean_text = str(text).strip()
            if not clean_text:
                continue

            safe_name = "".join(c for c in clean_text if c.isalnum() or c in ("_", "-")).strip() or f"code_{idx+1}"
            
            if code_type.lower() == "qr":
                out_path = temp_dir / f"QR_{safe_name}.png"
                CodeGenService.generate_qr(clean_text, out_path, dark_color, light_color)
                generated_files.append(out_path)
            else:
                out_base = temp_dir / f"BC_{safe_name}"
                out_path = CodeGenService.generate_barcode(clean_text, out_base, barcode_format)
                generated_files.append(out_path)

        zip_filename = f"generated_{code_type}_{os.urandom(4).hex()}.zip"
        zip_path = settings.OUTPUT_DIR / zip_filename

        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for f in temp_dir.glob('*'):
                zipf.write(f, arcname=f.name)

        summary = {
            "total_items": len(content_list),
            "generated_count": len(generated_files),
            "zip_filename": zip_filename
        }
        return zip_path, summary
