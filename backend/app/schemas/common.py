from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

class HealthCheckResponse(BaseModel):
    """APIとSQLiteの稼働状態。"""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
    )

    status: Literal["ok", "degraded"]
    api: Literal["available"]
    database: Literal["available", "unavailable"]
    environment: str
    version: str

class MedicationTimingResponse(BaseModel):
    """OCR文字列に明記された服用タイミング。"""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
    )

    waking: bool | None = Field(
        default=None,
        description=(
            "起床時と明記されていればtrue。"
            "明記がなければnull。"
        ),
    )

    morning: bool | None = Field(
        default=None,
        description=(
            "朝と明記されていればtrue。"
            "明記がなければnull。"
        ),
    )

    noon: bool | None = Field(
        default=None,
        description=(
            "昼と明記されていればtrue。"
            "明記がなければnull。"
        ),
    )

    evening: bool | None = Field(
        default=None,
        description=(
            "夕または夕方と明記されていればtrue。"
            "明記がなければnull。"
        ),
    )

    bedtime: bool | None = Field(
        default=None,
        description=(
            "寝る前または就寝前と明記されていればtrue。"
            "明記がなければnull。"
        ),
    )

    original_text: str | None = Field(
        default=None,
        description=(
            "服用タイミングに該当するOCR原文。"
            "記載がなければnull。"
        ),
    )

class GeminiStructuredOcrResponse(BaseModel):
    """GeminiがOCR文字列を項目別に整理した結果。"""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
    )

    medicine_name: str | None = Field(
        default=None,
        description=(
            "OCR文字列から一意に特定できる名称。"
            "複数候補または不明な場合はnull。"
        ),
    )

    medicine_name_candidates: list[str] = Field(
        default_factory=list,
        description=(
            "名称に複数候補がある場合の候補一覧。"
            "候補がなければ空配列。"
        ),
    )

    timing: MedicationTimingResponse = Field(
        default_factory=MedicationTimingResponse,
        description=(
            "OCR文字列に明記された服用タイミング。"
        ),
    )

    times_per_day: int | None = Field(
        default=None,
        ge=1,
        description=(
            "1日の回数が明記されている場合だけ数値化する。"
            "不明な場合はnull。"
        ),
    )

    tablets_per_dose: float | None = Field(
        default=None,
        gt=0,
        description=(
            "1回の錠数が明記されている場合だけ数値化する。"
            "錠数ではない場合や不明な場合はnull。"
        ),
    )

    number_of_days: int | None = Field(
        default=None,
        ge=1,
        description=(
            "日数が明記されている場合だけ数値化する。"
            "不明な場合はnull。"
        ),
    )

    dosage_original_text: str | None = Field(
        default=None,
        description=(
            "回数、錠数、日数などに該当するOCR原文。"
            "内容の補完や換算は行わない。"
        ),
    )

    medicine_information: list[str] = Field(
        default_factory=list,
        description=(
            "薬のはたらきとして明記されたOCR原文。"
        ),
    )

    precautions: list[str] = Field(
        default_factory=list,
        description=(
            "注意事項として明記されたOCR原文。"
        ),
    )

    interactions: list[str] = Field(
        default_factory=list,
        description=(
            "相互作用として明記されたOCR原文。"
        ),
    )

    side_effects: list[str] = Field(
        default_factory=list,
        description=(
            "副作用として明記されたOCR原文。"
        ),
    )

    unclassified_text: list[str] = Field(
        default_factory=list,
        description=(
            "文脈が不明または分類できないOCR文字列。"
        ),
    )

    warnings: list[str] = Field(
        default_factory=list,
        description=(
            "欠落、矛盾、OCR誤認識の可能性など、"
            "利用者が確認すべき点。"
        ),
    )

    requires_user_review: bool = Field(
        default=True,
        description=(
            "1項目でも確認が必要な場合はtrue。"
        ),
    )


class OcrResultResponse(BaseModel):
    """Google Cloud Vision OCRの解析結果。"""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
    )

    raw_text: str
    page_count: int = Field(ge=0)
    block_count: int = Field(ge=0)
    paragraph_count: int = Field(ge=0)
    word_count: int = Field(ge=0)
    average_confidence: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
    )
    detected_languages: list[str]
    has_text: bool
    quality_status: Literal[
        "good",
        "review_required",
        "text_not_detected",
    ]

    structured_data: GeminiStructuredOcrResponse | None = None

class ImageUploadResponse(BaseModel):
    """画像アップロードおよびOCR結果。"""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
    )

    status: Literal["accepted"]
    upload_id: str
    filename: str
    content_type: Literal[
        "image/jpeg",
        "image/png",
        "image/webp",
    ]
    size_bytes: int
    message: str
    ocr_result: OcrResultResponse