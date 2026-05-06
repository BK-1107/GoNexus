# GoNexus: The Ultimate AI Playground

> **STRIKING. RAW. POWERFUL.**
> GoNexus is not just another AI tool; it's a high-performance, Neo-Brutalist engineered ecosystem for next-generation intelligence. Built with a "Zero-Compromise" design philosophy, combining a high-speed Go backend with a visually aggressive React frontend.

---

## Visual Identity: Neo-Brutalism
GoNexus breaks the mold of modern "soft" UI. We embrace **hard borders**, **clashing colors**, **thick shadows**, and **raw typography**. It's designed to be loud, fast, and unforgettable.

---

## Tech Stack

### Backend: The Engine (GoNexus Core)
*   **Language:** Go (Golang) 1.21+
*   **Framework:** Gin Gonic (High-performance HTTP routing)
*   **Streaming:** SSE (Server-Sent Events) for real-time AI response delivery
*   **Storage:** 
    *   **MySQL 8.0:** Persistent data (Users, Sessions, History)
    *   **Redis Stack:** High-speed caching & Vector search for RAG
    *   **RabbitMQ:** Asynchronous background processing & Log queuing

### Frontend: The Interface (Nexus Sandbox)
*   **Core:** React 18 + TypeScript
*   **Styling:** Tailwind CSS (Custom Brutalist tokens)
*   **Animations:** Framer Motion (Aggressive micro-interactions)
*   **State:** Zustand (Persistent atomic state management)
*   **Icons:** Lucide React

---

## Core Features

*   **Nexus Chat:** Real-time streaming conversations with sub-millisecond UI latency.
*   **RAG Core (Knowledge Base):** Upload documents and chat with your own data using localized vector indexing.
*   **Multi-Model Factory:** Seamlessly switch between OpenAI, Gemini, and local models.
*   **Neo-Brutalist UI:** A unique aesthetic experience that prioritizes clarity and impact over generic softness.
*   **Deep Persistence:** Intelligent session recovery and cross-browser history sync.

---

## Quick Start Guide

### 1. Prerequisites
Ensure you have the following installed:
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/)
*   [Go](https://go.dev/dl/) (1.21+)
*   [Node.js](https://nodejs.org/) (18+)

### 2. Infrastructure Setup (Middleware)
Launch the database, cache, and message queue in one shot:
```bash
cd GoNexus
docker-compose up -d
```

### 3. Backend Configuration
1.  Navigate to `GoNexus/config/`.
2.  Create/Modify `config.toml`.
3.  Inject your API Keys (RAG, AI Providers) and database credentials.

### 4. Fire Up the Backend
```bash
cd GoNexus
go run main.go
```
*Server will listen on port 9090.*

### 5. Launch the Frontend
```bash
cd sandbox
npm install
npm run dev
```
*Access the interface at http://localhost:5173.*

---

## Usage Guide & Best Practices

### Starting a Conversation
Click the **"NEW CHAT"** button in the sidebar. Your session is automatically saved to the database as you type.

### Using the Knowledge Base (RAG)
1.  Go to the **"Knowledge"** tab.
2.  Upload your .txt or .pdf files.
3.  Switch the chat mode to **"RAG Core"** using the toggle in the sidebar.
4.  Ask questions based on your uploaded documents.

### Visual Interactions
*   **Draggable Elements:** In the Hero section, geometric shapes are interactive. Drag them to play with the Neo-Brutalist layout.
*   **Hard-Shadow Buttons:** Every button has a "Hard Press" effect. You'll feel the interaction.

---

## Security & Environment
To keep the repository clean and secure, the following are automatically ignored:
*   `*.env` files (Secrets)
*   `config.toml` (Local configurations)
*   `node_modules` (Dependencies)
*   `*.exe / *.zip / *.pkg` (Large installation packages)

---

## License
MIT License - Build something epic.
