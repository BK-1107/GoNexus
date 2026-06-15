# GoNexus : AI Chat Platform

GoNexus は、ユーザー認証、セッション管理、ストリーミング AI チャット、ローカル RAG ナレッジベース、画像認識、クラウドデプロイを 1 つにまとめた AI チャットプラットフォームです。

<p align="left">
  <a href="./README_cn.md">中文</a> |
  <strong>日本語</strong> |
  <a href="./docs/en/README.md">English</a>
</p>

---

## デモ

![GoNexus デモ](./assets/ezgif-1fbf6f6bb015c1ad.gif)

---

## 技術スタック

- フロントエンド：React、TypeScript、Vite、Tailwind CSS、Zustand、Axios。
- バックエンド：Go、Gin、JWT、Eino、OpenAI 互換モデル API。
- ストレージとミドルウェア：MySQL、Redis Stack、RabbitMQ。
- デプロイ：Docker Compose、ローカルコンテナ、GitHub Actions、AWS ECR、ECS、S3。

---

## アーキテクチャ

![GoNexus アーキテクチャ図](./assets/59_13.png)

---

## 主な機能

- **リアルタイムチャット**：Server-Sent Events（SSE）で AI 回答をストリーミング出力します。
- **RAG 対応**：文書アップロードに対応し、ローカルナレッジで AI 回答を強化します。
- **セッション管理**：チャット履歴を MySQL に永続化し、複数セッションの同期に対応します。
- **マルチモデル対応**：バックエンドの統一インターフェースから複数の AI モデルプロバイダーを切り替えられます。

![GoNexus 機能図](./assets/1_J7vyY3EjY46AlduMvr9FbQ.png)

---

## AWS アーキテクチャ

![GoNexus AWS アーキテクチャ図](./assets/awsstructure.png)

---

## 目次

| 章 | 主な内容 | 状態 |
| -- | -------- | ---- |
| [01. ユーザー認証](./docs/ja/01.%E3%83%A6%E3%83%BC%E3%82%B6%E3%83%BC%E8%AA%8D%E8%A8%BC.md) | ログインリクエスト、認証情報検証、JWT 生成と返却 | ✅ |
| [02. チャット連携](./docs/ja/02.%E3%83%81%E3%83%A3%E3%83%83%E3%83%88%E9%80%A3%E6%90%BA.md) | SSE ストリーミングチャット、AIHelper、モデル呼び出し、フロント更新 | ✅ |
| [03. 会話とメッセージ永続化](./docs/ja/03.%E4%BC%9A%E8%A9%B1%E3%81%A8%E3%83%A1%E3%83%83%E3%82%BB%E3%83%BC%E3%82%B8%E6%B0%B8%E7%B6%9A%E5%8C%96.md) | メモリコンテキスト、RabbitMQ 非同期保存、DAO による MySQL 書き込み | ✅ |
| [04. RAG ナレッジベース連携](./docs/ja/04.RAG%E3%83%8A%E3%83%AC%E3%83%83%E3%82%B8%E3%83%99%E3%83%BC%E3%82%B9%E9%80%A3%E6%90%BA.md) | 文書アップロード、chunk 分割、embedding、Redis ベクトル検索 | ✅ |
| [05. 画像認識連携](./docs/ja/05.%E7%94%BB%E5%83%8F%E8%AA%8D%E8%AD%98%E9%80%A3%E6%90%BA.md) | 画像アップロード、base64 変換、Vision API 呼び出しと結果返却 | ✅ |
| [06. Docker デプロイ連携](./docs/ja/06.Docker%E3%83%87%E3%83%97%E3%83%AD%E3%82%A4%E9%80%A3%E6%90%BA.md) | Compose 起動、image build、container 通信、Nginx proxy | ✅ |

---

## クイックスタート

### 1. インフラを起動

Docker がインストールされ、起動していることを確認してから、必要なサービスを起動します。

```bash
cd GoNexus
docker-compose up -d
```

### 2. バックエンドを設定して起動

1. `GoNexus/config/config.example.toml` を `GoNexus/config/config.toml` にコピーし、ローカル環境に必要な設定を入力します。`config.toml` は Git にコミットしないでください。
2. 依存関係をインストールしてバックエンドを起動します。

```bash
go mod tidy
go run main.go
```

クラウドデプロイでは、次のような環境変数で設定を注入できます。

`GONEXUS_MYSQL_HOST`、`GONEXUS_REDIS_HOST`、`GONEXUS_RABBITMQ_HOST`、`GONEXUS_JWT_KEY`、`LLM_API_KEY`、`LLM_MODEL_ID`、`LLM_BASE_URL`。

### 3. フロントエンドを設定して起動

1. `GoNexus/frontend` ディレクトリへ移動します。
2. 依存関係をインストールし、開発サーバーを起動します。

```bash
npm install
npm run dev
```

---

## コントリビューション

Issue と Pull Request を歓迎します。

---

## ライセンス

このプロジェクトは GNU General Public License v3.0 のもとで公開されています。
