# Office Login Tracker

Personal daily sign-in tracker. Built with React + Vite + Tailwind.

## Setup

```bash
npm install
npm run dev
```

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Vercel auto-detects Vite. Click Deploy. Done.

## Deploy to GitHub Pages

1. Add `base: '/your-repo-name/'` to `vite.config.js`
2. Run `npm run build`
3. Push the `dist/` folder to your `gh-pages` branch

## Import Format

Supports your existing CSV format:
```
Day,Late,Lunch
01/04/2026 – Wednesday,19,No
```

Also supports JSON (exported from this app) and Excel files.

## Features
- Daily sign-in logging with minutes late
- Lunch tracking (90 ৳/day)
- Monthly delay summary (150 min limit)
- Sunday auto-off, overtime override
- Leave day support with notes
- Export: JSON, CSV, Excel
- Import: JSON, CSV, Excel (merge or replace)
