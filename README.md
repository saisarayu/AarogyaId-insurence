# AarogyaAid — Health Insurance Policy Recommendation Platform

> **AI-powered RAG application** that helps users find the most suitable health insurance policy based on their personal profile. Grounded exclusively in uploaded policy documents — no hallucinations.

---

## 🚀 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS 3, Axios |
| **Backend**  | FastAPI, Python 3.10+, Pydantic v2 |
| **AI Stack** | LangChain, OpenAI GPT-3.5-turbo, OpenAI Embeddings |
| **Vector DB** | ChromaDB 1.x (auto-persist) |
| **Metadata DB** | MongoDB (optional — graceful fallback to JSON index) |
| **Document Parser** | pdfplumber, plain-text, JSON |

---

## 🏗️ Architecture

```
User
 │
 ▼
React + Tailwind Frontend
 │
 ▼ REST API
FastAPI Backend
 ├── POST /recommend     → RAG → GPT-3.5 → JSON recommendation
 ├── POST /chat          → RAG → GPT-3.5 → grounded Q&A
 ├── POST /upload-policy → Parse → Chunk → Embed → ChromaDB
 ├── GET  /policies      → MongoDB + ChromaDB index
 ├── DELETE /delete-policy → MongoDB + ChromaDB cleanup
 └── POST /refresh-vector-db → Re-index all policies
 │
 ├── OpenAI Embeddings ──► ChromaDB Vector Store
 └── GPT-3.5 Turbo ◄──── Retrieved Chunks (top-5)
```

---

## ⚙️ Setup & Running

### Prerequisites
- Python 3.10+
- Node.js 18+
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))
- MongoDB (optional)

### Backend

```bash
cd backend

# 1. Create virtual environment
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
copy .env.example .env
# Edit .env and add your OPENAI_API_KEY

# 4. Start the server
uvicorn app.main:app --reload --port 8000
```

Backend runs at: `http://localhost:8000`
API docs: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Configure environment
copy .env.example .env
# Edit .env: VITE_API_BASE_URL=http://localhost:8000

# 3. Start dev server
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 📋 Project Structure

```
AarogyaId-insurence/
├── backend/
│   ├── app/
│   │   ├── config/
│   │   │   ├── settings.py          # Pydantic settings (reads .env)
│   │   │   ├── mongo.py             # MongoDB connection
│   │   │   └── db.py
│   │   ├── models/
│   │   │   ├── user_model.py        # UserProfile, ChatRequest
│   │   │   └── policy_model.py
│   │   ├── routes/
│   │   │   ├── user_routes.py       # /recommend, /chat
│   │   │   └── admin_routes.py      # /upload-policy, /policies, /delete-policy, /refresh-vector-db
│   │   ├── services/
│   │   │   ├── ai_service.py        # generate_recommendation()
│   │   │   ├── chat_service.py      # chat_with_user()
│   │   │   ├── rag_service.py       # ChromaDB store/retrieve/delete
│   │   │   ├── parser_service.py    # PDF/TXT/JSON text extraction
│   │   │   ├── policy_metadata_service.py  # MongoDB CRUD
│   │   │   └── recommendation_service.py   # Multi-factor scoring engine
│   │   └── main.py
│   ├── policies/                    # Uploaded policy files
│   ├── chromadb/                    # ChromaDB persistent store
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.jsx           # Dark gradient nav sidebar
    │   │   ├── Navbar.jsx            # Top header bar
    │   │   ├── UserForm.jsx          # Profile input (toggle groups)
    │   │   ├── Recommendation.jsx    # 4-tab results view
    │   │   ├── ComparisonTable.jsx   # Policy comparison table
    │   │   ├── RecommendationCard.jsx # Individual policy card
    │   │   ├── CoverageTable.jsx     # Coverage details grid
    │   │   ├── ChatBox.jsx           # AI chat with suggestions
    │   │   └── AdminPanel.jsx        # Upload/manage policies
    │   ├── pages/
    │   │   ├── Home.jsx              # Hero + recommendation flow
    │   │   └── Admin.jsx             # Admin page wrapper
    │   ├── services/
    │   │   └── api.js               # Axios API layer
    │   └── index.css                # Design system + animations
    ├── tailwind.config.js
    └── .env.example
```

---

## 🔄 RAG Workflow

1. **Upload**: Admin uploads PDF/TXT/JSON → `parser_service` extracts text
2. **Chunk**: Text split into 500-char overlapping chunks → `chunk_text()`
3. **Embed**: `OpenAIEmbeddings` converts each chunk to a vector
4. **Store**: Vectors + metadata saved to `ChromaDB`; metadata to `MongoDB`
5. **Query**: User profile → embedding → similarity search → top-5 chunks
6. **Generate**: GPT-3.5-turbo receives chunks + profile → structured JSON
7. **Score**: `recommendation_service.py` applies 5-factor scoring:
   - Waiting Period (25%), Coverage Amount (25%), Co-payment (20%), Exclusions (15%), Affordability (15%)
8. **Display**: Frontend renders comparison table, cards, coverage details, explanation

---

## 🎨 UI Features

- **Dark gradient sidebar** with glowing active link and decorative orbs
- **Hero banner** with animated gradient headline and stat badges
- **4-tab recommendation view**: Comparison Table · Policy Cards · Coverage Details · Why This Policy
- **Policy cards** with score progress bar and "Top Pick" gradient badge
- **Drag-and-drop upload zone** in Admin Panel
- **AI chat** with suggested questions, typing indicator, gradient bubbles
- **Toast notifications** for upload/delete success and errors
- **Smooth animations**: fade-up, slide-in, float, shimmer skeleton

---

## 🔮 Future Enhancements

- [ ] OCR support for scanned PDFs
- [ ] Hybrid keyword + vector search
- [ ] JWT-based user authentication
- [ ] Conversation memory for multi-turn chat
- [ ] Redis caching for faster retrieval
- [ ] Docker-based deployment
- [ ] Cloud deployment on AWS / Azure / GCP