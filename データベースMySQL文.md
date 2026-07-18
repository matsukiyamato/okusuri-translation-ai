-- ============================================================
-- お薬翻訳AI
-- MySQL本番想定データベース 初期構築SQL
--
-- 対象:
--   MySQL 8.0以降
--
-- 重要:
--   既存の okusuri_translation_db を削除して再作成します。
--   既存データはすべて削除されます。
-- ============================================================


-- ------------------------------------------------------------
-- 0. MySQLバージョン・設定確認
-- ------------------------------------------------------------

SELECT VERSION() AS mysql_version;
SELECT @@sql_mode AS sql_mode;
SELECT @@time_zone AS mysql_time_zone;


-- ------------------------------------------------------------
-- 1. 既存データベース削除
-- ------------------------------------------------------------

DROP DATABASE IF EXISTS okusuri_translation_db;


-- ------------------------------------------------------------
-- 2. データベース作成
-- ------------------------------------------------------------

CREATE DATABASE okusuri_translation_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_bin;

USE okusuri_translation_db;


-- ============================================================
-- 3. usersテーブル
-- ユーザー認証・仮登録状態・UIモードを管理
-- ============================================================

CREATE TABLE users (
    id BINARY(16) NOT NULL
        COMMENT 'UUIDを16バイトで保存する内部ユーザーID',

    google_sub VARCHAR(255)
        CHARACTER SET ascii
        COLLATE ascii_bin
        DEFAULT NULL
        COMMENT 'Google OAuthの一意識別子。通常登録ではNULL',

    encrypted_email VARBINARY(512) NOT NULL
        COMMENT 'AES-256-GCMで暗号化したメールアドレス',

    email_lookup_hash BINARY(32) NOT NULL
        COMMENT 'HMAC-SHA-256で生成するメール検索用ハッシュ',

    email_key_version SMALLINT UNSIGNED NOT NULL DEFAULT 1
        COMMENT 'メール暗号化鍵のバージョン',

    password_hash VARCHAR(255)
        CHARACTER SET ascii
        COLLATE ascii_bin
        DEFAULT NULL
        COMMENT 'Argon2idパスワードハッシュ。仮登録中はNULL',

    account_status ENUM(
        'pending_setup',
        'active',
        'disabled'
    ) NOT NULL DEFAULT 'pending_setup'
        COMMENT 'pending_setup=仮登録、active=有効、disabled=停止',

    interface_mode ENUM(
        'text_audio',
        'sign_language'
    ) DEFAULT NULL
        COMMENT '利用者が選択した出力インターフェース',

    password_changed_at DATETIME(6) DEFAULT NULL
        COMMENT 'パスワードを最後に設定・変更した日時',

    last_login_at DATETIME(6) DEFAULT NULL
        COMMENT '最終ログイン成功日時',

    created_at DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6)
        COMMENT '作成日時。アプリケーション側ではUTC運用',

    updated_at DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6)
        COMMENT '更新日時。アプリケーション側ではUTC運用',

    PRIMARY KEY (id),

    UNIQUE KEY uq_users_google_sub (
        google_sub
    ),

    UNIQUE KEY uq_users_email_lookup_hash (
        email_lookup_hash
    ),

    KEY idx_users_pending_cleanup (
        account_status,
        created_at
    ),

    KEY idx_users_account_status (
        account_status
    ),

    CONSTRAINT chk_users_email_key_version
        CHECK (email_key_version >= 1),

    CONSTRAINT chk_users_auth_identity
        CHECK (
            google_sub IS NOT NULL
            OR password_hash IS NOT NULL
        ),

    CONSTRAINT chk_users_active_password
        CHECK (
            account_status <> 'active'
            OR password_hash IS NOT NULL
        )

) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_bin
  COMMENT = 'ユーザー認証・アカウント状態・UI設定';


-- ============================================================
-- 4. registration_setup_tokensテーブル
-- 10分間のパスワード設定トークンを一度だけ使用させる
-- ============================================================

CREATE TABLE registration_setup_tokens (
    jti BINARY(16) NOT NULL
        COMMENT 'セットアップトークンの一意識別子',

    user_id BINARY(16) NOT NULL
        COMMENT '対象ユーザーID',

    expires_at DATETIME(6) NOT NULL
        COMMENT 'セットアップトークン有効期限',

    used_at DATETIME(6) DEFAULT NULL
        COMMENT '使用済み日時。NULLなら未使用',

    created_at DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6)
        COMMENT 'トークン作成日時',

    PRIMARY KEY (jti),

    KEY idx_registration_setup_user (
        user_id
    ),

    KEY idx_registration_setup_expiry (
        expires_at,
        used_at
    ),

    CONSTRAINT fk_registration_setup_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,

    CONSTRAINT chk_registration_setup_expiry
        CHECK (expires_at > created_at)

) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_bin
  COMMENT = '一時セットアップトークン管理';


