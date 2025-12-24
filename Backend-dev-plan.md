# Backend Development Plan: Multiomic Data Orchestrator (MDO)

## 1️⃣ Executive Summary
- **Goal:** Build a robust, scalable backend for the Multiomic Data Orchestrator (MDO) to support multi-file CSV ingestion, mapping, validation, and export.
- **Stack:** FastAPI (Python 3.13), MongoDB Atlas (Motor/Pydantic v2).
- **Constraints:** No Docker, single-branch (`main`) workflow, manual testing per task, synchronous background tasks by default.
- **Strategy:** 8 Dynamic Sprints (S0-S7) to deliver a fully functional MVP aligned with the frontend.

## 2️⃣ In-Scope & Success Criteria
- **In-Scope Features:**
  - User Authentication (Signup, Login, Logout) with JWT.
  - Template Management (Read-only API, Seeded via JSON to match frontend mocks).
  - Run Management (Create, List, Details).
  - CSV File Upload (GridFS in Atlas) & Parsing.
  - Column-to-Field Mapping (Storage & Retrieval).
  - Validation Engine (Field, Row, Table, Relationship rules).
  - Export Generation (Canonical CSVs, Join Index, JSON Manifest, ZIP).
  - Dashboard Statistics & Audit Trail.
- **Success Criteria:**
  - All frontend flows (Upload → Map → Validate → Export) function without errors.
  - Validation engine correctly identifies and aggregates blockers/warnings.
  - Export bundle contains all required artifacts.
  - All task-level manual tests pass via the provided React frontend.
  - Code pushed to `main` after each sprint.

## 3️⃣ API Design
- **Base Path:** `/api/v1`
- **Error Format:** `{ "error": "Detailed error message" }`
- **Endpoints:**
  - **Auth:** `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`
  - **Health:** `GET /healthz` (DB ping)
  - **Templates:** `GET /templates`, `GET /templates/{id}`
  - **Runs:** 
    - `POST /runs` (Create)
    - `GET /runs` (List)
    - `GET /runs/{id}` (Details)
    - `DELETE /runs/{id}` (Delete)
  - **Files:**
    - `POST /runs/{id}/upload` (Multipart CSV)
    - `DELETE /runs/{id}/files/{file_id}`
    - `GET /runs/{id}/columns` (Extract headers)
  - **Mapping:** `PUT /runs/{id}/mapping` (Save configuration)
  - **Validation:** `POST /runs/{id}/validate` (Trigger engine)
  - **Export:** `GET /runs/{id}/export` (Download ZIP)
  - **Dashboard:** `GET /dashboard/stats`
  - **Audit:** `GET /audit`

## 4️⃣ Data Model (MongoDB Atlas)
- **collections:**
  - **users**
    - `email` (string, unique), `password_hash` (string), `full_name` (string)
    - Example: `{ "email": "scientist@lab.org", "password_hash": "$argon2..." }`
  - **templates**
    - `name` (string), `version` (string), `fields` (list), `rules` (list), `categories` (list)
    - Example: `{ "name": "Illumina NGS", "version": "1.0", "fields": [...] }`
  - **runs**
    - `user_id` (ObjectId), `status` (enum: active, completed), `files` (list embedded), `mappings` (object), `validation_summary` (object)
    - Example: `{ "status": "active", "files": [{ "file_id": "...", "filename": "samples.csv" }] }`
  - **audit_logs**
    - `user_id` (ObjectId), `action` (string), `timestamp` (datetime), `details` (object)
    - Example: `{ "action": "RUN_CREATED", "timestamp": "2025-12-24T10:00:00Z" }`
  - **fs.files / fs.chunks** (GridFS)
    - Stores raw CSV content.

## 5️⃣ Frontend Audit & Feature Map
- **Index / Landing**
  - **Purpose:** Public landing page.
  - **Auth:** Public.
- **DashboardPage** (`/dashboard`)
  - **Purpose:** Overview of activity.
  - **Data:** Stats (total runs, issues), Recent runs.
  - **Endpoint:** `GET /api/v1/dashboard/stats`
