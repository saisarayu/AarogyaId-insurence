# AarogyaAid: AI-Powered Health Insurance Platform

AarogyaAid is a personalized, AI-driven health insurance recommendation platform designed to help working-age Indian adults navigate complex policy documents. Instead of generic comparisons, AarogyaAid utilizes Retrieval-Augmented Generation (RAG) to scan real insurance policy PDFs and recommend the best plan based on a user's age, income, lifestyle, and pre-existing conditions.

## 🚀 Key Features

* **Smart User Profiling:** Captures 6 critical data points (Name, Age, Lifestyle, Medical Conditions, Income, City Tier).
* **RAG-Powered AI Recommendations:** 
  * Generates a deterministic **Peer Comparison Table** scoring policies against the user profile.
  * Extracts exact **Coverage Details** (Inclusions, Exclusions, Sub-limits, Co-pays).
  * Writes an empathetic, personalized explanation ("Why This Policy") grounding the recommendation to the user's specific health and financial risks.
* **Interactive AI Chat Assistant:** Allows users to ask specific follow-up questions about their recommendations in plain English (e.g., "What is a waiting period?", "Does this cover my diabetes?"). 
* **Admin Vector Database Dashboard:** A secure admin panel allowing staff to upload new insurance PDFs, JSONs, or TXT files. The system automatically chunks the text, creates embeddings, and updates the ChromaDB vector store.

## 🛠 Tech Stack

* **Frontend:** React, Vite, Tailwind CSS (Custom UI design without generic component libraries).
* **Backend:** FastAPI, Python 3.10+.
* **AI & LLMs:** LangChain, OpenAI (`gpt-3.5-turbo`, `text-embedding-ada-002`).
* **Databases:** 
  * **ChromaDB (v1.x PersistentClient):** Vector store for policy document embeddings.
  * **MongoDB:** Document metadata store (file names, upload dates, statuses).

## ⚙️ Architecture & Design Decisions

1. **Strict JSON Data Contracts:** To solve the gap between unpredictable generative AI text and structured UI elements, the backend forces the LLM to output rigid JSON formats. This guarantees the React frontend always receives pristine data for rendering complex UI tables and stat cards rather than giant blocks of Markdown.
2. **Context-Aware Overlapping Chunking:** When parsing uploaded PDFs, a specific sliding-window chunker extracts 500-character blocks with a 50-character overlap. This guarantees that the RAG queries never truncate critical mid-sentence policy clauses.
3. **Decoupled Architecture:** The system separates vector storage (ChromaDB) from metadata scaling (MongoDB).

---

## 💻 Local Setup Instructions

### Prerequisites
* Python 3.10+
* Node.js v18+
* A running MongoDB server (local or Atlas URI)
* OpenAI API Key

### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create your environment variables
# Add the following to backend/.env
# OPENAI_API_KEY="sk-your-openai-api-key"
# MONGODB_URI="mongodb://localhost:27017" # Or your MongoDB Atlas URI

# Start the FastAPI server
uvicorn app.main:app --reload
```
*Backend will run at `http://localhost:8000`*

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
*Frontend will run at `http://localhost:5173`*

## 📁 Project Structure

```text
insurance-ai/
├── backend/
│   ├── app/
│   │   ├── config/          # MongoDB & Settings Pydantic configs
│   │   ├── models/          # User & Metadata schemas
│   │   ├── routes/          # API endpoints (User & Admin)
│   │   └── services/        # AI, RAG ChromaDB, Parser, and Mongo services
│   ├── policies/            # Local storage for uploaded PDF/TXT files
│   ├── .env                 # API Keys
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/      # UserForm, Recommendation, ChatBox, AdminPanel
    │   ├── pages/           # Home & Admin Layouts
    │   ├── services/
    │   │   └── api.js       # Axios API client
    │   ├── App.jsx          # React Router layout
    │   └── index.css        # Tailwind Design Tokens
    └── vite.config.js
```
