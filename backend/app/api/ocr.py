"""画像アップロードおよびOCR関連API。"""

from typing import Annotated, Final, Literal, cast
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.schemas.common import ImageUploadResponse


router = APIRouter(
    prefix="/api/ocr",
    tags=["OCR"],
)


MAX_IMAGE_SIZE_BYTES: Final[int] = 10 * 1024 * 1024

SUPPORTED_CONTENT_TYPES: Final[frozenset[str]] = frozenset(
    {
        "image/jpeg",
        "image/png",
        "image/webp",
    }
)

SupportedContentType = Literal[
    "image/jpeg",
    "image/png",
    "image/webp",
]


def detect_image_content_type(image_data: bytes) -> SupportedContentType | None:
    """画像の先頭データから実際の画像形式を判定する。"""

    if image_data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"

    if image_data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"

    if (
        len(image_data) >= 12
        and image_data.startswith(b"RIFF")
        and image_data[8:12] == b"WEBP"
    ):
        return "image/webp"

    return None


@router.post(
    "/upload",
    response_model=ImageUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="OCR対象画像をアップロードする",
)
async def upload_ocr_image(
    image: Annotated[
        UploadFile,
        File(description="OCR対象のJPEG・PNG・WebP画像"),
    ],
) -> ImageUploadResponse:
    """OCR対象画像を受信し、形式とサイズを検証する。

    このStepでは画像を保存せず、OCR処理も実行しない。
    """
    declared_content_type: str = image.content_type or ""

    if declared_content_type not in SUPPORTED_CONTENT_TYPES:
        await image.close()

        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail={
                "code": "UNSUPPORTED_IMAGE_TYPE",
                "message": (
                    "JPEG、PNG、WebP形式の画像を指定してください。"
                ),
            },
        )

    try:
        image_data: bytes = await image.read(MAX_IMAGE_SIZE_BYTES + 1)
    finally:
        await image.close()

    if len(image_data) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "EMPTY_IMAGE_FILE",
                "message": "画像ファイルが空です。",
            },
        )

    if len(image_data) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={
                "code": "IMAGE_TOO_LARGE",
                "message": "画像ファイルは10MB以下にしてください。",
            },
        )

    detected_content_type: SupportedContentType | None = (
        detect_image_content_type(image_data)
    )

    if detected_content_type is None:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail={
                "code": "INVALID_IMAGE_DATA",
                "message": "有効な画像データを確認できませんでした。",
            },
        )

    if detected_content_type != declared_content_type:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail={
                "code": "IMAGE_TYPE_MISMATCH",
                "message": (
                    "申告された画像形式と実際の画像形式が一致しません。"
                ),
            },
        )

    original_filename: str = image.filename or "uploaded-image"
    safe_content_type: SupportedContentType = cast(
        SupportedContentType,
        detected_content_type,
    )

    return ImageUploadResponse(
        status="accepted",
        upload_id=str(uuid4()),
        filename=original_filename,
        content_type=safe_content_type,
        size_bytes=len(image_data),
        message="Image upload accepted",
    )