- **RunsPage** (`/runs`)
  - **Purpose:** List and manage runs.
  - **Data:** List of runs with status.
  - **Endpoint:** `GET /api/v1/runs`
- **TemplatesPage** (`/templates`)
  - **Purpose:** Browse available templates.
  - **Data:** List of templates.
  - **Endpoint:** `GET /api/v1/templates`
- **MappingPage** (`/runs/:id/map`)
  - **Purpose:** Map CSV columns to canonical fields.
  - **Data:** Template fields, CSV headers, Saved mappings.
  - **Endpoints:** `GET /runs/{id}`, `GET /templates/{id}`, `GET /runs/{id}/columns`, `PUT /runs/{id}/mapping`
- **ValidationPage** (`/runs/:id/validate`)
  - **Purpose:** View validation results.
  - **Data:** Validation issues (blockers, warnings).
  - **Endpoints:** `POST /runs/{id}/validate`
- **ExportPage** (`/runs/:id/export`)
  - **Purpose:** Download final artifacts.
  - **Data:** Export status/readiness.
  - **Endpoint:** `GET /runs/{id}/export`

## 6️⃣ Configuration & ENV Vars
- `APP_ENV`: "development"
- `PORT`: "8000"
- `MONGODB_URI`: "mongodb+srv://..."
- `DB_NAME`: "mdo_db"
- `JWT_SECRET`: "your-secret-key"
- `JWT_EXPIRES_IN`: "86400" (24h)
- `CORS_ORIGINS`: "http://localhost:5173"

## 7️⃣ Background Work
- **CSV Parsing:** Synchronous (using Pandas or standard csv lib) for MVP.
- **Validation:** Synchronous rule execution.
- **Export:** Synchronous ZIP generation.

## 8️⃣ Integrations
- **MongoDB Atlas:** Primary database.
- **GridFS:** Storage for uploaded CSV files.

## 9️⃣ Testing Strategy
- **Manual Validation:**
  - Execute backend task.
  - Perform "Manual Test Step" in frontend.
  - Verify result matches "User Test Prompt".
- **Regression:**
  - Ensure previous flows (e.g., Auth) remain functional before pushing.

## 🔟 Dynamic Sprint Plan & Backlog

### 🧱 S0 – Environment Setup & Frontend Connection
- **Objectives:** Verify FastAPI setup, DB connection, and Frontend proxy/CORS.
- **User Stories:**
  - As a developer, I want the backend to be reachable by the frontend.
- **Tasks:**
  - Ensure `main.py`, `config.py` are correct and running.
    - *Manual Test Step:* Run backend, check `http://localhost:8000/api/v1/healthz`.
    - *User Test Prompt:* "Verify the health endpoint returns 'ok' and DB is connected."
  - Configure CORS for frontend URL.
    - *Manual Test Step:* Open frontend, check console for CORS errors.
    - *User Test Prompt:* "Inspect console to confirm no CORS blocks."
  - **Post-sprint:** Commit and push to `main`.

### 🧩 S1 – Basic Auth (Signup / Login / Logout)
- **Objectives:** Secure the app with JWT.
- **User Stories:**
  - As a user, I can sign up, log in, and log out.
- **Tasks:**
  - Review `User` model and `auth` router.
    - *Manual Test Step:* Check `backend/models/user.py`.
    - *User Test Prompt:* "Confirm User model structure."
  - Finalize `POST /signup` and `POST /login`.
    - *Manual Test Step:* Signup via UI, then Login. Verify redirection to Dashboard.
    - *User Test Prompt:* "Create account and login; confirm dashboard access."
  - Implement `POST /logout`.
    - *Manual Test Step:* Click Logout, verify token clear and redirect to login.
    - *User Test Prompt:* "Logout and verify you cannot access protected pages."
  - **Post-sprint:** Commit and push to `main`.

### 🧩 S2 – Template Management (Seed & Read)
- **Objectives:** Populate DB with templates from JSON.
- **User Stories:**
  - As a user, I can select from standard templates (Illumina, 10x, Spatial).
