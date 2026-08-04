"""画像アップロードおよびGoogle Cloud Vision OCR関連API。"""

import base64
import io
import json
import socket
import urllib.error
import urllib.request
from typing import Annotated, Final, Literal, cast
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from google import genai
from google.genai import errors, types
from PIL import (
    Image,
    ImageEnhance,
    ImageFilter,
    ImageOps,
    UnidentifiedImageError,
)
from pydantic import ValidationError

from app.config import settings
from app.schemas.common import (
    GeminiStructuredOcrResponse,
    ImageUploadResponse,
    OcrResultResponse,
)

router = APIRouter(
    prefix="/api/ocr",
    tags=["OCR"],
)

MAX_IMAGE_SIZE_BYTES: Final[int] = 10 * 1024 * 1024
VISION_API_TIMEOUT_SECONDS: Final[int] = 30
OCR_MIN_LONG_EDGE_PIXELS: Final[int] = 2200
OCR_MAX_LONG_EDGE_PIXELS: Final[int] = 3200

OCR_CONTRAST_FACTOR: Final[float] = 1.2
OCR_SHARPEN_RADIUS: Final[float] = 1.2
OCR_SHARPEN_PERCENT: Final[int] = 120
OCR_SHARPEN_THRESHOLD: Final[int] = 3
GEMINI_MAX_OCR_CHARACTERS: Final[int] = 12_000


SYSTEM_INSTRUCTION: Final[str] = """
あなたはOCR済み文書を、指定されたJSONスキーマへ整理する処理です。

次の規則を必ず守ってください。

1. 入力されたOCR文字列だけを根拠にする。
2. OCR文字列にない情報を一般知識で補完しない。
3. 読み取れない値はnullまたは空配列にする。
4. 薬の名前に複数候補がある場合、medicine_nameはnullにする。
5. 複数候補はmedicine_name_candidatesへ格納する。
6. 起床時、朝、昼、夕、寝る前を個別に判定する。
7. 服用回数、1回の錠数、日数は、明記された場合だけ数値化する。
8. 薬のはたらき、注意事項、相互作用、副作用を混同しない。
9. 文脈が不明な断片はunclassified_textへ格納する。
10. 欠落、矛盾、OCR誤認識の可能性があればwarningsへ記録する。
11. 1項目でも確認が必要ならrequires_user_reviewをtrueにする。
12. 医療的な判断、診断、服用指示の追加は行わない。
""".strip()





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


def detect_image_content_type(
    image_data: bytes,
) -> SupportedContentType | None:
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

