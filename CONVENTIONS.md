# AI Agent Coding Conventions

This document contains the strict and absolute rules for writing, refactoring, and debugging code in this repository. You, the AI Agent, MUST treat these conventions as absolute law. Do not deviate, do not suggest "better" design patterns, and do not introduce new paradigms. Your sole purpose is to replicate the human author's exact coding style and architecture.

## 0. BASELINE & SOURCE OF TRUTH
- **Read the Root Codebase**: The actual, live boilerplate code is located directly within this workspace/root directory. 
- **Mandatory Reference**: Before generating, changing, or debugging any code, you MUST inspect the existing files in the root folder to understand the precise implementation, spacing, error handling, and file relationships. The surrounding codebase is your ultimate source of truth—replicate its patterns with 100% fidelity.

## 1. TECH STACK & DEPENDENCIES LIMITATION
- **Backend**: Node.js, Express, TypeScript, Prisma (PostgreSQL), Zod, Pino, Redis, Nodemailer, bcrypt, jsonwebtoken.
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, i18next, lucide-react.
- **STRICT RULE**: **DO NOT** install, suggest, or add any new packages, libraries, or frameworks. Use ONLY the existing dependencies to solve problems.

## 2. FILE & DIRECTORY NAMING CONVENTIONS
- **Backend Files**: Use `kebab-case` with specific type suffixes:
  - Controllers: `[feature].controller.ts`
  - Models: `[feature].model.ts`
  - Routes: `[feature].route.ts`
  - Schemas: `[feature].schema.ts`
  - Utilities/Helpers/Libs/Middlewares: `[name].util.ts`, `[name].helper.ts`, `[name].lib.ts`, `[name].middleware.ts`
- **Frontend Files**:
  - React Components: `PascalCase.tsx` (e.g., `HeroSection.tsx`, `AuthModal.tsx`).
  - Hooks: `camelCase.ts` prefixed with `use` (e.g., `useLanding.ts`).
  - Utilities/Helpers: `camelCase.ts` (e.g., `fetcher.ts`, `apiMessages.ts`).

## 3. ARCHITECTURE & "CLEAN CODE" DEFINITION
In this project, "clean code" is explicitly defined by the following architectural separation. Do not introduce generic repositories, enterprise classes, or OOP-heavy design patterns.

### Backend Layer Separation
1.  **Routes**: Only define HTTP methods, apply middlewares (rate limiters, validators, auth), and bind to controllers.
2.  **Controllers**: Extract validated data (`req.validated.body/query/params`), call models/helpers, format responses, and log actions. 
    * *Pattern*: Controllers are exported as plain objects containing handler functions wrapped in type-safe handlers (`typedHandler` or `authTypedHandler`).
3.  **Models**: The ONLY place where database interactions (`prisma`) occur.
    * *Pattern*: Models are exported as plain objects containing async functions.
4.  **Schemas**: Zod objects strictly separated by `body`, `params`, and `query`.

### Frontend Architecture
1.  **UI Components**: Keep them presentational. Extensive logic MUST be extracted.
2.  **Custom Hooks (`hooks/`)**: Store state management, form handling, and business logic inside custom hooks. Components call these hooks and consume the returned state/handlers.
3.  **API Client (`utils/api.ts`)**: All backend calls are centralized in an object mapping (`api.[feature].[action]`). Components NEVER use `fetch` directly.

## 4. SYNTAX & CODING STYLE
- **Exports**: Heavily prefer **Named Exports** (`export const ...`, `export function ...`). Use Default Exports ONLY for top-level React page components or specific configuration files.
- **Grouping Logic**: Group related functions into single exported objects rather than exporting multiple standalone functions from a file. 
  * *Example*: `export const featureModel = { getById: async () => {}, update: async () => {} }`
- **Function Arguments (Destructuring)**: Always use object destructuring for functions with arguments, and define inline types for them.
  * *Correct*: `const update = async ({ id, name }: { id: number, name: string }) => { ... }`
  * *Incorrect*: `const update = async (id: number, name: string) => { ... }`
- **Async/Await**: Use extensively. Avoid `.then().catch()` chains unless handling highly specific edge cases (like silent Redis failures).
- **TypeScript**: Keep types pragmatic. Use inline types for simple payloads, and infer types where possible.

## 5. CONSTANTS & STATIC TEMPLATES
If a new static block (like an email template, error message map, or config object) needs to be created:
- **COPY AND PASTE** the exact structural format of existing templates found in the root files.
- HTML email templates use template literals with inline CSS. Do not extract to external template engines.
- System constants and validation numbers are stored in `UPPER_SNAKE_CASE` objects (e.g., `VALIDATION.USER.MAX_USERNAME`).
- API message handlers use manual status code checks (`if (status === 200) return "..."`). Copy this exact `if/return` structure without trying to "optimize" it into a switch statement or dictionary lookup unless it already is one.

## 6. STRICT BEHAVIORAL GUIDELINES

### ANTI-SMART-OPTIMIZATION
- **DO NOT** attempt to refactor working logic based on "efficiency theories" or theoretical "best practices" if it deviates from the established codebase style.
- Conformity to my existing patterns is strictly prioritized over "perfect" or "alien" code. If I write something a certain way, YOU write it that way.

### 100% STYLE REPLICATION
- Emulate the exact syntax, spacing, error handling, and file structure found in the context.
- If a method works and fits my pattern, use it. Do not introduce new abstractions (no Classes, no OOP patterns, no factory functions unless explicitly present).

### NO AI COMMENTS
- **DO NOT** insert automated or self-referential comments (e.g., `// Added by AI`, `// New logic for X`, `// Refactored`). 
- Write code as if I typed it myself. Only use comments if explaining complex business logic, exactly as a human would.

### DIRECT DEBUGGING ONLY
- Fix bugs directly inline within the source files.
- **DO NOT** create external testing scripts, scratchpads, or standalone runner files to "test" your logic. 
- Apply fixes directly to the Controller, Model, Hook, or Component where the bug resides.