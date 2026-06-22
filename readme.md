# Interview AI — Full‑Stack Interview Preparation Platform

Interview AI is a full‑stack application that helps users practice coding and interview questions and receive automated feedback. It combines a Node.js/Express backend, MongoDB persistence, and a React (Vite) frontend, with AI integrations for question generation and scoring.

**Key Highlights**

- **Full‑stack MERN architecture:** Backend with Node.js, Express and Mongoose; frontend built with React and Vite.
- **AI-driven features:** Integrated with modern generative AI APIs to generate questions, evaluate responses, and provide feedback.
- **Authentication & security:** JWT‑based authentication, password hashing with `bcryptjs`, and secure environment configuration via `dotenv`.
- **File handling & parsing:** File upload support with `multer` and PDF parsing using `pdf-parse` for interview reports and artifacts.
- **Robust API design:** Modular route structure (`/api/auth`, `/api/interview`) and validation using `zod` where applicable.
- **Practical tooling:** Development scripts (`dev`), environment variable management, and a `.npmrc` tweak to avoid large Puppeteer downloads in dev environments.

**Technologies**

- Backend: `Node.js`, `Express`, `Mongoose` (MongoDB)
- Frontend: `React`, `Vite`
- Auth & Security: `jsonwebtoken`, `bcryptjs`
- AI & NLP: `@google/genai` (or configurable provider), optional `OPENROUTER` support
- Utilities: `multer`, `pdf-parse`, `cookie-parser`, `cors`, `dotenv`, `zod`

**Repository structure (high level)**

- `backend/` — Node.js API, models, controllers, routes, config
- `frontend/` — React app (Vite) with contexts, hooks, pages and services

Getting started

1. Install requirements

```bash
# backend
cd backend
npm install

# frontend
cd ../frontend
npm install
```

2. Create a `.env` file in `backend/` with the following variables (use your secure values):

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_GENAI_API_KEY=your_google_genai_key_or_leave_empty
OPENROUTER_API_KEY=your_openrouter_key_or_leave_empty
```

3. Run the apps

```bash
# start backend
cd backend
npm run dev

# start frontend
cd ../frontend
npm run dev
```

API overview (examples)

- `POST /api/auth/register` — Register user (email + password)
- `POST /api/auth/login` — Login and receive JWT
- `GET /api/interview/questions` — Fetch or generate interview questions (AI)
- `POST /api/interview/submit` — Submit answers or files for evaluation

Notes and troubleshooting

- Puppeteer: the project previously attempted to download a Chromium binary during `npm install`. To avoid that in development, `.npmrc` is set to skip automatic browser downloads. If you need Puppeteer for browser automation, remove the `.npmrc` setting and ensure sufficient disk space and network access.
- Security: Do not commit `.env` or API keys to source control. Use environment management for production (secrets manager or CI variables).

How this is resume‑worthy (bullet points you can use)

- Implemented a full‑stack interview prep app using Node.js, Express, MongoDB, and React (Vite).
- Integrated generative AI APIs to dynamically generate interview questions and evaluate responses.
- Built JWT authentication with role awareness and secure password hashing (`bcryptjs`).
- Implemented file upload and PDF parsing for interview reports using `multer` and `pdf-parse`.
- Designed and documented RESTful APIs and modular controller/service architecture for maintainability.
- Hardened developer experience by handling large dependency downloads (Puppeteer) and applying `npm audit fix`.

Contributing

- Fork the repo, create a feature branch, and open a pull request. Add clear PR descriptions and include tests for new features.

License

- MIT

---

This README was updated to provide a clear project summary, setup instructions, and resume‑ready highlights. See the backend and frontend folders for implementation details.
