# 🚀 Full-Stack Web Application

> A robust, monolithic full-stack application featuring a React-based frontend and an Express/Node.js backend with advanced rate limiting and native routing.

## 🏗️ Architecture & DevOps

* **Monolithic Containerization:** Deployed via a multi-stage `Dockerfile` where the Vite React UI is compiled and served directly from the Express backend's `public/` folder on a single port.
* **Docker Orchestration:** Utilizes `docker-compose.yml` to run the application, assuming PostgreSQL and Redis are hosted directly on the host machine via `host.docker.internal` binding.
* **Safe Database Migrations:** Database migrations are executed as a separate, one-off process using a specific Docker Compose profile (`--profile migrate`) to prevent execution conflicts.

---

## ⚙️ Backend System

### Tech Stack
* **Core:** Node.js (TypeScript), Express.js.
* **Database & Cache:** PostgreSQL via Prisma ORM, Redis.
* **Validation & Logging:** Zod, Pino.

### Key Features
* **Dual-Token Authentication:** Manages sessions using a short-lived JWT Access Token (10 minutes) embedded in headers, alongside a Refresh Token stored securely in an `http-only` cookie and Redis.
* **Smart Rate Limiting:** Employs a custom Redis-based middleware that penalizes successful requests (HTTP 200-299) by consuming more quota to prevent malicious action spamming.
* **Minimalist Error Handling:** A centralized error handler strictly returns HTTP status codes without bodies, except for `400 Bad Request` errors which include specific JSON payloads.
* **Structured Logging:** Integrates `pino` for high-performance, structured JSON logging in production, with `pino-pretty` formatting for development environments.
* **API Modules:** Segregated into Auth flows (`/api/auth`) for login/registration/recovery, and User flows (`/api/users`) for profile modifications and account deletion.

---

## 🖥️ Frontend System

### Tech Stack
* **Core:** React 19 (TypeScript), Vite.
* **Styling & Icons:** Tailwind CSS v4, Lucide React.
* **Localization:** i18next.

### Key Features
* **Zero-Dependency Routing:** Relies entirely on vanilla native browser APIs (capturing `popstate` events and `window.location.pathname`) instead of heavy external libraries like React Router.
* **Dynamic API Message Mapping:** Utilizes `apiMessages.ts` to translate raw backend HTTP status codes into user-friendly feedback strings across all application flows.
* **Modular Components:** Structured by feature domains, including Landing/Navbar interfaces, an AuthModal for authentication flows, a Dashboard for profile management, and dedicated Verification/Reset pages triggered via email links.