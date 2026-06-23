# bim-chatbot
AI-Powered Chatbot for BIM Documentation Management

## Autodesk Forge (APS) setup

1. Create an app at [https://aps.autodesk.com/](https://aps.autodesk.com/)
2. Enable **Data Management API**, **Model Derivative API**, and **OSS**
3. Copy credentials into `.env` (see `.env.example`)
4. Attach a BIM file (`.rvt`, `.ifc`, `.dwg`, etc.) in chat — it uploads to APS, translates, and opens in the 3D viewer

## Docker

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000

Ensure `.env` includes `OPENROUTER_API_KEY` and Forge credentials before starting.

