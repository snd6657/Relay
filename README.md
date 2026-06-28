# Relay: Agentic AI B2B Lead Generation Platform

An autonomous Agentic AI platform designed to revolutionize B2B Lead Generation and Market Research. 

Relay utilizes intelligent agents to search the web, scrape company data, qualify leads against a strict Ideal Customer Profile (ICP), extract structured metadata, and provide human-in-the-loop explainable recommendations.

## 👥 Team
- **Soma Nandini** – CSE (AIML)
- **G Srihitha** – CSE (IOT)
- **Akshaya** – CSE

## 🚀 Features
- **Autonomous Market Intelligence:** Define an ICP and let the AI hunt for matching companies.
- **Deep Scraping & Reasoning:** Uses Firecrawl to scrape raw website data and reads it via LLMs to extract insights like industry, tech stack, and employee count.
- **Intelligent Qualification:** Scores companies against your strict business rules and immediately filters out bad leads.
- **Explainable AI:** Generates a detailed "Explainability Report" providing bullet-pointed evidence for why a company was approved or rejected.
- **Optimistic Human-in-the-Loop UI:** Lightning-fast React dashboard to review, approve, or reject AI recommendations.

## 🛠️ Tech Stack
### **AI & Orchestration**
- **LangGraph:** For stateful, multi-agent orchestration (Planner, Scraper, Qualification, Recommendation).
- **Gemini 2.5 Flash :** LLM integration for rapid, high-context reasoning.

### **Backend**
- **FastAPI (Python):** High-performance backend API handling async workflow execution.
- **Supabase:** Lightweight and optimized database for rapid state persistence and complex queries.

### **Frontend**
- **React + Vite:** Extremely fast build tool and frontend framework.
- **TailwindCSS:** For a sleek, premium, glass-morphism aesthetic.
- **TanStack Query & Router:** For optimistic UI updates and seamless state management.

---

## 💻 Local Setup Instructions

### 1. Backend Setup
Navigate to the `backend` folder and set up your Python environment:
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file inside the `backend` directory with your API keys:
```env
GEMINI_API_KEY="your_google_ai_key"
FIRECRAWL_API_KEY="your_firecrawl_key"
TAVILY_API_KEY="your_tavily_key"
```

Start the FastAPI server:
```bash
python -m uvicorn app.main:app --reload --port 8001
```

### 2. Frontend Setup
Open a new terminal and navigate to the project root:
```bash
npm install
npm run dev
```
The UI will run on `http://localhost:8080`.

## 🔒 Security Note
This repository contains a `.gitignore` specifically configured to prevent the accidental upload of `.env` files, API keys
