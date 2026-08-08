# Project Structure

## Root
```
OfficeTracker/
├─ .env.local
├─ .env.production
├─ .gitignore
├─ .next/
├─ node_modules/
├─ src/
│  ├─ app/                 # Next.js App Router pages
│  ├─ components/         # Reusable UI components
│  │  ├─ ui/              # Shared UI primitives
│  │  └─ Sidebar/         # Sidebar related components
│  ├─ lib/                # Utility modules
│  │  ├─ auth.ts          # NextAuth wrappers
│  │  ├─ settings.ts      # Default and env settings
│  │  ├─ roles.ts         # Role definitions
│  │  ├─ audit.ts         # Audit logging helpers
│  │  ├─ admin.ts         # Admin utilities
│  │  └─ mongodb.ts       # MongoDB client wrapper
│  ├─ models/             # Domain models (TS files)
│  │  ├─ User.ts
│  │  ├─ WorkspaceItem.ts
│  │  ├─ Notification.ts
│  │  ├─ Note.ts
│  │  ├─ Entry.ts
│  │  ├─ AuditLog.ts
│  │  └─ ApprovalRequest.ts
├─ scripts/
│  └─ next-build-shim.cjs
├─ types/                # Type declarations
│  ├─ next-auth.d.ts
│  ├─ imagetracerjs.d.ts
│  └─ index.ts
├─ tailwind.config.ts
├─ postcss.config.mjs
├─ next.config.mjs
├─ package.json
├─ tsconfig.json
└─ README.md
```

## Key Directories

* **src/app** – Next.js App Router structure (page, layout, API routes).
* **src/components** – React component library.
* **src/lib** – Utilities for auth, database, settings, role management, audit logging and admin tasks.
* **src/models** – TypeScript interfaces/models for app data.
* **node_modules** – npm dependencies.
* **.next** – Build output.

## Workflow Overview

1. **Development**
   * Run `npm run dev` to start the Vercel‑friendly dev server on `http://localhost:3000`.
   * Changes in `src/` trigger hot‑reloading.

2. **Auth**
   * NextAuth is configured in `src/lib/auth.ts`.
   * Providers (Google, Email, etc.) are defined in `src/lib/auth.ts`.
   * Middleware (`middleware.ts`) protects routes that require authentication.

3. **Database**
   * Prisma schema (`prisma/schema.prisma`) defines data model.
   * `src/lib/mongodb.ts` contains a wrapper for MongoDB interactions.
   * Migrations are run with `npx prisma migrate dev`.

4. **API**
   * Endpoints are located under `src/app/api/*` following the App Router pattern.
   * Uses the Prisma client to read/write data.

5. **UI**
   * TailwindCSS is configured in `tailwind.config.ts`.
   * Global styles are imported in `src/app/globals.css`.

6. **Testing**
   * Jest/Playwright tests are in `tests/`.
   * Run `npm test` or `npx playwright test`.

7. **Build & Deploy**
   * Build: `npm run build` → generates `.next`.
   * Deploy to Vercel or any Netlify‑compatible host.

8. **Continuous Integration**
   * GitHub Actions in `.github/workflows/` run lint, type‑check, unit tests and build.

---
*This file provides a quick navigation reference; refer to the README for detailed setup instructions.*
