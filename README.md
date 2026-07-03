# お薬翻訳AI (okusuri-translation-ai)

医療情報（薬剤説明書、添付文書、患者向医薬品ガイド等）を、高齢者・外国人・聴覚障害者・手話利用者など、あらゆる利用者が等しく理解しやすい形式（やさしい日本語・音声・字幕付き手話動画）へ変換して提供する、医療情報アクセシビリティ支援システムです。

---
## 1. 解決したい課題と本質的価値
1. **専門用語の障壁**: 薬剤説明書に含まれる難解な専門表現を解消。
2. **信頼性の担保**: 公的医療情報（PMDA）をダイレクトに参照し、AIのハルシネーション（嘘）を完全に排除。
3. **情報アクセシビリティの格差**: 音声中心の服薬指導から排除されがちな聴覚障害者・手話利用者に対し、字幕付き手話動画によるファーストクラスのUIを提供。
4. **属性差別の排除**: ユーザーに「障害の有無」を答えさせるのではなく、「どの出力形式（インターフェース）」を希望するかを選択させることで、嫌悪感や差別感を完全に排除したUI設計を徹底。
---
## 2. ⚠️ 遵守原則・免責事項（医療ポリシーフィルタ）
本プロダクトは、厚生労働省の「医療機器プログラム（SaMD）」に該当しない、医療情報の理解支援を目的とした非医療機器システムです。
- **診断、治療、処方、服薬判断、投薬判断などの医療行為および医療助言は一切行いません。**
- 医療従事者の判断を代替するものではありません。
- システム内には、診断・処方に関する特定の禁止質問を検知し、安全に拒否する「医療ポリシーフィルタ」をバックエンド（`utils/security.py`）に独自実装しています。
---
## 3. 画面構成（全6画面）
本アプリは、以下の画面構成で設計・実装されています。
1. **ユーザー登録画面（UserRegistration）**：メールアドレス・パスワード入力による新規登録、およびGoogleアカウント登録ボタンの配置。
2. **パスワード追加設定画面（PasswordSetup）**：仮登録成功後に自動遷移する画面。Googleから取得したメールアドレスを読み取り専用（Disabled）で自動入力し、右側に可視化トグルボタンとアイコンを備えたパスワード入力フォームを配置。
3. **ログイン画面（UserLogin）**：メールアドレス・パスワード入力、またはGoogleアカウント認証によるサインイン。
4. **モード選択画面（MainModeSelection）**：認証成功後の初回遷移時のみ表示。ラジオボタン形式でのインターフェース（テキスト・音声モード / 手話動画モード）選択およびDB保存トリガー。
5. **注意書き画面 (ScanGuidance)**: 撮影のコツ・お手本動画（GIF）の提示
6. **スキャン画面 (CameraCapture)**: カメラ起動、薬剤情報提供書を合わせる枠組み（オーバーレイ）表示
7. **スキャン内容確認画面 (OcrVerification)**: OCR抽出された薬剤名・テキストの確認・修正UI
8. **薬の翻訳画面：テキスト・音声 (TextAudioResult)**: やさしい日本語テキスト表示とTTS自動読み上げ
9. **薬の翻訳画面：手話動画 (SignLanguageResult)**: 手話動画ストリーミング再生と音声双方向質問UI
---
## 4. システムアーキテクチャ & データフロー

### ① 認証・モード選択フロー
```text
[① ユーザー登録フェーズ]
ユーザー登録画面で「Googleで新規登録」を実行
  ➔ バックエンド：Google OAuthコールバックを受け取り、検証された google_sub（一意のID）と email を取得
  ➔ バックエンド：仮登録として users テーブルに google_sub と暗号化した email を INSERT。この段階では password_hash は 一時的に NULL または「セットアップ中ステート」としてレコードを作成。

[② パスワード追加設定フェーズ（画面の自動遷移）]
仮登録成功 ➔ バックエンドからフロントエンドへ一時的なセットアップトークン（専用の秘密鍵 SETUP_JWT_SECRET で署名、有効期限10分、スコープは本登録限定）を返却
  ➔ フロントエンド：画面を自動的に「パスワード設定フォーム」へ遷移させる
  ➔ フロントエンド：Googleから取得した email（Gmailアドレス）をフォームへ読み取り専用（Disabled）として自動入力（初期値化）
  ➔ ユーザー：「パスワード」と「確認用パスワード」（右側に可視化トグルボタンとアイコン付き）を入力
  ➔ フロントエンド：入力値の一致検証後、バックエンドへセキュアに送信
  ➔ バックエンド：Argon2idアルゴリズムを使用して password_hash へ変換し、対象ユーザーのレコードを UPDATE。本登録が完了。

[③ ログイン〜モード選択画面フェーズ]
本登録完了 ➔ ユーザーは完全に分離された「ログイン画面」へ明示的にリダイレクト
  ➔ ユーザー：ログイン情報（メールアドレス・パスワード）を入力
  ➔ バックエンド：MySQLの password_hash と入力されたパスワードを検証（認証）。
     ⚠️ガードレールロジック：password_hash が NULL の仮登録レコードは、このローカル認証ログイン（/api/v1/auth/login）において明示的に認証を遮断し、ログインを完全拒否する。
  ➔ バックエンド：認証成功後、正規のセッションJWTを発行してフロントエンドに返却
  ➔ フロントエンド：このJWTを保持した状態で、初めて「モード選択画面」へ遷移。ラジオボタンでUIを選択し、エンドポイントへ送信してusersテーブルの interface_mode を UPDATE。
```