- **Tasks:**
  - Create `seed_templates.py` with JSON data matching `RunContext` (Illumina NGS v1, 10x Single-Cell v1, GeoMx Spatial v1).
    - *Manual Test Step:* Run seed script, check MongoDB.
    - *User Test Prompt:* "Run seed script and verify 'templates' collection has documents."
  - Implement `GET /templates` and `GET /templates/{id}`.
    - *Manual Test Step:* Navigate to Templates page in UI.
    - *User Test Prompt:* "Check that templates are listed on the Templates page."
  - **Post-sprint:** Commit and push to `main`.

### 🧩 S3 – Runs & File Upload (GridFS)
- **Objectives:** Enable run creation and CSV storage.
- **User Stories:**
  - As a user, I can start a run and upload CSV files.
- **Tasks:**
  - Create `Run` model and `runs` router.
    - *Manual Test Step:* Verify code structure.
    - *User Test Prompt:* "Check Run model definition."
  - Implement `POST /runs` (Create Run).
    - *Manual Test Step:* Click "New Run" in UI.
    - *User Test Prompt:* "Create a new run and verify it appears in the Runs list."
  - Implement `POST /runs/{id}/upload` using GridFS.
    - *Manual Test Step:* Drag & Drop CSV, check success status.
    - *User Test Prompt:* "Upload a CSV and verify it is listed in the UI."
  - Implement `DELETE /runs/{id}/files/{file_id}`.
    - *Manual Test Step:* Delete a file in UI.
    - *User Test Prompt:* "Delete an uploaded file and confirm removal."
  - **Post-sprint:** Commit and push to `main`.

### 🧩 S4 – Mapping Logic
- **Objectives:** Map uploaded columns to template fields.
- **User Stories:**
  - As a user, I can map my CSV headers to the canonical schema.
- **Tasks:**
  - Implement `GET /runs/{id}/columns` (Parse CSV from GridFS).
    - *Manual Test Step:* Go to Map step, check dropdowns have CSV headers.
    - *User Test Prompt:* "Verify CSV headers are available in mapping dropdowns."
  - Implement `PUT /runs/{id}/mapping` to save configuration.
    - *Manual Test Step:* Save mapping, reload page to verify persistence.
    - *User Test Prompt:* "Save a mapping, refresh, and confirm selections persist."
  - **Post-sprint:** Commit and push to `main`.

### 🧩 S5 – Validation Engine
- **Objectives:** Core business logic for data quality.
- **User Stories:**
  - As a user, I want to see validation errors before exporting.
- **Tasks:**
  - Build Validation Service (Required fields, Duplicates, Regex).
    - *Manual Test Step:* Unit test a simple rule (e.g., regex).
    - *User Test Prompt:* "Verify validation logic on a test string."
  - Implement `POST /runs/{id}/validate`.
    - *Manual Test Step:* Click "Validate", see Results table.
    - *User Test Prompt:* "Run validation and check if issues appear in the results."
  - **Post-sprint:** Commit and push to `main`.

### 🧩 S6 – Export & Download
- **Objectives:** Generate final output bundle.
- **User Stories:**
  - As a user, I can download the harmonized data.
- **Tasks:**
  - Implement Artifact Generator (Canonical CSVs, Join Index).
    - *Manual Test Step:* Verify generated CSV content matches mapping.
    - *User Test Prompt:* "Check generated CSVs against source data."
  - Implement `GET /runs/{id}/export` (ZIP download).
    - *Manual Test Step:* Click Download, extract ZIP, check contents.
    - *User Test Prompt:* "Download ZIP and verify all artifacts are present."
  - **Post-sprint:** Commit and push to `main`.

### 🧩 S7 – Dashboard & Audit
- **Objectives:** Polish and visibility.
- **User Stories:**
  - As a user, I can track my activity.
- **Tasks:**
  - Implement `GET /dashboard/stats` and `GET /audit`.
    - *Manual Test Step:* Check Dashboard and Audit pages.
    - *User Test Prompt:* "Verify dashboard stats and audit logs are accurate."
  - **Post-sprint:** Commit and push to `main`.
