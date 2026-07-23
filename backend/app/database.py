"""SQLiteデータベース接続とSQLAlchemyセッションを管理する。"""

from collections.abc import Generator

from sqlalchemy import Engine, create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings


class Base(DeclarativeBase):
    """すべてのSQLAlchemy ORMモデルが継承する基底クラス。"""


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
    """SQLiteファイルと定義済みテーブルを作成する。

    現段階ではORMモデルが未定義のため、SQLiteファイルの作成と
    接続基盤の初期化が主な役割となる。
    """
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
    """SQLiteへ接続可能かを真偽値で返す。

    Step 6のヘルスチェックAPIから利用する想定。

    Returns:
        bool: 接続確認に成功した場合はTrue、失敗した場合はFalse。
    """
    try:
        verify_database_connection()
    except SQLAlchemyError:
        return False

    return True