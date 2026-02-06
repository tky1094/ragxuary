"""Tests for ImageProcessor service."""

import io

import pytest
from PIL import Image

from app.services.exceptions import InvalidFileTypeError
from app.services.image_processor import ImageProcessor


@pytest.fixture
def processor() -> ImageProcessor:
    """Create an ImageProcessor instance with test settings."""
    return ImageProcessor(
        max_dimension=100,
        jpeg_quality=85,
        webp_quality=85,
        png_compression=9,
    )


def create_test_image(
    width: int, height: int, format: str = "PNG", mode: str = "RGB"
) -> io.BytesIO:
    """Create a test image in memory.

    Args:
        width: Image width.
        height: Image height.
        format: Image format (PNG, JPEG, GIF, WEBP).
        mode: Color mode (RGB, RGBA, P, L).

    Returns:
        BytesIO containing the image data.
    """
    img = Image.new(mode, (width, height), color="red")
    buffer = io.BytesIO()

    if format == "JPEG" and mode in ("RGBA", "P"):
        img = img.convert("RGB")

    img.save(buffer, format=format)
    buffer.seek(0)
    return buffer


class TestImageProcessor:
    """Tests for ImageProcessor."""

    def test_process_png_no_resize(self, processor: ImageProcessor) -> None:
        """Test processing PNG that doesn't need resize."""
        img_buffer = create_test_image(50, 50, "PNG")

        result, mime_type, size = processor.process(img_buffer, "image/png")

        assert mime_type == "image/png"
        assert size > 0
        # Verify it's still a valid image
        result.seek(0)
        img = Image.open(result)
        assert img.format == "PNG"
        assert img.size == (50, 50)

    def test_process_png_with_resize(self, processor: ImageProcessor) -> None:
        """Test processing PNG that needs resize."""
        img_buffer = create_test_image(200, 150, "PNG")

        result, mime_type, size = processor.process(img_buffer, "image/png")

        assert mime_type == "image/png"
        result.seek(0)
        img = Image.open(result)
        # Should be resized to fit within 100x100
        assert img.size[0] <= 100
        assert img.size[1] <= 100

    def test_process_jpeg(self, processor: ImageProcessor) -> None:
        """Test processing JPEG image."""
        img_buffer = create_test_image(50, 50, "JPEG")

        result, mime_type, size = processor.process(img_buffer, "image/jpeg")

        assert mime_type == "image/jpeg"
        result.seek(0)
        img = Image.open(result)
        assert img.format == "JPEG"

    def test_process_jpeg_from_rgba(self, processor: ImageProcessor) -> None:
        """Test processing RGBA image as JPEG converts to RGB."""
        img_buffer = create_test_image(50, 50, "PNG", mode="RGBA")

        result, mime_type, size = processor.process(img_buffer, "image/jpeg")

        assert mime_type == "image/jpeg"
        result.seek(0)
        img = Image.open(result)
        assert img.mode == "RGB"

    def test_process_webp(self, processor: ImageProcessor) -> None:
        """Test processing WebP image."""
        img_buffer = create_test_image(50, 50, "WEBP")

        result, mime_type, size = processor.process(img_buffer, "image/webp")

        assert mime_type == "image/webp"
        result.seek(0)
        img = Image.open(result)
        assert img.format == "WEBP"

    def test_process_gif(self, processor: ImageProcessor) -> None:
        """Test processing GIF image."""
        img_buffer = create_test_image(50, 50, "GIF")

        result, mime_type, size = processor.process(img_buffer, "image/gif")

        assert mime_type == "image/gif"
        result.seek(0)
        img = Image.open(result)
        assert img.format == "GIF"

    def test_process_unsupported_format(self, processor: ImageProcessor) -> None:
        """Test processing unsupported format raises error."""
        # Create a BMP image (not in supported formats)
        img = Image.new("RGB", (50, 50), color="red")
        buffer = io.BytesIO()
        img.save(buffer, format="BMP")
        buffer.seek(0)

        with pytest.raises(InvalidFileTypeError, match="Unsupported image format"):
            processor.process(buffer, "image/bmp")

    def test_process_invalid_file(self, processor: ImageProcessor) -> None:
        """Test processing invalid file raises error."""
        buffer = io.BytesIO(b"not an image")

        with pytest.raises(InvalidFileTypeError, match="Failed to open image"):
            processor.process(buffer, "image/png")

    def test_resize_maintains_aspect_ratio_landscape(
        self, processor: ImageProcessor
    ) -> None:
        """Test resize maintains aspect ratio for landscape images."""
        img_buffer = create_test_image(200, 100, "PNG")

        result, _, _ = processor.process(img_buffer, "image/png")

        result.seek(0)
        img = Image.open(result)
        # Width should be 100, height should be 50 (maintaining 2:1 ratio)
        assert img.size[0] == 100
        assert img.size[1] == 50

    def test_resize_maintains_aspect_ratio_portrait(
        self, processor: ImageProcessor
    ) -> None:
        """Test resize maintains aspect ratio for portrait images."""
        img_buffer = create_test_image(100, 200, "PNG")

        result, _, _ = processor.process(img_buffer, "image/png")

        result.seek(0)
        img = Image.open(result)
        # Height should be 100, width should be 50 (maintaining 1:2 ratio)
        assert img.size[0] == 50
        assert img.size[1] == 100