-- ============================================================
-- 5. auth_sessionsテーブル
-- リフレッシュトークン・ログアウト・セッション失効管理
-- ============================================================

CREATE TABLE auth_sessions (
    id BINARY(16) NOT NULL
        COMMENT 'セッションUUID',

    user_id BINARY(16) NOT NULL
        COMMENT '対象ユーザーID',

    refresh_token_hash BINARY(32) NOT NULL
        COMMENT 'リフレッシュトークンのSHA-256ハッシュ',

    token_family_id BINARY(16) NOT NULL
        COMMENT 'トークンローテーション単位の識別子',

    issued_at DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6)
        COMMENT '発行日時',

    expires_at DATETIME(6) NOT NULL
        COMMENT '有効期限',

    last_used_at DATETIME(6) DEFAULT NULL
        COMMENT '最終使用日時',

    revoked_at DATETIME(6) DEFAULT NULL
        COMMENT '失効日時。NULLなら有効',

    revoke_reason VARCHAR(100) DEFAULT NULL
        COMMENT 'logout、rotation、securityなどの失効理由',

    created_at DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6)
        COMMENT '作成日時',

    PRIMARY KEY (id),

    UNIQUE KEY uq_auth_sessions_refresh_token_hash (
        refresh_token_hash
    ),

    KEY idx_auth_sessions_user_active (
        user_id,
        revoked_at,
        expires_at
    ),

    KEY idx_auth_sessions_expiry (
        expires_at
    ),

    KEY idx_auth_sessions_family (
        token_family_id
    ),

    CONSTRAINT fk_auth_sessions_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,

    CONSTRAINT chk_auth_sessions_expiry
        CHECK (expires_at > issued_at)

) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_bin
  COMMENT = 'ログインセッションとリフレッシュトークン管理';


-- ============================================================
-- 6. sign_dictionaryテーブル
-- 手話単語動画・指文字動画のメタデータを管理
-- ============================================================

CREATE TABLE sign_dictionary (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT
        COMMENT '辞書エントリID',

    entry_type ENUM(
        'word',
        'finger_hiragana',
        'finger_katakana',
        'number',
        'symbol'
    ) NOT NULL
        COMMENT '単語手話・指文字・数字・記号の種別',

    surface_text VARCHAR(100) NOT NULL
        COMMENT '画面表示用の単語または文字',

    normalized_key VARCHAR(100) NOT NULL
        COMMENT 'バックエンド検索用に正規化したキー',

    video_object_key VARCHAR(512) NOT NULL
        COMMENT 'オブジェクトストレージ内の動画識別子',

    subtitle_text VARCHAR(500) DEFAULT NULL
        COMMENT '字幕・バックアップ表示用テキスト',

    locale VARCHAR(16)
        CHARACTER SET ascii
        COLLATE ascii_bin
        NOT NULL DEFAULT 'ja-JP'
        COMMENT 'BCP 47形式の言語コード',

    content_sha256 BINARY(32) DEFAULT NULL
        COMMENT '動画ファイルのSHA-256ハッシュ',

    rights_status ENUM(
        'self_created',
        'permission_confirmed',
        'public_license'
    ) NOT NULL
        COMMENT '自作・許諾済み・公開ライセンスの区分',

    rights_holder VARCHAR(255) DEFAULT NULL
        COMMENT '動画制作者または権利者',

    source_url VARCHAR(1024) DEFAULT NULL
        COMMENT '外部素材の出典URL',

    license_note VARCHAR(1000) DEFAULT NULL
        COMMENT '利用条件や許諾内容',

    license_expires_at DATETIME(6) DEFAULT NULL
        COMMENT '利用許諾期限',

    publication_status ENUM(
        'draft',
        'published',
        'suspended'
    ) NOT NULL DEFAULT 'draft'
        COMMENT '下書き・公開・停止の状態',

    version_no INT UNSIGNED NOT NULL DEFAULT 1
        COMMENT '辞書エントリのバージョン番号',

    created_at DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6)
        COMMENT '作成日時',

    updated_at DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6)
        COMMENT '更新日時',

    PRIMARY KEY (id),

    UNIQUE KEY uq_sign_dictionary_entry (
        entry_type,
        normalized_key,
        locale,
        version_no
    ),

    UNIQUE KEY uq_sign_dictionary_object_key (
        video_object_key
    ),

    KEY idx_sign_dictionary_lookup (
        normalized_key,
        locale,
        publication_status
    ),

    KEY idx_sign_dictionary_type_status (
        entry_type,
        publication_status
    ),

    KEY idx_sign_dictionary_license_expiry (
        license_expires_at
    ),

    CONSTRAINT chk_sign_dictionary_version
        CHECK (version_no >= 1),

    CONSTRAINT chk_sign_dictionary_rights
        CHECK (
            rights_status = 'self_created'
            OR rights_holder IS NOT NULL
            OR source_url IS NOT NULL
        )

) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_bin
  COMMENT = '手話単語・指文字動画辞書';


