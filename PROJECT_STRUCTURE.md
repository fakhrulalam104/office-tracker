# OfficeTracker Project Structure

## High‑level layout

```
📦 OfficeTracker
├── public/                     # Static assets (images, icons, etc.)
├── src/                        # Application source
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Homepage / entry point
│   │   └── api/                # API routes
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # UI primitives (Navbar, Alert, …)
│   │   └── Sidebar/            # Sidebar specific components
│   ├── lib/                    # Helper libraries
│   │   ├── auth.ts             # Auth utilities (Next‑Auth wrappers, JWT, …)
│   │   ├── audit.ts            # Audit logging helpers
│   │   ├── mongodb.ts          # MongoDB client wrapper
│   │   ├── roles.ts            # Role based access helpers
│   │   ├── settings.ts         # Default settings and env helpers
│   │   └── require‑auth.ts     # Auth guard hooks
│   ├── models/                 # Prisma data models / TS interfaces
│   │   ├── User.ts
│   │   ├── WorkspaceItem.ts
│   │   ├── Notification.ts
│   │   └── …
│   ├── middleware.ts           # Next.js middleware for auth, redirects, etc.
│   ├── next.config.mjs         # Next.js configuration
│   └── types/                   # Type declarations for custom libs
│       ├── next‑auth.d.ts
│       ├── imagetracerjs.d.ts
│       └── index.ts
├── prisma/                      # Prisma schema and migrations
│   ├── schema.prisma
│   └── migrations/
├── scripts/                     # Helper scripts
│   └── next-build-shim.cjs
├── .env.*                        # Environment variables
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## Core Workflow

1. **Development** – Run `npm run dev` or `pnpm dev`. Next.js serves the app on `localhost:3000`. Built‑in Vite/ESBuild compiles TS/JS.
2. **Auth** – Next‑Auth (JWT + Google provider). Sign‑in redirects to `/api/auth/signin`. Middleware enforces protected routes.
3. **Data** – Prisma connects to MongoDB. Models defined in `prisma/schema.prisma`. Data access via `client/*.ts` wrapper.
4. **UI** – Uses TailwindCSS utilities, all components in `src/components`. Layout defined in `app/layout.tsx`; pages under `app/page.tsx`.
5. **Deployment** – `npm run build` → `.next` folder. Cloud runtime (Vercel / Netlify) serves the compiled output.

Feel free to tailor details or request more granular documentation for any sub‑directory.
