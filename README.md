# Madadgar: AI Service Orchestrator for the Informal Economy

[![Project Status: Hackathon Ready](https://img.shields.io/badge/Status-Hackathon--Ready-success.svg)](#)
[![Built with Google Antigravity](https://img.shields.io/badge/Built%20With-Google%20Antigravity-blue.svg)](#)

Madadgar (Urdu for "Helper") is an **Agentic AI System** that automates the end-to-end lifecycle of a home service request — from natural language intent parsing (Urdu/Roman Urdu/English) to provider matching, booking simulation, and real-time agent trace observability.

*Co-authored by **Gemini CLI**, an autonomous AI agent.*

Built for the **AI Service Orchestrator Challenge** (Challenge 2).

---

## Submission Assets

- **GitHub Repository**: [https://github.com/NailaYaqoob/madadgar](https://github.com/NailaYaqoob/madadgar)
- **Demo Video**: [YouTube/Loom Link — add before submission]
- **Antigravity Usage Video**: [YouTube/Loom Link — add before submission]

---

## Example Flow

> User: "Mujhe kal subah G-13 mein AC technician chahiye"

| Step | Output |
|------|--------|
| Intent | AC Technician, tomorrow morning |
| Location | G-13, Islamabad → [33.6491, 72.9818] |
| Discovery | 3 providers found within 5 km |
| Ranking | Ali AC Services — 4.8★, 0.3 km |
| Booking | Slot confirmed: 10:00 AM |
| Notification | Mock WhatsApp confirmation sent |
| Follow-up | Reminder scheduled 1 hour before |

---

## How Google Antigravity Was Used

Google Antigravity was used as the **primary development IDE** throughout this project. It was used to:

- Design and implement the multi-agent orchestration pipeline
- Write and debug all 7 agent nodes and the supervisor orchestrator
- Integrate external tools (Nominatim geocoding, OpenAI LLM)
- Build the React Native mobile frontend with real-time trace visualization
- Trace, debug, and iterate on reasoning flows end-to-end

---

## Agentic Pipeline (7 Agents)

The system uses a **structured reasoning pipeline** managed by a central Supervisor/Orchestrator:

```
User Message
     │
     ▼
┌────────────┐  ┌────────────────┐
│ IntentAgent│  │ LocationAgent  │  ← run in parallel
└─────┬──────┘  └───────┬────────┘
      │                 │
      ▼                 ▼
      └──────┬──────────┘
             ▼
    ┌──────────────────┐
    │ DiscoveryAgent   │  ← queries mock provider DB
    └────────┬─────────┘
             ▼
    ┌──────────────────┐
    │  RankingAgent    │  ← distance + rating score
    └────────┬─────────┘
             ▼
    ┌──────────────────┐
    │  BookingAgent    │  ← confirms or cancels
    └────────┬─────────┘
             ▼
    ┌──────────────────┐
    │NotificationAgent │  ← mock WhatsApp confirmation
    └────────┬─────────┘
             ▼
    ┌──────────────────┐
    │  FollowUpAgent   │  ← schedules reminder
    └──────────────────┘
```

### Agent Responsibilities

| Agent | Role |
|-------|------|
| **IntentAgent** | Extracts service category, urgency, datetime from natural language. Falls back to fuzzy keyword matching when LLM is unavailable. |
| **LocationAgent** | Extracts Islamabad sector (G-13, F-7, DHA, etc.) via regex. Uses local coords cache first, Nominatim as fallback. |
| **DiscoveryAgent** | Queries mock provider database filtered by service category. |
| **RankingAgent** | Scores providers by Haversine distance (60%) + star rating (40%). |
| **BookingAgent** | Simulates DB write for booking confirmation or cancellation. |
| **NotificationAgent** | Generates mock WhatsApp confirmation message. |
| **FollowUpAgent** | Schedules async post-service reminder (simulated). |

---

## Technical Architecture

```
┌─────────────────────────────┐
│   React Native (Expo)       │
│   Phone Auth → Chat UI      │
│   Real-time Agent Trace     │
└──────────────┬──────────────┘
               │ HTTP (axios)
               ▼
┌─────────────────────────────┐
│   FastAPI Backend           │
│   /api/v1/chat/request      │
│                             │
│   Orchestrator (Supervisor) │
│   ├── IntentAgent           │
│   ├── LocationAgent         │
│   ├── DiscoveryAgent        │
│   ├── RankingAgent          │
│   ├── BookingAgent          │
│   ├── NotificationAgent     │
│   └── FollowUpAgent         │
└─────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile Frontend | React Native (Expo SDK 54) |
| Backend API | FastAPI (Python, async) |
| Agent Orchestration | Custom supervisor with `asyncio.gather` for parallel execution |
| LLM (optional) | OpenAI GPT-4 Turbo — falls back to keyword matching if key absent |
| Geocoding | OpenStreetMap Nominatim (free, no key required) + local coords cache |
| Provider Data | Mock dataset (extensible to Google Places API) |
| Infrastructure | Docker + Docker Compose |

---

## APIs and Tools Used

| Tool | Purpose |
|------|---------|
| OpenAI GPT-4 Turbo | Intent parsing when API key is configured |
| OpenStreetMap Nominatim | Free geocoding for Islamabad/Rawalpindi areas |
| Haversine formula | Distance calculation between user and provider |
| Python `difflib` | Fuzzy keyword matching for typo-tolerant service detection |
| AsyncStorage | Mobile session persistence (phone auth) |
| Docker Compose | Local multi-service deployment |

---

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js & npm

### 1. Clone
```bash
git clone https://github.com/NailaYaqoob/madadgar.git
cd madadgar
```

### 2. Environment
Create `.env` in the project root:
```env
OPENAI_API_KEY=your_key_here        # optional — falls back to keyword mode
USE_MOCK_DATA=true
ALLOWED_ORIGINS=*
```

### 3. Start Backend
```bash
docker compose up
```
API available at `http://localhost:8000` — Swagger docs at `http://localhost:8000/docs`

### 4. Start Mobile App
```bash
cd mobile
npm install
npx expo start
```
Scan the QR code with Expo Go. Update `mobile/src/config.js` with your machine's local IP.

### Demo Credentials
- Any Pakistani phone number (e.g. `3001234567`)
- OTP: `123456`

---

## Observability

Every request returns a full **agent trace** in the API response:

```json
{
  "trace": [
    { "agent": "IntentAgent",    "type": "reasoning", "message": "Detected AC Technician requirement" },
    { "agent": "LocationAgent",  "type": "reasoning", "message": "Resolved G-13 → [33.6491, 72.9818]" },
    { "agent": "RankingAgent",   "type": "decision",  "message": "Top match: Ali AC Services (score: 88.4)" },
    { "agent": "BookingAgent",   "type": "action",    "message": "Slot confirmed: booking_999xyz" }
  ]
}
```

The mobile app renders this trace in real-time under each AI response.

---

## Assumptions and Limitations

- **Location**: Only covers Islamabad and Rawalpindi sectors. Other cities fall back to G-13 default coordinates.
- **Providers**: Mock dataset with 7 providers across 3 service categories (Plumber, Electrician, AC Technician). No live Google Places integration.
- **Booking**: Fully simulated — no real database writes or payment processing.
- **Notifications**: Mock WhatsApp messages — no actual messaging API connected.
- **OTP Auth**: Demo OTP is always `123456` — no real SMS gateway.
- **LLM**: App functions fully without an OpenAI key using keyword + fuzzy matching fallback.

---

*Built with Google Antigravity for the AI Service Orchestrator Challenge.*
