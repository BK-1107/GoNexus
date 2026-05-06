# GoNexus Setup and Usage Guide

This guide provides the necessary information to set up and use the GoNexus platform.

## 0. Project Initialization

After cloning the repository, you need to set up the environment manually as some configuration and dependency files are excluded from version control.

### Configuration
1.  Navigate to `GoNexus/config/`.
2.  Create a `config.toml` file.
3.  Fill in your `RagApiKey`, MySQL database password, and Redis/RabbitMQ connection details.

### Dependencies
- **Go Backend**: Run `go mod tidy` in the `GoNexus` folder.
- **React Frontend**: Run `npm install` in the `sandbox` folder.

### Infrastructure
Start the required databases and services using Docker:
```bash
cd GoNexus
docker-compose up -d
```

---

## 1. Authentication
- **Registration**: If SMTP is configured, a verification code will be sent to the registered email.
- **JWT**: Authentication is handled via JSON Web Tokens stored in the application state.
- **Persistence**: Chat history is automatically saved to the database upon login.

## 2. Chat and RAG Operations
- **Starting a Chat**: Create a new session via the sidebar. Sessions are automatically titled based on your first message.
- **RAG Mode**: To use the local knowledge base, go to the "Knowledge" tab, upload relevant files, and then toggle "RAG Mode" in the chat settings.
- **Streaming**: Responses are delivered character-by-character for a more interactive experience.

## 3. Developer Customization
- **Adding Models**: You can add new AI providers by implementing the `AIModel` interface in the backend and registering them in the factory.
- **Styling**: UI styles are managed via Tailwind CSS and can be adjusted in the `tailwind.config.js` or component-specific CSS.

## 4. Troubleshooting
- **Database Connection**: Verify Docker container status if the backend fails to connect to MySQL or Redis.
- **History Retrieval**: If chat history is not loading, ensure the backend API (port 9090) is accessible.

---

For further questions, please refer to the codebase or contact the project maintainers.
