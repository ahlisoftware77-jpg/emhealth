import os
import zipfile
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
from PIL import Image
from app.core.config import settings
import logging

# Register pillow_heif if available
try:
    import pillow_heif
    pillow_heif.register_heif_opener()
except Exception:
    pass

logger = logging.getLogger(__name__)

class ImageService:
    @staticmethod
    def compress_single_image(
        input_path: Path,
        output_dir: Path,
        quality: int = 80,
        max_width: Optional[int] = None,
        max_height: Optional[int] = None,
        target_format: str = "original",
        remove_metadata: bool = True
    ) -> Tuple[Path, Dict[str, Any]]:
        with Image.open(input_path) as img:
            initial_size = input_path.stat().st_size
            
            # Format handling
            orig_format = img.format or "JPEG"
            if target_format == "original":
                save_format = orig_format
                ext = input_path.suffix
            else:
                save_format = target_format.upper()
                ext_map = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp", "BMP": ".bmp"}
                ext = ext_map.get(save_format, ".jpg")

            # Convert RGBA to RGB for JPEG
            if save_format in ["JPEG", "JPG"] and img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            # Resize if dimensions specified
            if max_width or max_height:
                img.thumbnail((max_width or img.width, max_height or img.height), Image.Resampling.LANCZOS)

            # Metadata stripping
            save_kwargs = {}
            if save_format in ["JPEG", "JPG", "WEBP"]:
                save_kwargs["quality"] = quality
                save_kwargs["optimize"] = True

            if remove_metadata:
                # Re-create image data without EXIF payload
                data = list(img.getdata())
                clean_img = Image.new(img.mode, img.size)
                clean_img.putdata(data)
                img = clean_img

            output_filename = f"compressed_{input_path.stem}{ext}"
            output_path = output_dir / output_filename
            img.save(output_path, format=save_format, **save_kwargs)

            compressed_size = output_path.stat().st_size
            reduction_pct = round(((initial_size - compressed_size) / initial_size) * 100, 2) if initial_size > 0 else 0.0

            return output_path, {
                "filename": output_filename,
                "initial_bytes": initial_size,
                "compressed_bytes": compressed_size,
                "reduction_percent": max(0.0, reduction_pct)
            }

    @staticmethod
    def batch_compress(
        image_paths: List[Path],
        quality: int = 80,
        max_width: Optional[int] = None,
        max_height: Optional[int] = None,
        target_format: str = "original",
        remove_metadata: bool = True
    ) -> Tuple[Path, Dict[str, Any]]:
        temp_out = settings.TEMP_DIR / f"batch_compress_{os.urandom(4).hex()}"
        temp_out.mkdir(parents=True, exist_ok=True)

        results = []
        total_initial = 0
        total_compressed = 0

        for img_path in image_paths:
            try:
                out_path, info = ImageService.compress_single_image(
                    img_path, temp_out, quality, max_width, max_height, target_format, remove_metadata
                )
                results.append(info)
                total_initial += info["initial_bytes"]
                total_compressed += info["compressed_bytes"]
            except Exception as e:
                logger.error(f"Error compressing {img_path.name}: {e}")

        # Package into ZIP archive
        zip_filename = f"compressed_images_{os.urandom(4).hex()}.zip"
        zip_path = settings.OUTPUT_DIR / zip_filename

        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for f in temp_out.glob('*'):
                zipf.write(f, arcname=f.name)

        overall_reduction = round(((total_initial - total_compressed) / total_initial) * 100, 2) if total_initial > 0 else 0.0

        summary = {
            "total_images": len(image_paths),
            "processed_images": len(results),
            "total_initial_bytes": total_initial,
            "total_compressed_bytes": total_compressed,
            "overall_reduction_percent": overall_reduction,
            "zip_filename": zip_filename,
            "details": results
        }
        return zip_path, summary
