"""MySQL接続確認用スクリプト。"""

from __future__ import annotations

import traceback

from database import check_database_connection


def main() -> None:
    """MySQL接続テストを実行する。"""
    try:
        result = check_database_connection()

    except Exception as exc:
        print("MySQL接続失敗")
        print(f"例外の種類: {type(exc).__name__}")
        print(f"例外メッセージ: {exc}")

        if exc.__cause__ is not None:
            print(
                "元の例外の種類:",
                type(exc.__cause__).__name__,
            )
            print(
                "元の例外メッセージ:",
                exc.__cause__,
            )

        print("\n--- 詳細トレースバック ---")
        traceback.print_exc()
        return

    print("MySQL接続成功")
    print(f"connection_ok: {result['connection_ok']}")
    print(f"database_name: {result['database_name']}")
    print(f"mysql_version: {result['mysql_version']}")


if __name__ == "__main__":
    main()