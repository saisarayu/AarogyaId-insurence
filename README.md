# AarogyaAid: AI-Powered Health Insurance Platform

AarogyaAid is a personalized, AI-powered health insurance recommendation platform that analyzes policy documents using Retrieval-Augmented Generation (RAG). It helps users compare plans, get structured policy insights, and ask follow-up questions through an AI chat assistant.

## 🚀 Key Features

* **Personalized health insurance recommendations** based on user profile fields such as name, age, lifestyle, medical conditions, income, and city.
* **RAG-based policy retrieval** using ChromaDB and OpenAI embeddings to ground recommendations in real policy text.
* **Structured recommendation outputs** returned as JSON keys: `peer_comparison`, `coverage_details`, `why_this_policy`, and `source_policies`.
* **AI chat assistant** that answers policy-related questions from the retrieved policy chunks while avoiding medical advice.
* **Admin upload dashboard** for PDF, TXT, and JSON policy files, with automatic text extraction, chunking, embedding, and vector store indexing.
* **MongoDB metadata store** for policy upload metadata and ChromaDB for vector search.

## 🛠 Tech Stack

* **Frontend:** React, Vite, Tailwind CSS
* **Backend:** FastAPI, Python 3.10+
* **AI & LLMs:** LangChain, OpenAI API (`gpt-3.5-turbo`)
* **Vector store:** ChromaDB (PersistentClient v1.x)
* **Metadata store:** MongoDB
* **PDF parsing:** pdfplumber

## 🔍 Implementation Notes

* `backend/app/services/ai_service.py` builds a RAG prompt, retrieves relevant policy chunks, and requests strict JSON from the LLM.
* `backend/app/services/rag_service.py` stores policy chunks and embeddings in a local ChromaDB persistence directory and performs semantic search.
* `backend/app/services/parser_service.py` extracts text from PDF, TXT, or JSON uploads and chunks content into overlapping 500-character segments.
* `backend/app/routes/admin_routes.py` supports `/upload-policy`, `/policies`, and `/delete-policy`.
* `backend/app/routes/user_routes.py` supports `/recommend` and `/chat`.
* `frontend/src/services/api.js` calls the backend API endpoints from the React app.

## ⚙️ Architecture & Design

1. **RAG pipeline:** Uploaded policies are chunked and embedded into ChromaDB, then retrieved with query embeddings using OpenAI.
2. **Structured JSON responses:** The backend enforces structured outputs so the React UI can safely render tables and cards.
3. **Separate metadata store:** MongoDB stores upload metadata, while ChromaDB holds vectorized policy chunks.

---

## 💻 Local Setup Instructions

### Prerequisites
* Python 3.10+
* Node.js v18+
* MongoDB server or Atlas cluster
* OpenAI API key

### Backend setup

```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env` with:

```env
OPENAI_API_KEY="sk-your-openai-api-key"
MONGODB_URI="mongodb://localhost:27017"
CHROMA_PERSIST_DIR="./chromadb"
CHROMA_COLLECTION_NAME="insurance_policies"
```

Run the backend:

```bash
uvicorn app.main:app --reload
```

The backend will be available at `http://localhost:8000`.

### Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## 📁 Project Structure

```text
insurance-ai/
├── backend/
│   ├── app/
│   │   ├── config/          # MongoDB connection, settings, and environment config
│   │   ├── models/          # Pydantic request/response models
│   │   ├── routes/          # FastAPI user/admin endpoints
│   │   ├── services/        # RAG, AI, parser, and metadata services
│   ├── chromadb/            # Local ChromaDB persistence store
│   ├── policies/            # Uploaded source policy files
│   ├── requirements.txt     # Python dependencies
├── frontend/
│   ├── public/              # Static frontend assets
│   ├── src/
│   │   ├── components/      # UI components for dashboard, chat, profile, recommendation
│   │   ├── pages/           # Home and Admin page views
│   │   ├── services/        # Frontend API client
│   ├── package.json         # Frontend dependencies and scripts
│   ├── tailwind.config.js   # Tailwind config
│   ├── vite.config.js       # Vite config
└── README.md
```