-- ============================================================
-- 7. security_audit_logsテーブル
-- 認証・設定変更・アクセス遮断などの監査ログ
-- ============================================================

CREATE TABLE security_audit_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT
        COMMENT '監査ログID',

    event_id BINARY(16) NOT NULL
        COMMENT '監査イベントUUID',

    actor_user_id BINARY(16) DEFAULT NULL
        COMMENT '操作ユーザー。未認証イベントはNULL',

    event_type VARCHAR(64)
        CHARACTER SET ascii
        COLLATE ascii_bin
        NOT NULL
        COMMENT 'LOGIN_SUCCESS、LOGIN_FAILUREなど',

    event_result ENUM(
        'success',
        'failure',
        'blocked'
    ) NOT NULL
        COMMENT '実行結果',

    request_id BINARY(16) DEFAULT NULL
        COMMENT 'APIリクエスト追跡用UUID',

    ip_lookup_hash BINARY(32) DEFAULT NULL
        COMMENT 'IPアドレスをHMAC-SHA-256化した値',

    user_agent_hash BINARY(32) DEFAULT NULL
        COMMENT 'User-Agentのハッシュ値',

    target_type VARCHAR(64)
        CHARACTER SET ascii
        COLLATE ascii_bin
        DEFAULT NULL
        COMMENT '操作対象の種類',

    target_reference VARCHAR(128)
        CHARACTER SET ascii
        COLLATE ascii_bin
        DEFAULT NULL
        COMMENT '個人情報を含まない対象参照値',

    metadata_json JSON DEFAULT NULL
        COMMENT '機密情報を含まない補助情報',

    created_at DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6)
        COMMENT '監査イベント発生日時',

    PRIMARY KEY (id),

    UNIQUE KEY uq_security_audit_event_id (
        event_id
    ),

    KEY idx_security_audit_created (
        created_at
    ),

    KEY idx_security_audit_user_created (
        actor_user_id,
        created_at
    ),

    KEY idx_security_audit_event_created (
        event_type,
        created_at
    ),

    KEY idx_security_audit_result_created (
        event_result,
        created_at
    ),

    CONSTRAINT fk_security_audit_actor
        FOREIGN KEY (actor_user_id)
        REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE RESTRICT

) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_bin
  COMMENT = 'セキュリティ監査ログ';


-- ============================================================
-- 8. schema_migrationsテーブル
-- Alembic等でデータベース変更履歴を管理
-- ============================================================

CREATE TABLE schema_migrations (
    version VARCHAR(64)
        CHARACTER SET ascii
        COLLATE ascii_bin
        NOT NULL
        COMMENT 'マイグレーション識別子',

    description VARCHAR(255) NOT NULL
        COMMENT '変更内容',

    checksum CHAR(64)
        CHARACTER SET ascii
        COLLATE ascii_bin
        NOT NULL
        COMMENT 'マイグレーションファイルのSHA-256',

    applied_at DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6)
        COMMENT '適用日時',

    PRIMARY KEY (version),

    UNIQUE KEY uq_schema_migrations_checksum (
        checksum
    )

) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_bin
  COMMENT = 'データベーススキーマ変更履歴';


-- ============================================================
-- 9. 初期マイグレーション情報
--
-- 現段階では仮の固定値を使用する。
-- Alembic導入時はAlembicの管理テーブルへ移行する。
-- ============================================================

INSERT INTO schema_migrations (
    version,
    description,
    checksum
)
VALUES (
    '20260715_001',
    'Initial production database schema',
    SHA2(
        'okusuri_translation_db_20260715_001',
        256
    )
);


-- ============================================================
-- 10. 作成確認
-- ============================================================

SELECT DATABASE() AS current_database;

SHOW TABLES;

SHOW CREATE TABLE users;
SHOW CREATE TABLE registration_setup_tokens;
SHOW CREATE TABLE auth_sessions;
SHOW CREATE TABLE sign_dictionary;
SHOW CREATE TABLE security_audit_logs;
SHOW CREATE TABLE schema_migrations;