# JanSamadhan: AI-Powered Public Grievance Triage

> Citizens file complaints by text or voice. AI classifies and routes them to the right government department, flags duplicates, and tracks deadlines. Missed deadlines escalate automatically.

LIVE DEMO LINK : https://jansamadhan-mu.vercel.app

---

## The problem

Public grievance portals often fail in the same ways:

- Complaints land in a generic inbox and sit there until someone manually sorts them.
- The same pothole gets reported fifty times, and each report is handled separately.
- Nobody notices when a deadline is missed, and citizens never find out what happened.

JanSamadhan automates the sorting, spots duplicates, enforces deadlines, and keeps a tamper-resistant record of every action.

## Features

### Citizens
- Register and log in (JWT in httpOnly cookies)
- 3-step complaint wizard with category picker, **voice input** (English, Hindi, Kannada) and up to 3 photos
- Live status timeline for every complaint, including the officer's notes
- Search, filter and paginate their own complaints
- Real-time notifications (Socket.io) plus a notification centre

### Department officers
- A queue limited to **their own department's** complaints
- Filters for status, priority and overdue complaints
- Controlled workflow: submitted → assigned → in progress → resolved or rejected
- A note is mandatory when resolving or rejecting, and the citizen sees it
- AI summary and duplicate warning on each complaint

### Admins
- Analytics dashboard: 14-day trend, status split, complaints by category and department, SLA compliance, average resolution time
- Create officers from a form, choose their department, edit roles, deactivate accounts
- Manage departments: SLA hours, categories handled, active status
- Audit log of every complaint action and every admin action

### Platform
- Light and dark mode, responsive layout, skeleton loaders and toasts
- Citizen and Staff login portals, with the server enforcing which accounts may use which

## How the AI pipeline works

When a complaint is submitted, the server runs these steps. If the AI service is unavailable, the complaint is still saved and only the smart steps are skipped.

1. **Classification:** an LLM (Google Gemini) reads the title and description and returns a priority, a one-line summary and a confidence score. The complaint text is treated strictly as data, never as instructions.
2. **Routing:** the citizen's category maps to a department. If they chose "Other", the AI's suggested category is used instead.
3. **SLA deadline:** the department's resolution time is applied. Urgent complaints get half the time and high-priority ones get 75%.
4. **Duplicate detection:** the text is converted to an embedding vector and compared by cosine similarity with open complaints in the same category, from the last 30 days and in the same city. A score of 0.85 or higher flags a possible duplicate for the officer.
5. **Escalation:** a cron job runs every 5 minutes. Past the deadline, a complaint escalates to **Level 1** (department head alerted). 24 hours later it escalates to **Level 2** (administrators alerted, priority raised to urgent).

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS, React Router, Recharts, Lucide icons |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| Real-time | Socket.io |
| AI | Google Gemini (classification and embeddings) |
| Media | Cloudinary, Multer |
| Jobs | node-cron |
| Hosting | Vercel (frontend), Render (backend), MongoDB Atlas |

## Architecture

```
 Browser (React) ──────────────────────────────┐
   │  /api/*  (same-origin via Vercel rewrite) │ WebSocket (short-lived token)
   ▼                                           ▼
 Vercel  ──── proxy ───►  Render: Node + Express + Socket.io
                            │      │         │          │
                            │      │         │          └─► Cloudinary (images)
                            │      │         └────────────► Gemini API (AI)
                            │      └──────────────────────► node-cron (SLA checks)
                            ▼
                       MongoDB Atlas
```

**Why the proxy?** The site and API live on different domains, and several browsers block cross-site cookies. Vercel forwards `/api` calls to Render, so the browser only ever talks to one origin and login cookies work everywhere.

### Complaint workflow

```
submitted ──► assigned ──► in_progress ──► resolved
    │             │              │
    └─────────────┴──────────────┴──────► rejected
```

Illegal jumps (for example submitted → resolved) are rejected by the server.

## Security decisions

- Passwords hashed with bcrypt; sessions in httpOnly cookies
- **Staff cannot self-register.** Public signup always creates a citizen, and the `@jansamadhan.in` domain is reserved
- The super admin is created once from environment variables, so no password lives in the code
- Admin-created staff must set their own password on first login, and the server blocks every other request until they do
- Role checks on every protected route, and officers can only read their own department's complaints
- Login portal enforcement: staff accounts cannot log in through the citizen tab and vice versa
- Image uploads limited by type and size
- Every status change and admin action is written to an append-only audit trail
- WebSocket connections authenticate with a 2-minute token and join a private room per user

## Project structure

```
jansamadhan/
├── client/                 # React app
│   └── src/
│       ├── components/     # Layout, Modal, Timeline, badges, route guard
│       ├── context/        # Auth, Theme, Notification providers
│       ├── pages/          # Citizen, officer and admin screens
│       └── utils/          # API client, constants
└── server/
    ├── config/             # Database connection
    ├── controllers/        # Auth, complaints, officer, admin, notifications
    ├── jobs/               # SLA escalation scheduler
    ├── middleware/         # Auth, roles, uploads
    ├── models/             # User, Complaint, Department, Notification, AuditLog
    ├── routes/
    ├── seed/               # Departments and first-admin scripts
    └── utils/              # AI client, Cloudinary, Socket.io, notifications
```

## Run it locally

**Requirements:** Node.js 18+, a MongoDB Atlas cluster, a Cloudinary account and a Gemini API key.

```bash
git clone https://github.com/YOUR-USERNAME/jansamadhan.git
cd jansamadhan
```

**1. Backend**

```bash
cd server
npm install
cp .env.example .env      # then fill in your values
node seed/seedDepartments.js
node seed/createAdmin.js
npm run dev
```

**2. Frontend** (in a second terminal)

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` and `/socket.io` to port 5000.

### Environment variables (`server/.env`)

| Variable | Purpose |
|---|---|
| `PORT` | Server port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string for signing tokens |
| `CLIENT_URL` | Frontend origin, for CORS (http://localhost:5173 locally) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Image storage |
| `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_EMBED_MODEL` | AI classification and embeddings |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | Used only by `seed/createAdmin.js` |

## Deployment

- **Frontend:** Vercel, root directory `client`. `vercel.json` proxies `/api` to the backend. Set `VITE_SOCKET_URL` to the backend URL.
- **Backend:** Render web service, root directory `server`, build `npm install`, start `npm start`.
- **Database:** MongoDB Atlas.

## Limitations and future work

Being upfront about what this version does not do yet:

- Resolution deadlines come from each department's configured SLA. There is no machine-learning model predicting resolution time yet.
- Notifications are in-app only. Email and SMS delivery are not implemented, and the notification preference toggles are stored in the browser for now.
- The free hosting tier sleeps when idle, so the first request after a quiet period can take up to a minute.
- Location is entered as text. Map-based pinning and geo-clustering of complaints are planned.
- No automated test suite yet. API and integration tests are the next step.

## Author

**SAKSHI B H**, final-year Computer Science student
[LinkedIn](https://www.linkedin.com/in/sakshi-b-h-a0b9bb2ba/) · [GitHub](https://github.com/saakshibh)

## License

MIT