def preprocess_image_for_ocr(
    image_data: bytes,
) -> bytes:
    """画像をGoogle Cloud Vision OCR向けに軽く補正する。"""

    try:
        with Image.open(io.BytesIO(image_data)) as source_image:
            corrected_image: Image.Image = ImageOps.exif_transpose(
                source_image
            )

            if corrected_image.mode in {"RGBA", "LA"}:
                rgba_image: Image.Image = corrected_image.convert("RGBA")

                background: Image.Image = Image.new(
                    "RGB",
                    rgba_image.size,
                    "white",
                )

                alpha_channel: Image.Image = rgba_image.getchannel("A")

                background.paste(
                    rgba_image.convert("RGB"),
                    mask=alpha_channel,
                )

                processed_image: Image.Image = background
            else:
                processed_image = corrected_image.convert("RGB")

            width: int
            height: int
            width, height = processed_image.size

            if width <= 0 or height <= 0:
                raise ValueError("画像の幅または高さが不正です。")

            long_edge: int = max(width, height)

            if long_edge < OCR_MIN_LONG_EDGE_PIXELS:
                resize_ratio: float = (
                    OCR_MIN_LONG_EDGE_PIXELS / long_edge
                )

                resized_width: int = max(
                    1,
                    round(width * resize_ratio),
                )
                resized_height: int = max(
                    1,
                    round(height * resize_ratio),
                )

                processed_image = processed_image.resize(
                    (resized_width, resized_height),
                    Image.Resampling.LANCZOS,
                )

            elif long_edge > OCR_MAX_LONG_EDGE_PIXELS:
                resize_ratio = (
                    OCR_MAX_LONG_EDGE_PIXELS / long_edge
                )

                resized_width = max(
                    1,
                    round(width * resize_ratio),
                )
                resized_height = max(
                    1,
                    round(height * resize_ratio),
                )

                processed_image = processed_image.resize(
                    (resized_width, resized_height),
                    Image.Resampling.LANCZOS,
                )

            processed_image = ImageOps.autocontrast(
                processed_image,
                cutoff=1,
            )

            processed_image = ImageEnhance.Contrast(
                processed_image
            ).enhance(OCR_CONTRAST_FACTOR)

            processed_image = processed_image.filter(
                ImageFilter.UnsharpMask(
                    radius=OCR_SHARPEN_RADIUS,
                    percent=OCR_SHARPEN_PERCENT,
                    threshold=OCR_SHARPEN_THRESHOLD,
                )
            )

            output_buffer = io.BytesIO()

            processed_image.save(
                output_buffer,
                format="JPEG",
                quality=95,
                optimize=True,
                progressive=False,
            )

            return output_buffer.getvalue()

    except (
        UnidentifiedImageError,
        OSError,
        ValueError,
    ) as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "IMAGE_PREPROCESSING_FAILED",
                "message": (
                    "OCR用の画像前処理に失敗しました。"
                    "画像を確認して再度撮影してください。"
                ),
            },
        ) from error


def _parse_vision_response(
    response_body: str,
) -> str:
    """Vision APIのJSON応答を検証し、全文テキストを返す。"""

    try:
        parsed_response: object = json.loads(response_body)
    except json.JSONDecodeError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "code": "INVALID_VISION_RESPONSE",
                "message": (
                    "Google Cloud Vision APIから"
                    "不正なJSON応答が返されました。"
                ),
            },
        ) from error

    if not isinstance(parsed_response, dict):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "code": "INVALID_VISION_RESPONSE",
                "message": (
                    "Google Cloud Vision APIの"
                    "応答形式が不正です。"
                ),
            },
        )

    responses: object = parsed_response.get("responses")

    if (
        not isinstance(responses, list)
        or len(responses) == 0
        or not isinstance(responses[0], dict)
    ):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "code": "EMPTY_VISION_RESPONSE",
                "message": (
                    "Google Cloud Vision APIから"
                    "解析結果が返されませんでした。"
                ),
            },
        )

    first_response: dict[str, object] = responses[0]

    vision_error: object = first_response.get("error")

    if isinstance(vision_error, dict):
        upstream_message: object = vision_error.get("message")

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "code": "VISION_PROCESSING_ERROR",
                "message": (
                    upstream_message
                    if isinstance(upstream_message, str)
                    else (
                        "Google Cloud Vision APIで"
                        "OCR処理に失敗しました。"
                    )
                ),
            },
        )

    full_text_annotation: object = first_response.get(
        "fullTextAnnotation"
    )

    if isinstance(full_text_annotation, dict):
        extracted_text: object = full_text_annotation.get("text")

        if isinstance(extracted_text, str):
            return extracted_text.strip()

    text_annotations: object = first_response.get(
        "textAnnotations"
    )

    if (
        isinstance(text_annotations, list)
        and len(text_annotations) > 0
        and isinstance(text_annotations[0], dict)
    ):
        description: object = text_annotations[0].get(
            "description"
        )

        if isinstance(description, str):
            return description.strip()

    return ""


