# GopherAI

This is a comprehensive full-stack artificial intelligence web tool built to provide a conversational AI interface, local knowledge base retrieval (RAG), and modular model integration.

## Platform Architecture

The system is designed with a decoupled frontend-backend architecture to ensure scalability and ease of maintenance:

- Frontend: Built with Vue 3 and Element Plus, providing a responsive and modern Single Page Application (SPA) experience.
- Backend: Built with Go (Golang) and the Gin web framework to provide high-performance API services and Server-Sent Events (SSE) streaming capabilities.
- Storage & Middleware:
  - MySQL: Relational data persistence (users, sessions, message history).
  - Redis: Caching, session states, and high-performance Vector Indexing for RAG.
  - RabbitMQ: Asynchronous task queuing for message logging and background operations.

## Core Features

1. AI Chat Interface
   - Multi-session management allowing users to maintain parallel conversations.
   - Real-time text generation directly streamed to the client using Server-Sent Events (SSE).
   - Dynamic model switching to communicate with different LLMs.

2. Retrieval-Augmented Generation (RAG)
   - Capability to upload and parse documents.
   - Vector embedding generation and semantic similarity search leveraging Redis Vector functionalities to enhance model prompts with specific, localized knowledge.

3. User System
   - Secure registration process utilizing SMTP email verification codes.
   - JWT-based authentication combined with secure password hashing.

4. Extensibility
   - Architecture implements a Factory Pattern for AI Helpers, making it straightforward to plug in additional model providers (e.g., OpenAI, local Ollama, Google Gemini) via standard interfaces.

## Setup and Deployment

Dependencies:

- Go 1.20+
- Node.js 16+
- Docker & Docker Compose

### Start Infrastructure

Use the provided compose configuration to initialize the required middleware:

```bash
docker-compose up -d
```

This will start MySQL, Redis, and RabbitMQ simultaneously.

### Configure Environment

Modify `config/config.toml` to inject your corresponding API keys (e.g., Aliyun Dashscope), SMTP credentials, and database passwords.

### Run Backend

Navigate to the source directory and start the Go server:

```bash
go run main.go
```

The API server will typically listen on port 9090.

### Run Frontend

Navigate to the `vue-frontend` directory, install dependencies, and start the development server:

```bash
npm install
npm run serve
```

The web interface will be accessible via localhost.
