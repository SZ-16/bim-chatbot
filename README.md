# BIM Chatbot

AI-powered chatbot for BIM (Building Information Modeling) documentation management. Upload project documents and BIM models, ask questions in natural language, view 3D/2D models in-browser, and generate charts or formal reports straight from the conversation.

## Features

- **Conversational document Q&A** — upload PDFs/text docs and ask questions; answers are grounded in the document content.
- **BIM model viewing** — upload `.rvt`, `.ifc`, `.dwg`, `.nwd`, `.nwc`, `.dxf`, `.fbx`, `.obj`, `.3ds`, `.step`/`.stp`, `.iges`/`.igs` files; they're translated via Autodesk Platform Services (APS/Forge) and rendered in an embedded 3D viewer.
- **Inline charts** — ask for a chart/graph and the assistant returns structured data rendered as a bar or pie chart.
- **Report generation** — ask the assistant to generate a report/document and it returns a formatted document you can export.
- **Chat history** — conversations and messages are persisted to a Postgres database.
- **JWT-based auth** — simple token-based authentication on API routes.
- **Rate limiting** — sensitive endpoints (model upload, token requests) are rate-limited with SlowAPI.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (React 19, TypeScript), Tailwind CSS 4, `react-markdown`, `recharts` |
| Backend | FastAPI (Python 3.12), SQLAlchemy, `psycopg2`, SlowAPI, PyJWT |
| AI | OpenRouter API (model: `poolside/laguna-m.1:free`) |
| BIM Viewing | Autodesk Platform Services (APS / Forge) — Data Management, Model Derivative, OSS APIs |
| Database | PostgreSQL (designed for Neon serverless Postgres) |
| Containerization | Docker / Docker Compose |

## Project Structure

```
bim-chatbot/
├── main.py                  # FastAPI app entrypoint, routes, JWT login
├── auth.py                  # JWT creation/verification helpers
├── ai_engine.py             # Document loading + OpenRouter chat completion logic
├── databaseFile.py          # SQLAlchemy engine/session setup (Postgres)
├── models.py                # SQLAlchemy models: Chat, Message, Comment
├── limiter.py                # SlowAPI rate limiter instance
├── bim_data.txt             # Default document context used by the AI engine
├── forge/
│   ├── aps_client.py        # Autodesk APS auth, bucket/object upload, translation
│   └── routes.py            # /forge/* API routes (token, upload, status)
├── database/
│   ├── chat_history.py      # Fetch recent chat history from Postgres
│   └── ingest_data.py       # Extract/chunk documents and ingest embeddings into pgvector
├── docs/                    # Mounted volume for reference documents
├── uploads/                 # Uploaded documents (PDF/DOCX/TXT)
├── docker/
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
├── docker-compose.yml
├── requirements.txt          # Python dependencies
└── frontend/
    ├── app/
    │   ├── page.tsx           # Main chat page
    │   ├── login/page.tsx
    │   └── register/page.tsx
    ├── components/
    │   ├── chat/ChatArea.tsx
    │   ├── forge/ForgeViewer.tsx
    │   ├── forge/ForgeModelCard.tsx
    │   ├── layout/Sidebar.tsx
    │   └── settings/SettingsModal.tsx
    ├── utils/
    ├── types/
    └── package.json
```

## Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL database (e.g. a free [Neon](https://neon.tech/) instance)
- An [OpenRouter](https://openrouter.ai/) API key
- An [Autodesk Platform Services (APS)](https://aps.autodesk.com/) app (for BIM model viewing)
- Docker + Docker Compose (optional, for containerized setup)

## Environment Variables

Copy `.env.example` to `.env` in the project root and fill in the values:

```bash
# AI (OpenRouter)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Autodesk Platform Services (Forge)
FORGE_CLIENT_ID=your_aps_client_id
FORGE_CLIENT_SECRET=your_aps_client_secret
FORGE_BUCKET=bim-chatbot-dev   # lowercase, globally unique bucket name

# Database
DATABASE_URL=postgresql://user:password@host/dbname
```

### Setting up Autodesk Platform Services (APS)

1. Create an app at [https://aps.autodesk.com/](https://aps.autodesk.com/).
2. Enable the **Data Management API**, **Model Derivative API**, and **OSS** (Object Storage Service).
3. Copy the Client ID and Client Secret into your `.env`.
4. Attaching a BIM file (`.rvt`, `.ifc`, `.dwg`, etc.) in the chat UI will upload it to APS, kick off translation, and open it in the embedded 3D viewer once translation finishes.

## Local Development (without Docker)

### 1. Backend

```bash
# from the project root
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# make sure .env is configured (see above)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`. Visit `http://localhost:8000/` for a basic health check.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3000`. Set `NEXT_PUBLIC_API_URL` in your frontend environment if the backend isn't running on the default `http://localhost:8000`.

### 3. (Optional) Data ingestion

`database/ingest_data.py` extracts text from a PDF/DOCX/TXT file, chunks it, and inserts it (with placeholder/mock embeddings) into a `bim_documents` table for retrieval. Update the `file_path` in the script and run:

```bash
python database/ingest_data.py
```

> Note: this script currently generates **mock random vectors** rather than real embeddings — replace `generate_mock_embedding` with a real embedding model call before using it for production retrieval.

## Running with Docker

```bash
docker compose up --build
```

This builds and starts two services:

- **backend** → `http://localhost:8000`
- **frontend** → `http://localhost:3000`

Make sure `.env` (in the project root) is filled in before starting — `docker-compose.yml` loads it via `env_file`.

## API Overview

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/` | Health check | No |
| `POST` | `/login` | Returns a demo JWT access token | No |
| `POST` | `/upload` | Upload a `.pdf`/`.txt` document | No |
| `GET` | `/documents` | List uploaded documents | No |
| `GET` | `/forge/token` | Get a short-lived APS viewer access token | Yes (JWT) |
| `POST` | `/forge/models/upload` | Upload a BIM file and start Model Derivative translation | Yes (JWT) |
| `GET` | `/forge/models/{urn}/status` | Poll translation status for a model URN | Yes (JWT) |

Authenticate by calling `POST /login` to receive a bearer token, then send it as `Authorization: Bearer <token>` on protected routes.

## How the AI Engine Works

`ai_engine.py` loads a document (defaults to `bim_data.txt`) as context, then sends it together with the user's question and recent chat history to OpenRouter (model `poolside/laguna-m.1:free`). The system prompt instructs the model to:

- Write in flowing paragraphs (not single-line breaks), using bullet points only for lists.
- Emit a `<chart>{...}</chart>` JSON block when the user explicitly asks for a chart or graph (supports `bar` and `pie` types), which the frontend renders with Recharts.
- Emit a `<document>...</document>` block when the user asks for a report or export, which the frontend renders/exports as a formatted document.

