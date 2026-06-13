# GoNexus: Full-Stack AI Chat Platform

GoNexus is a project designed to provide a customizable AI chat experience with local knowledge base integration (RAG). It features a high-performance Go backend and a modern React frontend with a neo-brutalist aesthetic.

## Tech Stack

### Backend
- **Language**: Go (Golang) 1.21+
- **Framework**: Gin Gonic
- **Features**: SSE streaming, JWT authentication, Model factory pattern
- **Storage**: MySQL 8.0, Redis (Stack), RabbitMQ

### Frontend
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: Zustand

## Key Features

- **Real-time Chat**: Streaming AI responses using Server-Sent Events.
- **RAG Support**: Upload documents to enhance AI responses with local context.
- **Session Management**: Persistent chat history stored in MySQL and synced across sessions.
- **Multi-Model Support**: Easily switch between different AI providers through the backend interface.

## Getting Started

### 1. Infrastructure
Ensure Docker is installed and running. Start the required services:
```bash
cd GoNexus
docker-compose up -d
```

### 2. Backend Setup
1. Copy `GoNexus/config/config.example.toml` to `GoNexus/config/config.toml` and fill in your local credentials. Keep `config.toml` out of Git.
2. Install dependencies and run:
```bash
go mod tidy
go run main.go
```

For cloud deployments, configuration can be injected with environment variables such as `GONEXUS_MYSQL_HOST`, `GONEXUS_REDIS_HOST`, `GONEXUS_RABBITMQ_HOST`, `GONEXUS_JWT_KEY`, `LLM_API_KEY`, `LLM_MODEL_ID`, and `LLM_BASE_URL`.

### 3. Frontend Setup
1. Navigate to the `GoNexus/frontend` directory.
2. Install dependencies and start the development server:
```bash
npm install
npm run dev
```

## Contributing
Feel free to submit issues or pull requests.

## License
Licensed under the GNU General Public License v3.0.
