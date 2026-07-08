# Branch_memo

| ブランチ名 | 対象レイヤー | 担当する具体的な作業内容 |
| --- | --- | --- |
| feature/ui-auth-registration | フロントエンド | ①ユーザー登録画面（UserRegistration）の実装。メールアドレス・パスワード入力による新規登録、およびGoogleアカウント登録（OAuth連携）ボタンの配置とステート管理。 |
| feature/ui-auth-password-setup | フロントエンド | ②パスワード追加設定画面（PasswordSetup）の実装。仮登録成功後に自動遷移し、Googleから取得したemailを読み取り専用（Disabled）で自動入力、右側に可視化トグルボタンとアイコンを備えたパスワード入力フォームを配置。 |
| feature/ui-auth-login | フロントエンド | ③ログイン画面（UserLogin）の実装。完全に分離された画面として構成し、メールアドレス・パスワード入力、またはGoogleアカウント認証によるサインインUIの構築。認証成功時のセッションJWT保持を制御。 |
| feature/ui-main-mode | フロントエンド | ④モード選択画面の実装。テキスト・音声モードと手話動画モードを選択するUI、嫌悪感・差別感を完全に排除したインターフェース設計。認証成功後の初回遷移時のみ表示。 |
| feature/ui-scan-guidance | フロントエンド | ⑤注意書き画面の実装。明るい場所での撮影指示、枠組みへの合わせ方、お手本動画（GIF）の配置、アクセシビリティ対応。 |
| feature/ui-camera-capture | フロントエンド | ⑥スキャン画面の実装。カメラ機能の起動、薬剤情報提供書を合わせるための「枠組み（オーバーレイ）」のUI表示と撮影制御。 |
| feature/ui-ocr-verification | フロントエンド | ⑦スキャン内容確認画面の実装。上部にスキャン画像、下部に構造化された薬剤名や生テキストを表示し、ユーザーが確認・修正できるUI。 |
| feature/ui-result-text-audio | フロントエンド | ⑧薬の翻訳画面（テキスト・音声モード）の実装。やさしい日本語のテキスト、出典情報表示、Google TTSによる自動読み上げ制御。 |
| feature/ui-result-sign-language | フロントエンド | ⑨薬の翻訳画面（手話動画モード）の実装。画面中央の手話動画プレイヤー、バックアップテキスト、音声の同時出力、および追加の音声質問UI。 |
| feature/api-auth-lifecycle | バックエンド | ⑩2フェーズユーザー登録機能およびデータライフサイクル管理の実装。Google OAuthコールバック、有効期限10分の一時的セットアップトークン（SETUP_JWT_SECRET署名）発行、Argon2idを用いたパスワードハッシュ化UPDATE、および24時間経過した不完全な仮登録レコード（password_hash IS NULL）を毎日自動で一括物理削除するバックグラウンドバッチの構築。 |
| feature/api-ocr-vision | バックエンド | ⑪Google Cloud Vision API連携の実装。撮影画像の受け取り、OCR文字抽出、GeminiによるJSON構造化、および画像データの即時削除ロジック。 |
| feature/api-mcp-pmda | バックエンド | ⑫Model Context Protocol（MCP）の実装。FastMCPを用いたクライアント構築、PMDA（患者向医薬品ガイド等）への接続と公的情報の取得。 |
| feature/api-rag-gemini | バックエンド | ⑬RAG（検索・生成）システムの実装。ChromaDBへのインデックス登録、LangChainを用いた根拠付き検索（ハルシネーション防止）、Gemini Flash 2.5による「やさしい日本語」変換ロジック。PMDA接続失敗時のローカルVector DBフォールバック制御。 |
| feature/api-voice-stt-tts | バックエンド | ⑭音声処理システムの実装。追加質問用のGoogle STT（音声からテキスト）および結果読み上げ用のGoogle TTS（テキストから音声）のエンドポイント構築。 |
| feature/security-policy | バックエンド / 共通 | ⑮セキュリティ、禁止事項検知、およびガードレールの実装。入力値検証、GoogleメールアドレスのAES-256-GCMによる暗号化永続化（MySQL VARBINARY型）、医療ポリシーフィルタ（診断や処方に関する禁止質問の検知・拒否）、およびpassword_hashがNULLの仮登録レコードに対するログイン即時遮断ガードレールロジックの適用。 |