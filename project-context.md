# Project Context

## Tech Stack & Architecture

### 1. Backend Architecture & Key Features
- **Tech Stack**: Node.js (TypeScript), Express.js, Prisma ORM (PostgreSQL), Redis, Zod (Validation).
- **Session & Cookie Management**:
  - Uses a combination of a **Refresh Token** (stored in Redis and sent as an `http-only`, `secure`, `sameSite` Cookie).
  - Uses a short-lived **Access Token (JWT)** (10 minutes) sent to the Frontend and embedded in the `Authorization: Bearer <token>` header.
- **Rate Limiting**: Custom Redis-based middleware (`rl`) that limits specific requests per endpoint. It features a penalty mechanism that consumes more hit quota specifically for successful requests (status 200-299) to prevent spamming successful actions.
- **Global Routing & Error Handling**: All APIs run under the `/api/` base path. Errors are caught globally via a *centralized error handler* (`error-handler.middleware.ts`). Generally, this backend only returns an **HTTP Status Code** (e.g., `200 OK` without a body), **except** for `400 Bad Request` errors which return a specific message payload (e.g., `{ "error": "wrong password" }`).

### 2. Frontend Architecture & Key Features
- **Tech Stack**: React 19 (TS), Vite, Tailwind CSS v4, Lucide React, i18next (Localization).
- **Routing**: Uses Vanilla Routing (Native browser API) by capturing `popstate` events and `window.location.pathname` managed globally in `App.tsx`. Does not use external libraries like React Router.
- **State Management**: Uses *Custom Hooks* (`useAuth.ts`, `useLanding.ts`, etc.) and the *Prop Drilling* pattern for short component hierarchies. Does not use a *global state manager* like Redux or Zustand.
- **Theming**: Dark Mode/Light Mode is managed at the global root level (`App.tsx`) using `localStorage` detection and browser system preferences.

## Backend API List

*Note: All Auth APIs run under `/api/auth` and User APIs under `/api/users`. Input validation details are handled via Zod schemas, and error responses are managed globally. This documentation only lists Success scenarios.*

### Auth Module (`/api/auth`)
1. **`POST /register`**
   - **Input**: `username`, `password`
   - **Response**: Returns `accessToken`. Sets `refreshToken` Cookie.
2. **`POST /login`**
   - **Input**: `identifier` (username/email), `password`
   - **Response**: Returns `accessToken`. Sets `refreshToken` Cookie.
3. **`POST /logout`**
   - **Input**: Requires `refreshToken` Cookie.
   - **Response**: Clears `refreshToken` Cookie.
4. **`POST /refresh`**
   - **Input**: Requires `refreshToken` Cookie.
   - **Response**: Returns `accessToken`.
5. **`POST /verify-email/:token`**
   - **Input**: `token` (URL Param)
6. **`POST /forgot-password`**
   - **Action**: Sends an email containing a *reset password* link.
   - **Input**: `email`
7. **`POST /reset-password/:token`**
   - **Input**: `token` (URL Param), `password` (Body)

### User Profile Module (`/api/users`)
*Note: All endpoints here require the `accessToken` Header (Bearer).*

1. **`GET /me`**
   - **Response**: Returns Profile Object (`id`, `username`, `email`, etc.)
2. **`PATCH /me/username`**
   - **Input**: `username`
3. **`PATCH /me/email`**
   - **Action**: Requests an email change and automatically sends a verification email to the new address.
   - **Input**: `email`
4. **`PATCH /me/password`**
   - **Action**: Changes the *password* after validating the old *password*.
   - **Input**: `oldPassword`, `newPassword`
5. **`DELETE /me`**
   - **Action**: Permanently deletes the account and its relational data.
   - **Input**: `username` (as confirmation)

## Frontend Component Breakdown

*Components are mapped by Feature Domains, complete with their functionalities and data flow.*

### 1. Landing & Public (`LandingPage.tsx`, `Navbar.tsx`)
- **Features**: Toggles Light/Dark mode, triggers the Auth Modal, and displays the Hero Section.
- **Data Displayed**: *Project* Name, *loading* status when checking authentication.

### 2. Authentication (`AuthModal.tsx`)
- **Features**: User authentication, new account registration, *reset password* email request, and navigation between forms (switching forms).
- **Data Displayed**: Success/error messages (feedback) after *submit*.
- **Data Inputs**:
  - **Login**: `Identifier` (username/email), `Password`.
  - **Register**: `Identifier/Username`, `Password`, `Confirm Password`.
  - **Forgot Password**: `Email`.

### 3. Dashboard (`Dashboard.tsx`)
- **Features**: Views profile details, updates email address, and Logout.
- **Data Displayed**: `Username`, `Email` (or 'Not Set' if not available).
- **Data Inputs**:
  - **Update Email**: `newEmail`.

### 4. Verification & Reset Flow (`VerifyEmail.tsx`, `ResetPassword.tsx`)
*Special pages accessed via links sent to email.*
- **Features**:
  - `VerifyEmail`: Automatically validates the URL token for email verification.
  - `ResetPassword`: Allows the user to enter a new password if the URL token is valid.
- **Data Displayed**: *Loading* Indicator (Spinner), Success/Error indicator (Token validation failed/expired).
- **Data Inputs**:
  - **Verify Email**: No manual input (Token from URL).
  - **Reset Password**: `Password`, `Confirm Password`.

## API Message Mapping Implementation
The frontend uses `apiMessages.ts` to map responses from the backend (which are mostly *HTTP Status Codes* without a *body*) into user-readable *feedback* messages.

### 1. Common Error Handler (`handleCommonMessages`)
Handles global *status codes* applicable to all *requests*:
- `0`: Connection failed.
- `>= 500`: Internal server error.
- `429`: Too many requests
- `403`: Forbidden.
- `400`: Invalid data/Bad Request (Will extract JSON from the *body* to get detailed error messages, using a default message if it fails).

### 2. Endpoint-Specific Mapping
Specific messages handling response codes from each module:
- **Auth Flow**:
  - `login`: `200` (Success), `401`/`404` (Incorrect credentials).
  - `register`: `200`/`201` (Success), `409` (Username is already taken).
  - `forgotPassword`: `200` (Link sent), `404` (Email address not found).
  - `resetPassword`: `200` (Success), `401`/`404` (Link invalid/expired).
  - `verifyEmail`: `200` (Success), `400`/`404` (Link invalid/expired).
- **User Flow**:
  - `getMe`: `200` (Welcome message), `401`/`404` (Profile not found / session expired).
  - `updateEmail`: `200` (Link sent), `409` (Email is already registered).
  - `deleteMe`: `200`/`204` (Success), `400` (Invalid username confirmation).

## DevOps & Deployment Architecture

- **Containerization**: Monolithic via *multi-stage* `Dockerfile`. Stage 1 (Node 20) compiles the Vite UI, Stage 2 (Node 22) copies the UI *build* results to the Backend Express `public/` folder so it can be served together on a single *port*.
- **Orchestration (`docker-compose.yml`)**: Reads `.env` to run the application container (and optionally Caddy). Assumes PostgreSQL & Redis are running directly on the *host* machine via the `host.docker.internal:host-gateway` *binding*.
- **Database Migration**: Runs separately as a *one-off* to prevent conflicts, executed via *compose profile*:
  `docker compose -f docker-compose.dev.yml --profile migrate up` (reads `.env.migrate` configuration).
