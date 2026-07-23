from sqlalchemy import text

from database import engine


def test_database_connection() -> None:
    with engine.connect() as connection:
        result = connection.execute(
            text(
                """
                SELECT
                    DATABASE() AS database_name,
                    CURRENT_USER() AS authenticated_user,
                    @@port AS port
                """
            )
        ).mappings().one()

    assert result["database_name"] == "okusuri_translation_db"
    assert result["authenticated_user"] == "okusuri_app@localhost"
    assert result["port"] == 3306