### ② 薬剤識別・情報解析フロー（OCR ➔ RAG）
```text
アプリ起動 ➔ ユーザー認証・トークン検証 ➔薬剤情報提供書の撮影 ➔ [Google Cloud Vision API] 文字抽出
  ➔ [Gemini Flash 2.5] JSON構造化（※撮影画像はサーバー上で処理後、即時完全削除）
  ➔ [FastMCP Client] ➔ [MCP Server] ➔ PMDA（患者向医薬品ガイド等）から公的情報を動的取得
  ➔ [LangChain + ChromaDB] 知識基盤と照合（ハルシネーション防止）
  ➔ [Gemini Flash 2.5] ファクトに基づいた「やさしい日本語」変換
  ➔ 出典情報の付与 ➔ アプリ画面へ表示
```

### ③ 情報検索フロー（双方向音声対話）
```text
ユーザーからの音声質問 ➔ [Google Speech-to-Text] テキスト化
  ➔ [Gemini Flash 2.5] 質問意図の解析（※医療ポリシーフィルタによる禁止質問の検証）
  ➔ [MCP Server] ➔ PMDA ➔ [RAG] 根拠付き回答生成 ➔ 出典情報の付与
  ➔ [Google Text-to-Speech] 音声生成 ➔ アプリ側で回答表示 ＆ 音声読み上げ（手話動画再生）

⚠️注意：手話動画再生に関しては自作と自作で動画編集を行う。または、公式の物で使用が許可されている物があればそれを使用する。
ただし、公式の物を使用する際には、法令順守や利用規約、肖像権に最大限の配慮または、規約次第ではそれの使用を行わない。
```

### ④ 処理フロー

1. **ユーザー認証と動的画面分岐**：

  アプリ起動時はJWTに紐づく interface_mode をMySQLから照合。初回登録直後はNULL判定となりモード選択画面（画面③）を表示。決定後は該当するインターフェース（画面⑦または画面⑧）を動的に出し分け（全8画面のステート復元時）。
  以降、アプリ起動時（全8画面のステート復元時）は、このJWTに紐づく interface_mode をMySQLから照合し、該当するインターフェース（画面⑦または画面⑧）を動的に出し分けます。

2. **スキャン & OCR**:

   ユーザーが撮影した「薬剤情報提供書」から Google Cloud Vision API で文字を抽出 ➔ Gemini Flash 2.5 で構造化データ（JSON）へパース。
   * **プライバシー保護**: 個人情報保護のため、サーバーに送信された撮影画像データは処理完了直後に**即時完全削除**。

3. **公的医療情報の動的取得 (MCP)**:

   最新の **Model Context Protocol (MCP)** を採用。`FastMCP` を用いた自社製MCPクライアントを介し、PMDA（患者向医薬品ガイド）の外部公的データベースから、当該薬剤の正確な公式ドキュメントをリアルタイムに引き当て。

4. **RAG (根拠付き生成)**:

   LangChain と ChromaDB を用いたRAG構成。抽出テキストとMCPから得た公的医療情報を知識基盤として照合。Gemini Flash 2.5 により、事実（ファクト）に基づいた「やさしい日本語」へのコンテキスト変換を実行。

5. **マルチモーダル出力**:

   - **テキスト・音声モード**: Google Text-to-Speech (TTS) による自動読み上げ。
   - **手話動画モード**: 変換されたテキストに基づき、手話辞書データベースから該当する手話動画（音声・字幕付き）を中央プレイヤーにストリーミング。

---

