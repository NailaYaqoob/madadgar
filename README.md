# 🛠️ Madadgar: AI Service Orchestrator for the Informal Economy

[![Project Status: Hackathon Ready](https://img.shields.io/badge/Status-Hackathon--Ready-success.svg)](#)
[![Google Antigravity](https://img.shields.io/badge/Powered%20By-Google%20Antigravity-blue.svg)](#)

Madadgar (Urdu for "Helper") is a state-of-the-art **Agentic AI System** designed to bridge the gap in the informal service economy. It automates the end-to-end lifecycle of a service request—from natural language intent parsing (Urdu/English) to provider matching, booking automation, and structured observability.

Built specifically for the **AI Service Orchestrator Challenge**, Madadgar demonstrates how autonomous agents can transform disorganized sectors into efficient, digital-first marketplaces.

---

## 📽️ Submission Assets

- **Mobile App Link**: [Download/Link Placeholder]
- **Github Repository**: [https://github.com/NailaYaqoob/madadgar](https://github.com/NailaYaqoob/madadgar)
- **Solution Demo Video**: [YouTube/Loom Link Placeholder]
- **Antigravity Usage Video**: [YouTube/Loom Link Placeholder]
- **Trace Logs**: Included in the `/submissions/logs` directory.

---

## 🧠 The Agentic Core (Google Antigravity)

Madadgar is powered by an **8-agent reasoning pipeline** managed by Google Antigravity. Unlike simple chatbots, our orchestrator uses a graph-based state machine to ensure reliability and transparency.

### Reasoning Pipeline:
1. **Intent Agent**: Parses Urdu/Roman Urdu/English into structured JSON.
2. **Context Agent**: Detects location and time constraints.
3. **Provider Discovery Agent**: Queries the backend for available professionals.
4. **Ranking Agent**: Uses rating, distance, and availability to select the best match.
5. **Reasoning Agent**: Generates human-readable explanations for the selection.
6. **Booking Agent**: Simulates the transactional process and state updates.
7. **Notification Agent**: Formulates follow-up communications.
8. **Supervisor Agent**: Validates the entire flow before returning the result.

---

## 🏗️ Technical Architecture

### Tech Stack
- **Frontend**: React Native (Expo) - Mobile-first, cross-platform.
- **Backend**: FastAPI (Python) - High-performance asynchronous API.
- **Orchestration**: Google Antigravity - Agent state management & tracing.
- **Database**: PostgreSQL - Relational storage for providers and bookings.
- **Infrastructure**: Docker & Docker Compose - Seamless local deployment.

---

## 🚦 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js & npm (for Expo)
- Google Antigravity API Key

### Installation
1. **Clone & Setup**:
   ```bash
   git clone https://github.com/[username]/Madadgar.git
   cd Madadgar
   ```
2. **Environment**:
   Create a `.env` file in the root with:
   ```env
   OPENAI_API_KEY=your_key
   DATABASE_URL=postgresql://user:pass@db:5432/madadgar
   ```
3. **Launch Backend**:
   ```bash
   docker-compose up --build
   ```
4. **Launch Mobile App**:
   ```bash
   cd mobile
   npm install
   npx expo start
   ```

---

## 🔍 Observability & Tracing

Madadgar prioritizes transparency. Every service request generates a detailed **Antigravity Trace**, which can be viewed in real-time:
- **Backend Docs**: Access `http://localhost:8000/docs` to see the trace JSON in the response.
- **Usage Traces**: Full conversation logs between the developer and Antigravity are provided in the `/submissions/logs` folder as per requirement.

---

*Built with ❤️ for the informal economy.*

