# GoNexus : AI Chat Platform

GoNexus is an AI chat platform designed to connect user authentication, session management, streaming AI chat, a local RAG knowledge base, image recognition, and cloud deployment into one complete application.

<p align="left">
  <a href="../../README.md">中文</a> |
  <a href="../ja/README.md">日本語</a> |
  <strong>English</strong>
</p>

---

## Demo

![GoNexus demo](../../assets/ezgif-1fbf6f6bb015c1ad.gif)

---

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Zustand, Axios.
- Backend: Go, Gin, JWT, Eino, OpenAI-compatible model APIs.
- Storage and middleware: MySQL, Redis Stack, RabbitMQ.
- Deployment: Docker Compose, local containers, GitHub Actions, AWS ECR, ECS, S3.

---

## Architecture

![GoNexus architecture diagram](../../assets/59_13.png)

---

## Core Features

- **Real-time chat**: Streams AI responses with Server-Sent Events (SSE).
- **RAG support**: Supports document uploads to enhance AI responses with local knowledge.
- **Session management**: Persists chat history in MySQL and supports synchronization across sessions.
- **Multi-model support**: Switches between different AI model providers through a unified backend interface.

![GoNexus feature diagram](../../assets/1_J7vyY3EjY46AlduMvr9FbQ.png)

---

## Contents

| Chapter | Key Topics | Status |
| ------- | ---------- | ------ |
| [01. User Authentication](./01.User%20Authentication.md) | Login request, credential validation, JWT generation and response | ✅ |
| [02. Chat Flow](./02.Chat%20Flow.md) | SSE streaming chat, AIHelper, model call, frontend update | ✅ |
| [03. Session and Message Persistence](./03.Session%20and%20Message%20Persistence.md) | Memory context, RabbitMQ async persistence, DAO writes to MySQL | ✅ |
| [04. RAG Knowledge Base Flow](./04.RAG%20Knowledge%20Base%20Flow.md) | File upload, chunk splitting, embedding, Redis vector retrieval | ✅ |
| [05. Image Recognition Flow](./05.Image%20Recognition%20Flow.md) | Image upload, base64 conversion, Vision API call and result return | ✅ |
| [06. Docker Deployment Flow](./06.Docker%20Deployment%20Flow.md) | Compose startup, image builds, container networking, Nginx proxy | ✅ |

---

## Quick Start

### 1. Start the Infrastructure

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

For cloud deployments, configuration can be injected through environment variables such as:

`GONEXUS_MYSQL_HOST`, `GONEXUS_REDIS_HOST`, `GONEXUS_RABBITMQ_HOST`, `GONEXUS_JWT_KEY`, `LLM_API_KEY`, `LLM_MODEL_ID`, and `LLM_BASE_URL`.

### 3. Configure and Start the Frontend

1. Go to the `GoNexus/frontend` directory.
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

This project is released under the GNU General Public License v3.0.
