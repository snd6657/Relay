# Relay – Agentic AI B2B Prospect Intelligence Platform

> **Discover. Qualify. Recommend.**

Relay is an **Agentic AI-powered B2B Prospect Intelligence Platform** that automates the complete workflow of discovering companies, analyzing business intelligence, qualifying leads, identifying decision-makers, and generating explainable recommendations.

---

## 🚀 Features

* Create projects using an Ideal Customer Profile (ICP)
* Autonomous multi-agent workflow powered by LangGraph
* Company discovery and market intelligence
* Company qualification using business rules
* Decision-maker identification and contact enrichment
* AI-generated recommendations with explainability
* Human-in-the-loop approval workflow
* Workflow monitoring and analytics dashboard

---

## 🧠 AI Workflow

```text
Create Project
      │
      ▼
Planner Agent
      │
      ▼
Market Intelligence Agent
      │
      ▼
Company Intelligence Agent
      │
      ▼
Qualification Agent
      │
      ▼
Contact Intelligence Agent
      │
      ▼
Recommendation Agent
      │
      ▼
Human Approval
      │
      ▼
Memory Agent
```

---

## 🏗 High-Level Architecture

```text
Frontend (React + Vite + Tailwind)
                │
                ▼
      FastAPI Backend API
                │
        ┌───────┴────────┐
        ▼                ▼
 LangGraph Engine    Supabase
  (AI Agents)       PostgreSQL
        │
        ▼
 External Services
 Gemini • Tavily • Firecrawl • Hunter.io
```

---

## 🛠 Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui
* TanStack Query

### Backend

* FastAPI
* Python

### AI & Orchestration

* LangGraph
* Gemini 2.5 Flash

### Database

* Supabase
* PostgreSQL

### External APIs

* Tavily
* Firecrawl
* Hunter.io

---

## 📂 Project Structure

```text
relay/
│
├── frontend/
│
├── backend/
│   ├── agents/
│   ├── planner/
│   ├── workflow/
│   ├── api/
│   ├── services/
│   ├── database/
│   └── app/
│
└── README.md
```

---

## ⚙️ Local Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd relay
```

### 2. Backend

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file inside the backend directory.

```env
GEMINI_API_KEY=your_api_key

SUPABASE_URL=your_supabase_url

SUPABASE_ANON_KEY=your_supabase_anon_key

TAVILY_API_KEY=your_api_key

FIRECRAWL_API_KEY=your_api_key

HUNTER_API_KEY=your_api_key
```

Run the backend:

```bash
uvicorn app.main:app --reload
```

### 3. Frontend

```bash

npm install

npm run dev
```


---

## 👥 Team

* **Soma Nandini(CSE-AIML)-23071A6657**
* **Gudipati Srihitha(CSE-IOT)-23071A6918**
* **Amancha Akshaya(CSE)-23071A0503**

---

## 📌 Built For

Hackathon MVP demonstrating the capabilities of **Agentic AI** for autonomous B2B prospect discovery, qualification, and recommendation.
