| ブランチ名 | 大将レイヤー | 担当する具体的な作業内容 | 
| feature/ui-main-mode | フロントエンド | ①初期画面の実装。テキスト・音声モードと手話動画モードを選択するUI、嫌悪感・差別感を完全に排除したインターフェース設計 |
| feature/ui-scan-guidance | フロントエンド | ②注意書き画面の実装。明るい場所での撮影指示、枠組みへの合わせ方、お手本動画（GIF）の配置、アクセシビリティ対応。 |
| feature/ui-camera-capture | フロントエンド | ③スキャン画面の実装。カメラ機能の起動、薬剤情報提供書を合わせるための「枠組み（オーバーレイ）」のUI表示と撮影制御。 | 
| feature/ui-ocr-verification | フロントエンド | ④スキャン内容確認画面の実装。上部にスキャン画像、下部に構造化された薬剤名や生テキストを表示し、ユーザーが確認・修正できるUI。 |
| feature/ui-result-text-audio | フロントエンド | **⑤薬の翻訳画面（テキスト・音声モード）**の実装。やさしい日本語のテキスト、出典情報表示、Google TTSによる自動読み上げ制御。 | 
| feature/ui-result-sign-language | フロントエンド | **⑥薬の翻訳画面（手話動画モード）**の実装。画面中央の手話動画プレイヤー、バックアップテキスト、音声の同時出力、および追加の音声質問UI。 | 
| feature/api-ocr-vision | バックエンド | Google Cloud Vision API連携の実装。撮影画像の受け取り、OCR文字抽出、GeminiによるJSON構造化、および画像データの即時削除ロジック。 | 
| feature/api-mcp-pmda | バックエンド | **Model Context Protocol（MCP）**の実装。FastMCPを用いたクライアント構築、PMDA（患者向医薬品ガイド等）への接続と公的情報の取得。 |  
| feature/api-rag-gemini | バックエンド | RAG（検索・生成）システムの実装。ChromaDBへのインデックス登録、LangChainを用いた根拠付き検索（ハルシネーション防止）、Gemini Flash 2.5による「やさしい日本語」変換ロジック。 | 
| feature/api-voice-stt-tts | バックエンド | 音声処理システムの実装。追加質問用のGoogle STT（音声からテキスト）および結果読み上げ用のGoogle TTS（テキストから音声）のエンドポイント構築。 | 
| feature/security-policy | バックエンド / 共通 | セキュリティと禁止事項検知の実装。入力値検証、データの暗号化、医療ポリシーフィルタ（診断や処方に関する禁止質問の検知・拒否）。 | 