def request_cloud_vision_ocr(
    image_bytes: bytes,
) -> str:
    """Google Cloud Vision REST APIで文書画像から文字を抽出する。"""

    api_key: str = settings.google_vision_api_key.strip()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "MISSING_VISION_API_KEY",
                "message": (
                    "GOOGLE_VISION_API_KEYが"
                    "設定されていません。"
                ),
            },
        )

    url = (
        "https://vision.googleapis.com/"
        f"v1/images:annotate?key={api_key}"
    )

    encoded_image: str = base64.b64encode(
        image_bytes
    ).decode("ascii")

    payload: dict[str, object] = {
    "requests": [
        {
            "image": {
                "content": encoded_image,
            },
            "features": [
                {
                    "type": "DOCUMENT_TEXT_DETECTION",
                    "model": "builtin/latest",
                },
            ],
            "imageContext": {
                "languageHints": [
                    "ja",
                ],
            },
        },
    ],
}

    request = urllib.request.Request(
        url=url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": (
                "application/json; charset=utf-8"
            ),
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(
            request,
            timeout=VISION_API_TIMEOUT_SECONDS,
        ) as response:
            response_body: str = (
                response.read().decode("utf-8")
            )
    except urllib.error.HTTPError as error:
        error_body: str = error.read().decode(
            "utf-8",
            errors="replace",
        )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "code": "VISION_API_HTTP_ERROR",
                "message": (
                    "Google Cloud Vision APIへの"
                    "リクエストが拒否されました。"
                ),
                "upstream_status": error.code,
                "upstream_response": error_body,
            },
        ) from error
    except (
        urllib.error.URLError,
        ConnectionError,
    ) as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "code": "VISION_API_CONNECTION_ERROR",
                "message": (
                    "Google Cloud Vision APIへ"
                    "接続できませんでした。"
                ),
            },
        ) from error
    except (TimeoutError, socket.timeout) as error:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail={
                "code": "VISION_API_TIMEOUT",
                "message": (
                    "Google Cloud Vision APIの"
                    "応答がタイムアウトしました。"
                ),
            },
        ) from error

    return _parse_vision_response(response_body)


def _normalize_gemini_payload(
    payload: object,
) -> dict[str, object]:
    """GeminiのJSONをPydantic検証前に安全な値へ正規化する。"""

    if not isinstance(payload, dict):
        raise ValueError(
            "Geminiの応答JSONがオブジェクト形式ではありません。"
        )

    allowed_fields: set[str] = {
        "medicine_name",
        "medicine_name_candidates",
        "timing",
        "times_per_day",
        "tablets_per_dose",
        "number_of_days",
        "dosage_original_text",
        "medicine_information",
        "precautions",
        "interactions",
        "side_effects",
        "unclassified_text",
        "warnings",
        "requires_user_review",
    }

    normalized: dict[str, object] = {
        key: value
        for key, value in payload.items()
        if key in allowed_fields
    }

    for field_name in (
        "medicine_name_candidates",
        "medicine_information",
        "precautions",
        "interactions",
        "side_effects",
        "unclassified_text",
        "warnings",
    ):
        value: object = normalized.get(field_name)

        if value is None:
            normalized[field_name] = []
        elif isinstance(value, list):
            normalized[field_name] = [
                item.strip()
                for item in value
                if isinstance(item, str) and item.strip()
            ]
        else:
            normalized[field_name] = []

    for field_name in (
        "medicine_name",
        "dosage_original_text",
    ):
        value = normalized.get(field_name)

        if value is None:
            normalized[field_name] = None
        elif isinstance(value, str):
            stripped_value: str = value.strip()
            normalized[field_name] = (
                stripped_value if stripped_value else None
            )
        else:
            normalized[field_name] = None

    for field_name in (
        "times_per_day",
        "tablets_per_dose",
        "number_of_days",
    ):
        value = normalized.get(field_name)

        if value is None or value == "":
            normalized[field_name] = None
            continue

        if isinstance(value, bool):
            normalized[field_name] = None
            continue

        if isinstance(value, (int, float)):
            normalized[field_name] = (
                value if value > 0 else None
            )
            continue

        if isinstance(value, str):
            try:
                numeric_value: float = float(value.strip())
            except ValueError:
                normalized[field_name] = None
                continue

            if numeric_value <= 0:
                normalized[field_name] = None
            elif field_name in {
                "times_per_day",
                "number_of_days",
            }:
                normalized[field_name] = int(numeric_value)
            else:
                normalized[field_name] = numeric_value
            continue

        normalized[field_name] = None

    timing_value: object = normalized.get("timing")
    timing_payload: dict[str, object]

    if isinstance(timing_value, dict):
        timing_payload = timing_value
    else:
        timing_payload = {}

    allowed_timing_fields: set[str] = {
        "waking",
        "morning",
        "noon",
        "evening",
        "bedtime",
        "original_text",
    }

    normalized_timing: dict[str, object] = {
        key: value
        for key, value in timing_payload.items()
        if key in allowed_timing_fields
    }

    for field_name in (
        "waking",
        "morning",
        "noon",
        "evening",
        "bedtime",
    ):
        value = normalized_timing.get(field_name)

        if isinstance(value, bool) or value is None:
            normalized_timing[field_name] = value
        else:
            normalized_timing[field_name] = None

    original_text_value: object = normalized_timing.get(
        "original_text"
    )

    if isinstance(original_text_value, str):
        stripped_original_text: str = (
            original_text_value.strip()
        )
        normalized_timing["original_text"] = (
            stripped_original_text
            if stripped_original_text
            else None
        )
    else:
        normalized_timing["original_text"] = None

    normalized["timing"] = normalized_timing

    review_value: object = normalized.get(
        "requires_user_review"
    )
    normalized["requires_user_review"] = (
        review_value
        if isinstance(review_value, bool)
        else True
    )

    return normalized


