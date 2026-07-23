from sqlalchemy import inspect

from database import engine


EXPECTED_TABLES = {
    "users",
    "registration_setup_tokens",
    "auth_sessions",
    "sign_dictionary",
    "security_audit_logs",
    "schema_migrations",
}


def test_database_tables_exist() -> None:
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())

    assert EXPECTED_TABLES.issubset(tables)


def test_users_columns_exist() -> None:
    inspector = inspect(engine)

    columns = {
        column["name"]
        for column in inspector.get_columns("users")
    }

    expected_columns = {
        "id",
        "google_sub",
        "encrypted_email",
        "email_lookup_hash",
        "email_key_version",
        "password_hash",
        "account_status",
        "interface_mode",
        "password_changed_at",
        "last_login_at",
        "created_at",
        "updated_at",
    }

    assert expected_columns == columns