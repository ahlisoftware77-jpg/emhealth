import os
import pytesseract
from PIL import Image
from pathlib import Path
from typing import List, Dict, Any, Tuple
import pandas as pd
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Configure pytesseract path if binary exists
if os.path.exists(settings.TESSERACT_CMD):
    pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD

class OCRService:
    @staticmethod
    def extract_text_from_image(image_path: Path, lang: str = "ind+eng") -> str:
        try:
            with Image.open(image_path) as img:
                text = pytesseract.image_to_string(img, lang=lang)
                return text.strip()
        except Exception as e:
            logger.error(f"OCR Error for {image_path.name}: {e}")
            return f"[Gagal OCR: {str(e)}]"

    @staticmethod
    def batch_ocr(
        image_paths: List[Path],
        export_format: str = "txt",
        lang: str = "ind+eng"
    ) -> Tuple[Path, Dict[str, Any]]:
        results = []
        for img_path in image_paths:
            extracted = OCRService.extract_text_from_image(img_path, lang=lang)
            results.append({
                "Filename": img_path.name,
                "Extracted_Text": extracted
            })

        output_filename = f"ocr_result_{os.urandom(4).hex()}.{export_format}"
        output_path = settings.OUTPUT_DIR / output_filename

        if export_format == "txt":
            with open(output_path, "w", encoding="utf-8") as f:
                for res in results:
                    f.write(f"=== File: {res['Filename']} ===\n")
                    f.write(f"{res['Extracted_Text']}\n\n")
        elif export_format == "csv":
            df = pd.DataFrame(results)
            df.to_csv(output_path, index=False)
        else:  # xlsx
            df = pd.DataFrame(results)
            df.to_excel(output_path, index=False, engine="openpyxl")

        summary = {
            "total_images": len(image_paths),
            "output_file": output_filename,
            "results": results
        }
        return output_path, summary
