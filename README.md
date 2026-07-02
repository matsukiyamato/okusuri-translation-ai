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
1. **初期画面 (MainModeSelection)**: テキスト・音声モード / 手話動画モードのインターフェース選択
2. **注意書き画面 (ScanGuidance)**: 撮影のコツ・お手本動画（GIF）の提示
3. **スキャン画面 (CameraCapture)**: カメラ起動、薬剤情報提供書を合わせる枠組み（オーバーレイ）表示
4. **スキャン内容確認画面 (OcrVerification)**: OCR抽出された薬剤名・テキストの確認・修正UI
5. **薬の翻訳画面：テキスト・音声 (TextAudioResult)**: やさしい日本語テキスト表示とTTS自動読み上げ
6. **薬の翻訳画面：手話動画 (SignLanguageResult)**: 手話動画ストリーミング再生と音声双方向質問UI

---

## 4. システムアーキテクチャ & データフロー

### ① 薬剤識別・情報解析フロー（OCR ➔ RAG）
```text
アプリ起動 ➔ 薬剤情報提供書の撮影 ➔ [Google Cloud Vision API] 文字抽出
  ➔ [Gemini Flash 2.5] JSON構造化（※撮影画像はサーバー上で処理後、即時完全削除）
  ➔ [FastMCP Client] ➔ [MCP Server] ➔ PMDA（患者向医薬品ガイド等）から公的情報を動的取得
  ➔ [LangChain + ChromaDB] 知識基盤と照合（ハルシネーション防止）
  ➔ [Gemini Flash 2.5] ファクトに基づいた「やさしい日本語」変換
  ➔ 出典情報の付与 ➔ アプリ画面へ表示
```

### ② 情報検索フロー（双方向音声対話）
```text
ユーザーからの音声質問 ➔ [Google Speech-to-Text] テキスト化
  ➔ [Gemini Flash 2.5] 質問意図の解析（※医療ポリシーフィルタによる禁止質問の検証）
  ➔ [MCP Server] ➔ PMDA ➔ [RAG] 根拠付き回答生成 ➔ 出典情報の付与
  ➔ [Google Text-to-Speech] 音声生成 ➔ アプリ側で回答表示 ＆ 音声読み上げ（手話動画再生）

⚠️注意：手話動画再生に関しては自作と自作で動画編集を行う。または、公式の物で使用が許可されている物があればそれを使用する。
ただし、公式の物を使用する際には、法令順守や利用規約、肖像権に最大限の配慮または、規約次第ではそれの使用を行わない。

```

### ③処理フロー

1. **スキャン & OCR**:

   ユーザーが撮影した「薬剤情報提供書」から Google Cloud Vision API で文字を抽出 ➔ Gemini Flash 2.5 で構造化データ（JSON）へパース。
   * **プライバシー保護**: 個人情報保護のため、サーバーに送信された撮影画像データは処理完了直後に**即時完全削除**。

2. **公的医療情報の動的取得 (MCP)**:

   最新の **Model Context Protocol (MCP)** を採用。`FastMCP` を用いた自社製MCPクライアントを介し、PMDA（患者向医薬品ガイド）の外部公的データベースから、当該薬剤の正確な公式ドキュメントをリアルタイムに引き当て。

3. **RAG (根拠付き生成)**:

   LangChain と ChromaDB を用いたRAG構成。抽出テキストとMCPから得た公的医療情報を知識基盤として照合。Gemini Flash 2.5 により、事実（ファクト）に基づいた「やさしい日本語」へのコンテキスト変換を実行。

4. **マルチモーダル出力**:

   - **テキスト・音声モード**: Google Text-to-Speech (TTS) による自動読み上げ。
   - **手話動画モード**: 変換されたテキストに基づき、手話辞書データベースから該当する手話動画（音声・字幕付き）を中央プレイヤーにストリーミング。

---

## 5. ① 技術スタック&選定根拠

- **Frontend**
- **・React Native(Expo SDK 56) / Type Script：**
　　Android、およびEAS (Expo Application Services) による運用の最適化。高齢者・難聴者向けの文字サイズ可変対応を満たすため、基底レイヤーから AccessibleText / AccessibleButton (48x48dp以上のタップ領域保証) を共通コンポーネント化。

- **Backend**

 - **・FastAPI(Python 3.11) / Uvicorn: Pydantic**による**厳格な型定義**と、非同期処理（Async/Await）による高速なAPI応答。

 - **・Model Context Protocol (MCP):** 医療情報という「常に最新かつ正確でなければならないデータ」をLLMの内部知識に頼らず、外部データソースとセキュアに連携させるための次世代プロトコル。

 - **Google Gemini Flash 2.5:** 低遅延・高コンテキストであり、医療テキストの構造化（JSON Mode）および「やさしい日本語」への変換タスクにおいて費用対効果とレスポンス速度のバランスが最も優れているため採用。

 - **AI / LLM**: Google Gemini Flash 2.5 API
 - **Protocol**: Model Context Protocol (MCP) via FastMCP
 - **Vector DB / RAG**: Chroma DB / LangChain
 - **External API**: Google Cloud Vision (OCR), Speech-to-Text, Text-to-Speech

## 5.1 システムアーキテクチャ（設計）
 - 1. **OCR層**: 撮影した薬剤情報提供書からVision APIでテキスト抽出、GeminiでJSON構造化（画像は即時破棄）

 - 2. **公的医療情報連携層**: MCP Serverを介してPMDA（患者向医薬品ガイド等）から公的情報を取得

 - 3. **RAG / 変換層**: ChromaDBの知識基盤と照合し、ハルシネーションを防止しながら「やさしい日本語」へ変換

 - 4. **インターフェース層**: ユーザーの希望に応じ、テキスト・音声出力、または手話動画（音声・字幕付き）で出力

---

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

- Google Cloud Vision Data Usage Policy（送信された画像がモデルの学習等に無断利用されない仕様の厳守）

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
│       ├── screens/           # 全6画面のUI実装
│       │   ├── MainModeSelectionScreen.tsx # ①初期画面
│       │   ├── ScanGuidanceScreen.tsx      # ②注意書き画面
│       │   ├── CameraCaptureScreen.tsx     # ③スキャン画面
│       │   ├── OcrVerificationScreen.tsx   # ④スキャン内容確認画面
│       │   ├── TextAudioResultScreen.tsx   # ⑤薬の翻訳画面（テキスト・音声）
│       │   └── SignLanguageResultScreen.tsx # ⑥薬の翻訳画面（手話動画）
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
        │   ├── ocr.py         # Google Cloud Vision OCR連携
        │   ├── rag.py         # RAG検索・Gemini Flash生成
        │   └── dictionary.py  # 手話辞書管理データ
        ├── mcp/               # Model Context Protocol関連
        │   ├── client.py      # FastMCPクライアント
        │   └── connectors/    # 各種MCPコネクタ（PMDA等）
        └── services/          # ビジネスロジック
            ├── ocr_service.py
            ├── rag_service.py # LangChain + ChromaDB
            └── sign_service.py

```
### 開発途中での実行コマンド
```text
npx expo start --tunnel
```