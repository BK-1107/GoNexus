# GoNexus Detailed Usage Guide

Welcome to the **GoNexus** ecosystem. This guide provides deep-dive instructions on how to master the platform's features.

---

## 0. Project Setup (Essential)
Since GoNexus ignores sensitive environment and large dependency files for security, you must manually perform these steps after cloning the repository.

### Environment Configuration
The backend requires a `config.toml` file to store API keys and database credentials. 
*   **Location**: `GoNexus/config/config.toml`
*   **Key Fields**:
    *   `RagApiKey`: Your LLM API key for RAG operations.
    *   `Mysql`: Root password and database name (default: `GopherAI`).
    *   `Redis`: Connection details (default: `localhost:6379`).
    *   `RabbitMQ`: Credentials (default: `root / 123456`).

### Dependency Installation
You must fetch the required packages for both environments:
*   **Backend (Go)**: Run `go mod tidy` in the `GoNexus` directory to download all Go modules.
*   **Frontend (React)**: Run `npm install` in the `sandbox` directory to install UI dependencies.

### Infrastructure Initialization
GoNexus relies on MySQL, Redis, and RabbitMQ. These are managed via Docker to ensure consistency.
*   Run `docker-compose up -d` in the `GoNexus` directory to start all services in the background.

---

## 1. Authentication & Security
*   **Sign Up**: GoNexus uses a secure registration flow. If configured, you'll receive a verification code via SMTP.
*   **JWT Tokens**: Your session is managed by a JSON Web Token. For security, these tokens are stored in the application state and refreshed as needed.
*   **Logout**: Clicking the exit icon in the sidebar will clear your local state and session storage immediately.

---

## 2. Conversation Management
### Multiple Sessions
GoNexus allows you to maintain dozens of parallel AI sessions. 
*   **Sidebar Navigation**: All your sessions are listed on the left.
*   **Auto-Naming**: The system uses your first prompt to automatically generate a catchy title for the session.
*   **Persistence**: Even if you switch browsers, as long as you log in, your sessions will be pulled from the Go backend.

### Real-time Streaming
The chat uses **Server-Sent Events (SSE)**. Unlike traditional polling, SSE allows the AI to "type" its answer character-by-character, providing a much smoother experience.

---

## 3. Knowledge Base (RAG)
RAG stands for **Retrieval-Augmented Generation**. It allows the AI to "read" your files before answering.
1.  **Upload**: Navigate to the Knowledge page and upload files.
2.  **Indexing**: The backend splits your files into chunks, turns them into "vectors" using an embedding model, and stores them in Redis.
3.  **Retrieval**: When you ask a question in RAG mode, the system searches Redis for the most relevant text chunks and feeds them to the AI as context.

---

## 4. UI Customization & Interactions
The **Neo-Brutalist** design isn't just for show; it's functional:
*   **Visual Feedback**: High-contrast borders change color or thickness during active processes (like AI generating).
*   **Responsiveness**: The layout is built with a flexible grid that scales from massive 4K monitors down to mobile viewports.
*   **Micro-animations**: Powered by Framer Motion, ensuring every state change (opening sidebar, sending message) feels tactile.

---

## 5. Developer Customization
### Adding New Models
The Go backend uses a **Factory Pattern** in `common/aihelper/factory.go`. 
To add a new model:
1.  Implement the `AIModel` interface.
2.  Register your new model in the factory.
3.  Update the frontend `ChatSidebar` to include the new model type.

### Environment Control
Keep your `config.toml` outside of version control. The project is pre-configured to look for this file in `GoNexus/config/`.

---

## Troubleshooting
*   **Database Connection Refused**: Ensure your Docker containers are running (`docker ps`).
*   **History Not Loading**: Check if the backend port (9090) is blocked by a firewall or another process.
*   **Flickering UI**: Clear your browser's LocalStorage to reset the Zustand persisted state.

---

> *Build Bold. Think Brutal.*
