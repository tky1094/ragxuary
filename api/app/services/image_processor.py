"""Image processing service."""

import io
from typing import BinaryIO

from PIL import Image

from app.config import settings
from app.services.exceptions import InvalidFileTypeError


class ImageProcessor:
    """Service for image processing operations."""

    SUPPORTED_FORMATS = {"PNG", "JPEG", "GIF", "WEBP"}

    def __init__(
        self,
        max_dimension: int | None = None,
        jpeg_quality: int | None = None,
        webp_quality: int | None = None,
        png_compression: int | None = None,
    ) -> None:
        """Initialize image processor with configuration.

        Args:
            max_dimension: Maximum width/height in pixels.
            jpeg_quality: JPEG compression quality (1-100).
            webp_quality: WebP compression quality (1-100).
            png_compression: PNG compression level (0-9).
        """
        self.max_dimension = max_dimension or settings.upload_max_dimension
        self.jpeg_quality = jpeg_quality or settings.upload_jpeg_quality
        self.webp_quality = webp_quality or settings.upload_webp_quality
        self.png_compression = png_compression or settings.upload_png_compression

    def process(self, file: BinaryIO, mime_type: str) -> tuple[io.BytesIO, str, int]:
        """Process image: resize and compress.

        Args:
            file: Input file object.
            mime_type: Original MIME type.

        Returns:
            Tuple of (processed file buffer, mime_type, size_bytes).

        Raises:
            InvalidFileTypeError: If image format is not supported.
        """
        try:
            img = Image.open(file)
        except Exception as e:
            raise InvalidFileTypeError(f"Failed to open image: {e}") from e

        # Validate format
        if img.format not in self.SUPPORTED_FORMATS:
            raise InvalidFileTypeError(f"Unsupported image format: {img.format}")

        # Resize if needed
        img = self._resize_if_needed(img)

        # Compress and save to buffer
        output = io.BytesIO()
        output_mime = mime_type

        if img.format == "JPEG" or mime_type == "image/jpeg":
            # Convert to RGB if necessary (for RGBA/P images)
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            img.save(output, format="JPEG", quality=self.jpeg_quality, optimize=True)
            output_mime = "image/jpeg"
        elif img.format == "WEBP" or mime_type == "image/webp":
            img.save(output, format="WEBP", quality=self.webp_quality)
            output_mime = "image/webp"
        elif img.format == "PNG" or mime_type == "image/png":
            img.save(output, format="PNG", compress_level=self.png_compression)
            output_mime = "image/png"
        elif img.format == "GIF" or mime_type == "image/gif":
            # GIF: preserve animation if present
            if hasattr(img, "n_frames") and img.n_frames > 1:
                # Animated GIF
                img.save(output, format="GIF", save_all=True)
            else:
                img.save(output, format="GIF")
            output_mime = "image/gif"
        else:
            raise InvalidFileTypeError(f"Cannot process format: {img.format}")

        output.seek(0)
        size = output.getbuffer().nbytes
        return output, output_mime, size

    def _resize_if_needed(self, img: Image.Image) -> Image.Image:
        """Resize image if either dimension exceeds max.

        Args:
            img: PIL Image object.

        Returns:
            Resized image or original if no resize needed.
        """
        width, height = img.size

        if width <= self.max_dimension and height <= self.max_dimension:
            return img

        # Calculate new dimensions maintaining aspect ratio
        if width > height:
            new_width = self.max_dimension
            new_height = int(height * (self.max_dimension / width))
        else:
            new_height = self.max_dimension
            new_width = int(width * (self.max_dimension / height))

        # Use high-quality resampling
        return img.resize((new_width, new_height), Image.Resampling.LANCZOS)