def structure_ocr_text_with_gemini(
    raw_text: str,
) -> GeminiStructuredOcrResponse:
    """OCR文字列をGemini Structured Outputで項目別JSONへ整理する。"""

    api_key: str = settings.gemini_api_key.strip()
    model_name: str = settings.gemini_model.strip()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "MISSING_GEMINI_API_KEY",
                "message": "GEMINI_API_KEYを.envに設定してください。",
            },
        )

    if not model_name:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "MISSING_GEMINI_MODEL",
                "message": "GEMINI_MODELが設定されていません。",
            },
        )

    normalized_text: str = raw_text.strip()

    if not normalized_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "EMPTY_OCR_TEXT",
                "message": "Geminiへ渡すOCR文字列が空です。",
            },
        )

    was_truncated: bool = (
        len(normalized_text) > GEMINI_MAX_OCR_CHARACTERS
    )
    limited_text: str = normalized_text[
        :GEMINI_MAX_OCR_CHARACTERS
    ]

    prompt: str = (
        "以下はGoogle Cloud Visionが抽出したOCR文字列です。\n"
        "入力文字列に存在する情報だけを使用し、"
        "指定されたJSONスキーマへ整理してください。\n\n"
        "----- OCR TEXT START -----\n"
        f"{limited_text}\n"
        "----- OCR TEXT END -----"
    )

    client = genai.Client(api_key=api_key)

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0,
                response_mime_type="application/json",
                response_json_schema=(
                    GeminiStructuredOcrResponse.model_json_schema()
                ),
            ),
        )

        response_text: str = response.text or ""

        if not response_text.strip():
            raise ValueError(
                "GeminiからJSONが返されませんでした。"
            )

        try:
            raw_payload: object = json.loads(response_text)
        except json.JSONDecodeError as error:
            raise ValueError(
                "Geminiの応答をJSONとして解析できませんでした。"
            ) from error

        normalized_payload: dict[str, object] = (
            _normalize_gemini_payload(
                raw_payload
            )
        )

        structured_result = (
            GeminiStructuredOcrResponse.model_validate(
                normalized_payload
            )
        )

        update_values: dict[str, object] = {}

        if len(
            structured_result.medicine_name_candidates
        ) > 1:
            update_values["medicine_name"] = None
            update_values["requires_user_review"] = True

        if structured_result.medicine_name is None:
            update_values["requires_user_review"] = True

        if structured_result.warnings:
            update_values["requires_user_review"] = True

        if structured_result.unclassified_text:
            update_values["requires_user_review"] = True

        if was_truncated:
            update_values["warnings"] = [
                *structured_result.warnings,
                (
                    "OCR文字列が上限を超えたため、"
                    "先頭部分だけを構造化しました。"
                ),
            ]
            update_values["requires_user_review"] = True

        if update_values:
            structured_result = structured_result.model_copy(
                update=update_values
            )

        return structured_result

    except ValidationError as error:
        if settings.app_env == "development":
            print(
                "Gemini validation errors:",
                error.errors(),
            )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "code": "INVALID_GEMINI_STRUCTURE",
                "message": (
                    "GeminiのJSONが定義した形式と"
                    "一致しませんでした。"
                ),
                "validation_errors": (
                    error.errors()
                    if settings.app_env == "development"
                    else []
                ),
            },
        ) from error
    except HTTPException:
        raise
    