## 5. ① 技術スタック&選定根拠
**Frontend** 
- **・React Native(Expo SDK 56) / Type Script：**
　　Android、およびEAS (Expo Application Services) による運用の最適化。高齢者・難聴者向けの文字サイズ可変対応を満たすため、基底レイヤーから AccessibleText / AccessibleButton (48x48dp以上のタップ領域保証) を共通コンポーネント化。
---
**Backend**

 - **・FastAPI(Python 3.11) / Uvicorn: Pydantic**による**厳格な型定義**と、非同期処理（Async/Await）による高速なAPI応答。

 - **・Model Context Protocol (MCP):** 医療情報という「常に最新かつ正確でなければならないデータ」をLLMの内部知識に頼らず、外部データソースとセキュアに連携させるための次世代プロトコル。

 - **Google Gemini Flash 2.5:** 低遅延・高コンテキストであり、医療テキストの構造化（JSON Mode）および「やさしい日本語」への変換タスクにおいて費用対効果とレスポンス速度のバランスが最も優れているため採用。

 - **AI / LLM**: Google Gemini Flash 2.5 API
 - **Protocol**: Model Context Protocol (MCP) via FastMCP
 - **Vector DB / RAG**: Chroma DB / LangChain
 - **External API**: Google Cloud Vision (OCR), Speech-to-Text, Text-to-Speech
---
**Database**

 - **MySQL**： 認証情報および個別設定データ（UI選択モード）をセキュアに永続化するため採用。Googleログインと通常ログインを統合管理。
---

## 5.1 システムアーキテクチャ（設計）

 - 1. **認証・認可層**：local / googleの認証プロバイダを統合し、JWT発行によるセッション維持とステート管理

 - 2. **OCR層**: 撮影した薬剤情報提供書からVision APIでテキスト抽出、GeminiでJSON構造化（画像は即時破棄）

 - 3. **公的医療情報連携層**: MCP Serverを介してPMDA（患者向医薬品ガイド等）から公的情報を取得

 - 4. **RAG / 変換層**: ChromaDBの知識基盤と照合し、ハルシネーションを防止しながら「やさしい日本語」へ変換

 - 5. **インターフェース層**: ユーザーの希望に応じ、テキスト・音声出力、または手話動画（音声・字幕付き）で出力

---

## 5.2 データベーススキーマ（認証・認可拡張版）
　Googleログイン（OAuth）と通常の「メール/パスワード」を共存させ、認証後にモード選択データを安全に更新・照合するための構造です。セキュリティ要件（S-03）と個人情報保護（D-02）を厳格に満たします。

- users （ユーザー認証・設定テーブル）
| カラム名 | 型 | 制約 | 説明 | 
| --- | --- | --- | --- |
| id | VARCHAR(36) | PRIMARY KEY | システム内部管理用のUUID |
| google_sub | VARCHAR(255) | UNIQUE NOT NULL | Googleから返される一意の識別子(アイデンティティ確認用キー) | 
| encrypted_email | VARBINARY(255) | UNIQUE NOT NULL | AES-256等で暗号化されたメールアドレス（D-02準拠、Googleから取得） |
| password_hash | VARCHAR(255) | NULL許容 | パスワード追加設定フェーズで保存されるハッシュ化パスワード（Argon2等を使用。仮登録時は一時的にNULL） |
| interface_mode | "ENUM('text_audio', 'sign_language')" | NULL許容 | ユーザー選択のUIモード。初回登録・ログイン直後はNULLとなり、選択画面での決定後に値が保存される | 
| created_at | DATETIME | NOT NULL | アカウント登録日時 | 
| updated_at | DATETIME | NOT NULL | 設定更新日時(モード変更日時) | 

## 5.3 バックエンド（Fast API）エンドポイント設計

**①認証エンドポイント（トークン発行）2フェーズ登録対応**

**Google OAuthコールバック**:
 /api/v1/auth/google/callback (METHOD: GET)

**処理内容**: 
 Google認証完了後、google_sub をキーに照合。新規ユーザーの場合は AES-256-GCM で暗号化した encrypted_email を保存して仮登録レコードをインサート。フロントエンドへ有効期限10分の一時的なセットアップトークン（専用鍵 SETUP_JWT_SECRET で署名）を返却。

**パスワード追加登録**：
 /api/v1/auth/register/setup-password (METHOD: POST)

**処理内容**:セットアップトークンを専用の検証ロジック
（verify_setup_token）でデコード・検証し、入力されたパスワードの一致検証後、Argon2id でハッシュ化して該当するレコードの password_hash を UPDATE（本登録ステートへ移行）。すでに password_hash が存在するレコード（本登録済み）からのリクエストは二重登録防止として即時400エラーで拒否する。

**ローカル認証ログイン**: 
 /api/v1/auth/login (METHOD: POST)

**処理内容**: 
 完全に分離されたログイン画面から送信されたメールアドレス（暗号化してDBと照合）とパスワードを、MySQLの password_hash と検証。

  **ガードレールバリデーション**：
  password_hash が NULL であるユーザー（仮登録状態）のアクセス、および認証失敗時は即時認証を完全遮断する。成功時にセッション維持用のJWT（ログイン用秘密鍵 JWT_SECRET で署名）を発行してフロントエンドに返却。

**②モード保存・照合エンドポイント（認可）**

