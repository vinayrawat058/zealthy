# Zealthy — Patient Portal & Mini EMR

Full-stack take-home exercise: a **Patient Portal** for patients and a **Mini EMR** for doctors/staff.

| Layer | Stack | Local URL |
|-------|--------|-----------|
| Frontend | React + Vite | http://127.0.0.1:5173 |
| Backend | Flask + SQLite | http://127.0.0.1:5000 |

Seed data comes from the provided [`data.json`](https://gist.github.com/sbraford/73f63d75bb995b6597754c1707e40cc2) (copied into `backend/data/data.json`).

---

## Features

### Patient Portal (`/`)
- Login with email + password (patients only)
- Dashboard summary: basic info, appointments in the **next 7 days**, refills in the **next 7 days**
- Drill-down: full appointment schedule up to **3 months**
- Drill-down: all prescriptions + refill schedule up to **3 months**
- No public signup — accounts are created by doctors in the EMR

### Mini EMR / Doctor Portal (`/admin`)
- **Requires doctor login** (not open to the public)
- Patient list at a glance
- Create / read / update patients (including password for portal access)
- Full CRUD for appointments (provider, date/time, repeat, end recurring with `ends_on`)
- Full CRUD for prescriptions (medication, dosage, quantity, refill date, refill schedule)
- Medication and dosage dropdowns seeded from `data.json`
- Doctors cannot be registered publicly — only patient accounts can be created from the EMR

---

## Demo credentials

### Patients (seeded)

| Name | Email | Password |
|------|-------|----------|
| Mark Johnson | `mark@some-email-provider.net` | `Password123!` |
| Lisa Smith | `lisa@some-email-provider.net` | `Password123!` |

### Admin / Doctor login

**Email:** `doctor@zealthy.com`  
**Password:** `Doctor123!`

Use the **Doctor login** link on the main page, or go to `/admin/login`.

> These three accounts are seeded automatically when the database is first created (or after `zealthy.db` is deleted and the backend is restarted).

---

## Project structure

```
zealthy/
├── backend/          # Flask API + SQLite
│   ├── app/
│   ├── data/data.json
│   ├── requirements.txt
│   └── run.py
├── frontend/         # React (Vite) UI
│   ├── src/
│   └── package.json
└── README.md
```

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** and npm
- Two terminals (backend + frontend)

---

## Backend setup (Flask)

```bash
cd backend
python -m venv .venv
```

**Windows**

```powershell
.\.venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

**macOS / Linux**

```bash
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

- API: **http://127.0.0.1:5000**
- Health check: http://127.0.0.1:5000/api/health
- On first start: creates `zealthy.db`, seeds Mark + Lisa + doctor, and loads medications/dosages

### Backend dependencies

Installed via `backend/requirements.txt`:

- Flask  
- Flask-SQLAlchemy  
- Flask-CORS  
- Flask-JWT-Extended  
- python-dateutil  
- gunicorn (for deployment)

### Useful environment variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `JWT_SECRET_KEY` | Signs JWT tokens | Dev secret (change in production) |
| `DATABASE_URL` | Database URL | Local SQLite file `zealthy.db` |

---

## Frontend setup (React)

Keep the backend running on port **5000**, then:

```bash
cd frontend
npm install
npm run dev
```

- App: **http://127.0.0.1:5173**
- Vite proxies `/api` → `http://127.0.0.1:5000` (no CORS hassle in local dev)

### Frontend dependencies

- React 19  
- React Router  
- Vite  

### Main frontend routes

| Path | Description |
|------|-------------|
| `/` | Patient login |
| `/portal` | Patient 7-day summary |
| `/portal/appointments` | Appointments (up to 3 months) |
| `/portal/prescriptions` | Prescriptions + refill schedule |
| `/admin/login` | **Doctor / admin login** |
| `/admin` | Mini EMR patient list |
| `/admin/patients/new` | Register a new patient (staff only) |
| `/admin/patients/:id` | Patient detail + appointments/prescriptions CRUD |

---

## How to try the app locally

1. Start **backend** (`python run.py`) → port 5000  
2. Start **frontend** (`npm run dev`) → port 5173  
3. Open http://127.0.0.1:5173  
4. Sign in as a **patient** (Mark or Lisa), or click **Doctor login** and use the **admin credentials above**  
5. As a doctor: open a patient, manage appointments/prescriptions, or create a new patient  

---

## API overview

### Public / shared
- `GET /api/health`
- `GET /api/medications`
- `GET /api/dosages`

### Patient auth & portal
- `POST /api/auth/login` — patients only  
- `POST /api/auth/register` — **disabled** (403); use EMR to create patients  
- `GET /api/portal/me` — Bearer token; 7-day summary  
- `GET /api/portal/appointments` — up to 3 months  
- `GET /api/portal/prescriptions` — up to 3 months  

### Doctor auth & EMR (doctor JWT required)
- `POST /api/auth/admin/login` — doctors only  
- `GET|POST /api/admin/patients`  
- `GET|PUT /api/admin/patients/<id>`  
- `GET|POST /api/admin/patients/<id>/appointments`  
- `PUT|DELETE /api/admin/appointments/<id>`  
- `GET|POST /api/admin/patients/<id>/prescriptions`  
- `PUT|DELETE /api/admin/prescriptions/<id>`  

---

## Security notes

- Patient and doctor logins are **separate** endpoints and roles  
- Patients cannot access `/api/admin/*`  
- Doctors cannot sign in through the patient portal  
- New patient accounts can only be created by a logged-in doctor  
- There is **no public doctor registration**

---

## Submission checklist

- [ ] GitHub repository URL  
- [ ] Live demo URL (Netlify/Vercel frontend)  
- [ ] **Admin login:** `doctor@zealthy.com` / `Doctor123!`  
- [ ] Patient samples: Mark & Lisa (passwords above)  
