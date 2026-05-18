# 📂 Madadgar & CareerPath AI Pakistan: Historical Plans & Artifacts Archive

This archive compiles all **Implementation Plans, Walkthroughs, Design Specifications, and Architectures** generated across the lifecycle of your application development process. It aggregates two distinct projects:
1. **CareerPath AI Pakistan**: The mobile-first educational roadmap and counseling platform securely integrated with Google Gemini API.
2. **Madadgar**: The premium, 8-agent AI service orchestrator for informal workers featuring advanced observability, Roman Urdu capability, and dynamic provider selection.

Use this document to review past design decisions, architecture files, and implementation details.

---

## 🗺️ Project 1: CareerPath AI Pakistan

### 1. Onboarding & Heuristic Engine Plan
*   **Original Plan Location:** [implementation_plan.md](file:///C:/Users/lenovo/.gemini/antigravity/brain/99f5dc03-2701-4c72-92fd-b29c5d759f2f/implementation_plan.md)
*   **Goal:** Build a mobile-first, modern web application guiding Pakistani students (Matric, Inter, university level) to choose realistic career paths based on academic marks, budget, and interests.
*   **Core Concepts:**
    *   **Vanilla CSS Design System:** Modern typography, soft color variables (trusting blue `#4A90E2`, energetic orange/teal), glassmorphism overlay cards, and smooth layout fade-ins.
    *   **Onboarding Form:** Animated multi-step wizard using selectable cards rather than standard input radios.
    *   **Smart Alternatives Engine:** Heuristics that dynamically map high aspirations with lower grades (e.g., matching a 65% pre-medical score to DPT/Nursing instead of MBBS) with contextual, localized justifications.
    *   **Detailed Roadmaps:** Specifying top Pakistani universities (FAST, NUST, KEMU), entry tests (MDCAT/ECAT), estimated PKR budgets, and years of study.
    *   **Floating Chat Counselor:** Chat bubble overlay providing dynamic guidance in English and Roman Urdu.

### 2. Full-Stack Backend Integration & API Security Plan
*   **Original Plan Location:** [implementation_plan.md](file:///C:/Users/lenovo/.gemini/antigravity/brain/66e4e8ca-cb18-4c0a-8309-aae2a7e148b9/implementation_plan.md)
*   **Original Walkthrough Location:** [walkthrough.md](file:///C:/Users/lenovo/.gemini/antigravity/brain/66e4e8ca-cb18-4c0a-8309-aae2a7e148b9/walkthrough.md)
*   **Goal:** Transition the React/Vite app from a frontend-only mockup into a secure full-stack application routing calls to the Gemini API via a Node.js/Express server.
*   **Key Implementations:**
    *   **Express Server (`server/index.js`):** Exposes `POST /api/chat` using `@google/generative-ai` to secure `GEMINI_API_KEY` on the server-side, preventing API exposure in client network requests.
    *   **Vite Proxy (`vite.config.js`):** Proxies local frontend requests on port `5173` to backend port `8080` to prevent CORS issues.
    *   **Double-Stage Dockerfile:** 
        *   *Stage 1:* Compiles the React static files in the `/dist` directory.
        *   *Stage 2:* Pulls a slim Node environment, installs Express, copies the built React folder, and boots on port `8080` (replacing Nginx entirely to handle both serving static files and API requests).

---

## 🛠️ Project 2: Madadgar AI Service Orchestrator

### 1. 8-Agent Orchestrator Graph Design
*   **Original Spec Location:** [agent_architecture.md](file:///C:/Users/lenovo/.gemini/antigravity/brain/93f27688-ba63-46db-84ea-54e7733001ee/agent_architecture.md)
*   **Goal:** Create a multi-agent matching engine using **Google Antigravity** as the state machine and the **OpenAI Agents SDK** for conversational reasoning.
*   **Agent Node Architecture Details:**

| Agent Name | Primary Responsibility | Primary Tools / Inputs | Handoff & Edge Cases |
| :--- | :--- | :--- | :--- |
| **Supervisor / Planner** | State monitor and router. Strategizes transitions, asks direct clarifications. | `route_to_agent`, `ask_user_clarification` | Resolves domain shifts (e.g., plumbing -> electrician mid-flow) by resetting state. |
| **Intent Understanding** | Extracts target service, date/time constraints, and urgency level. | `parse_datetime_nlp` | Resolves vague requests and Roman Urdu phrases (e.g., *"bijli kharab hai"*). |
| **Location Extraction** | Geocodes user coordinates/colloquial neighborhood names. | `google_maps_geocode` | Handles relative landmarks (e.g., *"Near Centaurus Mall"*). |
| **Provider Discovery** | Queries raw matching candidates within a default 5km radius. | `query_supabase_providers`, Places API | Auto-expands query search radius up to 15km if 0 initial matches found. |
| **Provider Ranking** | Evaluates and sorts candidates out of 100 based on core metrics. | Proximity (40%), Rating (40%), Availability (20%) | Falls back to Haversine straight-line distance if API fails. Shuffles identical scores. |
| **Booking** | Simulates and secures transactional lockups in postgres. | `mutate_db_create_booking` | Catches double-booking rejections and reports back to Supervisor to pick pick #2. |
| **Notification** | Crafts context-aware SMS/WhatsApp booking confirmation notifications. | `send_whatsapp_mock`, `send_sms_mock` | Falls back to internal push notifications if user contact info is missing. |
| **Follow-Up (Async)** | Gathers user rating reviews and reports provider arrival status. | `schedule_async_trigger` | Triggers immediate reliability downgrades and re-booking if provider is a no-show. |

### 2. Observability, Telemetry & Logging Spec
*   **Original Spec Location:** [observability_design.md](file:///C:/Users/lenovo/.gemini/antigravity/brain/93f27688-ba63-46db-84ea-54e7733001ee/observability_design.md)
*   **Goal:** Provide end-to-end tracing of user requests, agent reasoning paths, and SQL execution timings.
*   **Observability Pipeline:**
    ```mermaid
    graph TD
        Client[Mobile/Web Client] -->|Request + TraceID| Middleware[FastAPI Middleware]
        Middleware -->|Context| API[FastAPI Endpoints]
        API -->|State| Orchestrator[Antigravity Supervisor]
        Orchestrator --> Agent1[Intent Agent]
        Orchestrator --> Agent2[Location Agent]
        Orchestrator --> AgentN[...Agents]
        Agent1 --> Logger[Structured JSON Logger]
        Agent2 --> Logger
        AgentN --> Logger
        Logger -->|stdout/stderr| Datadog[Log Aggregator]
        Logger -->|Async Write| DB[(PostgreSQL agent_logs)]
        DB -->|REST API| ReasoningUI[Mobile App Reasoning UI]
    ```
    *   **Trace Context Correlation:** Custom FastAPI middleware extracts or issues a unique `X-Correlation-ID` header, attaching it to request threads.
    *   **Structured Logs Database Schema:** PostgreSQL table `agent_logs` indexing logs by `correlation_id` and tracking `log_type` (`reasoning`, `tool_execution`, `state_transition`, `booking_lifecycle`).
    *   **Telemetry Integration:** Modified the Antigravity `AgentState` object to carry structured telemetry contexts asynchronously indexed in the backend.

### 3. Premium UI/UX Animation & Gesture System
*   **Original Spec Location:** [madadgar_ui_ux_spec.md](file:///C:/Users/lenovo/.gemini/antigravity/brain/a59e9509-05a8-4c8c-904d-2bf1a420c14c/artifacts/madadgar_ui_ux_spec.md)
*   **Goal:** Incorporate futuristic "cyberpunk-glassmorphism" aesthetics matching the deep space dark-cyan theme for the Expo React Native app.
*   **Premium Interactive Components:**
    *   **Pulsing Voice Waveform Input:** Vertical bars scaling height based on volume and surrounded by a glowing ripple ring. Designed for Urdu and Roman Urdu recording.
    *   **Pulsing Agentic State Orbit:** Central "Supervisor Agent" orb surrounded by rotating, glowing nodes (Intent, Location, Discovery, Booking) that light up sequentially.
    *   **Midjourney Mockup Prompts:** Hand-tailored UI prompts for Midjourney and DALL-E 3 targeting premium provider cards, glassmorphic dashboards, and glowing AI cores.
    *   **Reasoning Debugger Drawer:** Expandable bottom sheet allowing hackathon judges to review timing metrics and JSON schemas directly.

### 4. Selection Phase Implementation & Validation
*   **Original Plan Location:** [implementation_plan.md](file:///C:/Users/lenovo/.gemini/antigravity/brain/a8d2f40f-f8a9-4871-b646-43729de264b0/implementation_plan.md)
*   **Original Walkthrough Location:** [walkthrough.md](file:///C:/Users/lenovo/.gemini/antigravity/brain/a8d2f40f-f8a9-4871-b646-43729de264b0/walkthrough.md)
*   **Goal:** Replace the automatic pick booking with an interactive "Selection Phase" returning the top 3 ranked professionals for user selection.
*   **Modifications:**
    *   **`ranking_agent.py`:** Removed automatic assignment of `selected_provider_id`, only populates scores and sorting.
    *   **`intent_agent.py`:** Parses user choice (e.g. *"Book the first one"*, *"Ali"*).
    *   **`orchestrator.py`:** If `selected_provider_id` is missing post-ranking, formatting list, sets `requires_clarification = True`, and halts. On follow-up match, bypasses discovery and runs booking.
    *   **Verification Script:** Created and executed `test_selection.py` confirming dual-turn transaction (service request -> provider option list -> option pick -> confirmation).