**パス**：
/api/v1/user/interface-mode (METHOD: PUT)

**リクエストヘッダー**：
Authorization: Bearer <JWT_TOKEN>（S-03準拠）

**リクエストボディ（JSONスキーマ検証必須 - N-11）**:

**json**
```text
{
  "interface_mode": "sign_language"
}
```

**バックエンド処理**：
JWTトークンを検証・デコードし、セキュアに送信されたユーザーの個人ID（id）を抽出します（入力値検証 S-04）。
抽出した id をキーにMySQLの users テーブルに対して UPDATE users SET interface_mode = :interface_mode WHERE id = :id を実行します。

## 6. 出典管理(ファクトチェックの厳格化)

　**ハルシネーションによる健康被害を防ぐため、システムが生成・表示するすべての情報には、以下の固定形式で明確に出典（リファレンス）を付与します。出典が存在しない回答の出力はシステムレベルで禁止しています。**

```text

- 出典名 (例: PMDA 患者向医薬品ガイド)

- 参照元URL

- データの最終更新日

- アプリ側でのシステム参照日時

```

---

## 7. コンプライアンス・利用規約遵守
　本システムの構築にあたり、以下の規約・法律・ガイドラインを厳格に遵守し、データの透明性と法的クレンリネスを担保しています。

```text
- **Google Gemini API Terms of Service / Google AI Studio & Gemini API Documentation

- Google Cloud Service Specific Terms (Generative AI)

- Google Cloud Vision Data Usage Policy（送信された画像がモデルの学習等に無断利用されない仕様の厳守）password_hash

- Google Cloud Speech-to-Text / Text-to-Speech Documentation

- Model Context Protocol Specification

- PMDA 医療用医薬品情報検索データ利用規約

- 厚生労働省 医療機器プログラム（SaMD）に関する各種ガイドライン

```

---

## 8. ディレクトリ構造
```text
okusuri-translation-ai/
├── .gitignore
├── README.md
├── frontend/                  # React Native (Expo) / TypeScript
│   ├── App.tsx
│   ├── app.json
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── components/        # 共通UIコンポーネント（アクセシビリティ配慮）
│       │   ├── AccessibleButton.tsx    # 48x48dp以上の汎用ボタン
│       │   ├── AccessibleText.tsx      # 視認性の高い基本テキスト
│       │   └── AudioController.tsx     # 音声再生・停止ボタン
│       ├── navigation/        # 画面遷移定義
│       │   └── AppNavigator.tsx
│       ├── screens/           # UI実装
│       │   ├── UserRegistrationScreen.tsx  # ①新規ユーザー登録画面（Google OAuthボタン配置）
│       │   ├── PasswordSetupScreen.tsx     # ②パスワード追加設定画面（読み取り専用email、可視化トグル付き）
│       │   ├── UserLoginScreen.tsx         # ③ログイン画面（完全分離されたローカル認証用）
│       │   ├── ModeSelectionScreen.tsx     # ④モード選択画面
│       │   ├── ScanGuidanceScreen.tsx      # ⑤注意書き画面
│       │   ├── CameraCaptureScreen.tsx     # ⑥スキャン画面
│       │   ├── OcrVerificationScreen.tsx   # ⑦スキャン内容確認画面
│       │   ├── TextAudioResultScreen.tsx   # ⑧薬の翻訳画面（テキスト・音声）
│       │   └── SignLanguageResultScreen.tsx # ⑨薬の翻訳画面（手話動画）
│       └── services/          # API通信・外部連携
│           ├── api.ts         # FastAPIバックエンドとの通信
│           └── tts.ts         # 音声読み上げ制御
│
└── backend/                   # FastAPI / Python 3
    ├── requirements.txt
    ├── .env.example
    └── app/
        ├── main.py            # アプリケーションのエントリーポイント
        ├── config.py          # 環境変数・APIキー管理
        ├── api/               # エンドポイント定義
        │   ├── auth.py        # 【追加】認証エンドポイント（Google callback、パスワード登録、ローカルログイン）
        │   ├── ocr.py         # Google Cloud Vision OCR連携
        │   ├── rag.py         # RAG検索・Gemini Flash生成
        │   └── dictionary.py  # 手話辞書管理データ
        ├── mcp/               # Model Context Protocol関連
        │   ├── client.py      # FastMCPクライアント
        │   └── connectors/    # 各種MCPコネクタ（PMDA等）
        ├── services/          # ビジネスロジック
        │   ├── ocr_service.py
        │   ├── rag_service.py # LangChain + ChromaDB
        │   └── sign_service.py
        └── utils/             # 共通ユーティリティ
            └── security.py    # 【追加】医療ポリシーフィルタ検知ロジック、およびArgon2ハッシュ化・JWT検証処理
```
---

### 開発途中での実行コマンド
```text
npx expo start --tunnel
```