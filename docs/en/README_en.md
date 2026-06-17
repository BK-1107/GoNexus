<div align="center">
  <h1>GoNexus</h1>
  <p><b>Chat, search, analyze, recognize, and reason with multimodal AI over your private knowledge base.</b></p>
</div>

<table align="center">
  <tr>
    <td align="center"><a href="../cn/README_cn.md">中文</a> · <a href="../ja/README_ja.md">日本語</a> · <strong>English</strong></td>
  </tr>
</table>


<p align="center">
  <a href="../../LICENSE"><img src="../../assets/badges/license-gpl-3.0.svg" alt="License"></a>
  <img src="../../assets/badges/go-1.24.svg" alt="Go">
  <img src="../../assets/badges/gin-backend.svg" alt="Gin">
  <img src="../../assets/badges/react-19.svg" alt="React">
  <img src="../../assets/badges/docker-deploy.svg" alt="Docker">
  <img src="../../assets/badges/aws-cloud.svg" alt="AWS">
</p>

> 💡 GoNexus is a full-stack AI chat platform for private knowledge base augmented Q&A. It retrieves locally uploaded internal documents during conversation, combines them with a large language model to generate answers that better match the business context, and integrates authentication, session management, streaming chat, image recognition, and cloud deployment into one complete application.

<div align="center">
  <img src="../../assets/Snipaste_2026-06-17_04-46-07.png" width="800" alt="GoNexus main interface" />
</div>

---

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Zustand, Axios.
- Backend: Go, Gin, JWT, Eino, OpenAI-compatible model APIs.
- Storage and middleware: MySQL, Redis Stack, RabbitMQ.
- Deployment: Docker, GitHub Actions, AWS.

---

## Architecture

<div align="center">
  <img src="../../assets/59_13.png" width="1200" alt="GoNexus architecture" />
</div>

---

## Core Features

- **Real-time chat**: Streams AI responses with Server-Sent Events (SSE).
- **RAG support**: Upload documents and enhance AI responses with local knowledge.
- **Session management**: Persists chat history in MySQL and supports synchronization across sessions.
- **Multi-model support**: Switch between different AI model providers, including local Ollama models.

<div align="center">
  <img src="../../assets/1_J7vyY3EjY46AlduMvr9FbQ.png" width="86%" alt="GoNexus feature overview" />
</div>

---

## AWS Architecture

<div align="center">
  <img src="../../assets/awsstructure.png" width="750" alt="GoNexus AWS architecture" />
</div>

---

## **Feature Showcase**

### 1. Login and Registration

<div align="center">
  <img src="../../assets/Snipaste_2026-06-17_04-50-32.png" width="42%" alt="GoNexus login" />
  <img src="../../assets/Snipaste_2026-06-17_05-00-19.png" width="36%" alt="GoNexus registration" />
</div>

### 2. AI Chat

<div align="center">
  <img src="../../assets/Snipaste_2026-06-17_04-50-52.png" width="100%" alt="GoNexus chat" />
</div>

### 3. Private Knowledge Base Upload

<div align="center">
  <img src="../../assets/Snipaste_2026-06-17_04-56-04.png" width="80%" alt="GoNexus private knowledge base upload" />
</div>

### 4. Image Analysis

<div align="center">
  <img src="../../assets/Snipaste_2026-06-17_04-59-33.png" width="86%" alt="GoNexus image analysis" />
</div>

---

## Flow Documentation

| Chapter | Key Topics | Status |
| ---- | -------- | ---- |
| [01. User Authentication](./01.User%20Authentication.md) | Login request, credential validation, JWT generation and response | ✅ |
| [02. Chat Flow](./02.Chat%20Flow.md) | SSE streaming chat, AIHelper, model call, frontend update | ✅ |
| [03. Session and Message Persistence](./03.Session%20and%20Message%20Persistence.md) | Memory context, RabbitMQ async persistence, DAO writes to MySQL | ✅ |
| [04. RAG Knowledge Base Flow](./04.RAG%20Knowledge%20Base%20Flow.md) | File upload, chunk splitting, embedding, Redis vector retrieval | ✅ |
| [05. Image Recognition Flow](./05.Image%20Recognition%20Flow.md) | Image upload, base64 conversion, Vision API call and result return | ✅ |
| [06. Docker Deployment Flow](./06.Docker%20Deployment%20Flow.md) | Compose startup, image builds, container networking, Nginx proxy | ✅ |

---

## Local Usage

### 1. Start Infrastructure

Make sure Docker is installed and running, then start the required services:

```bash
cd GoNexus
docker-compose up -d
```

### 2. Configure and Start the Backend

1. Copy `GoNexus/config/config.example.toml` to `GoNexus/config/config.toml`, then fill in the configuration required for your local environment. Do not commit `config.toml` to Git.
2. Install dependencies and start the backend:

```bash
go mod tidy
go run main.go
```

For cloud deployment, configuration can also be injected through environment variables, for example:

`GONEXUS_MYSQL_HOST`, `GONEXUS_REDIS_HOST`, `GONEXUS_RABBITMQ_HOST`, `GONEXUS_JWT_KEY`, `LLM_API_KEY`, `LLM_MODEL_ID`, and `LLM_BASE_URL`.

### 3. Configure and Start the Frontend

1. Enter the `GoNexus/frontend` directory.
2. Install dependencies and start the development server:

```bash
npm install
npm run dev
```

---

## Contributing

Issues and pull requests are welcome.

---

## License

This project is released under the [GNU General Public License v3.0](../../LICENSE).










