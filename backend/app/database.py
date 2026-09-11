"""SQLiteデータベース接続とSQLAlchemyセッションを管理する。"""

from collections.abc import Generator
from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    DateTime,
    Engine,
    Float,
    Integer,
    String,
    Text,
    create_engine,
    text,
)
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    Session,
    mapped_column,
    sessionmaker,
)

from app.config import settings


class Base(DeclarativeBase):
    """すべてのSQLAlchemy ORMモデルが継承する基底クラス。"""


class OcrCorrection(Base):
    """利用者が確認・修正したOCR結果を保存するORMモデル。"""

    __tablename__ = "ocr_corrections"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    upload_id: Mapped[str] = mapped_column(
        String(36),
        nullable=False,
        unique=True,
        index=True,
    )

    raw_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    medicine_name: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    timing_original_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    times_per_day: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    tablets_per_dose: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    number_of_days: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    dosage_original_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    medicine_information: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
    )

    precautions: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
    )

    interactions: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
    )

    side_effects: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
    )

    unclassified_text: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


engine: Engine = create_engine(
    settings.sqlite_database_url,
    pool_pre_ping=True,
)


SessionLocal: sessionmaker[Session] = sessionmaker(
    bind=engine,
    class_=Session,
    autoflush=False,
    expire_on_commit=False,
)


def verify_database_connection() -> None:
    """SQLiteへ接続し、SQLを実行できることを確認する。

    Raises:
        SQLAlchemyError: SQLiteへの接続またはSQL実行に失敗した場合。
    """
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))


def create_database() -> None:
    """SQLiteファイルと定義済みORMテーブルを作成する。"""

    verify_database_connection()
    Base.metadata.create_all(bind=engine)


def get_session() -> Generator[Session, None, None]:
    """API処理で使用するSQLAlchemy Sessionを提供する。

    Yields:
        Session: リクエスト単位で使用するDBセッション。
    """
    database_session: Session = SessionLocal()

    try:
        yield database_session
    finally:
        database_session.close()


def dispose_database() -> None:
    """アプリケーション終了時にEngineの接続資源を解放する。"""
    engine.dispose()


def is_database_available() -> bool:
    """SQLiteへ接続可能かを真偽値で返す。"""

    try:
        verify_database_connection()
    except SQLAlchemyError:
        return False

    return True