@router.post(
    "/upload",
    response_model=ImageUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="OCR対象画像をアップロードしてテキスト抽出を実行する",
)
async def upload_ocr_image(
    image: Annotated[
        UploadFile,
        File(description="OCR対象のJPEG・PNG・WebP画像"),
    ],
) -> ImageUploadResponse:
    """画像を受信・検証し、Google Cloud Vision OCRを実行する。"""

    declared_content_type: str = image.content_type or ""

    if declared_content_type not in SUPPORTED_CONTENT_TYPES:
        await image.close()

        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail={
                "code": "UNSUPPORTED_IMAGE_TYPE",
                "message": (
                    "JPEG、PNG、WebP形式の"
                    "画像を指定してください。"
                ),
            },
        )

    try:
        image_data: bytes = await image.read(
            MAX_IMAGE_SIZE_BYTES + 1
        )
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
                "message": (
                    "画像ファイルは10MB以下に"
                    "してください。"
                ),
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
                "message": (
                    "有効な画像データを"
                    "確認できませんでした。"
                ),
            },
        )

    if detected_content_type != declared_content_type:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail={
                "code": "IMAGE_TYPE_MISMATCH",
                "message": (
                    "申告された画像形式と"
                    "実際の画像形式が一致しません。"
                ),
            },
        )

    processed_image_data: bytes = preprocess_image_for_ocr(
        image_data
    )

    extracted_text: str = request_cloud_vision_ocr(
        processed_image_data
    )

    if not extracted_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "TEXT_NOT_DETECTED",
                "message": (
                    "画像から文字を検出できませんでした。"
                    "文字が鮮明に写るように"
                    "撮影し直してください。"
                ),
            },
        )

    structured_data: GeminiStructuredOcrResponse = (
        structure_ocr_text_with_gemini(
            extracted_text
        )
    )

    if settings.app_env == "development":
        print("========== OCR RESULT ==========")
        print("元画像バイト数:", len(image_data))
        print(
            "前処理後バイト数:",
            len(processed_image_data),
        )
        print("OCR文字数:", len(extracted_text))
        print(
            "Gemini構造化結果:",
            structured_data.model_dump(),
        )
        print("================================")

    original_filename: str = (
        image.filename or "uploaded-image"
    )

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
        message=(
            "OCR and Gemini structuring completed successfully"
        ),
        ocr_result=OcrResultResponse(
            raw_text=extracted_text,
            page_count=0,
            block_count=0,
            paragraph_count=0,
            word_count=0,
            average_confidence=None,
            detected_languages=[],
            has_text=True,
            quality_status="review_required",
            structured_data=structured_data,
        ),
    )