# token_wallet 🪙

> Ultra-minimalist quota tracker & recovery countdown dashboard for AI developer tools (Claude Code, GitHub Copilot, Gemini/AntiGravity).

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Sync-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Tested_with-Vitest-6E9F18?style=for-the-badge&logo=vitest)](https://vitest.dev/)

## What is it?

AI coding tools limit how much you can use them, then reset your quota after a few hours. When you juggle several accounts, it is hard to remember which one is ready and when the others come back.

**token_wallet** keeps that in one place: a dark, minimal dashboard where every account has a running countdown, and accounts recover automatically when the clock hits zero.

## Features

- **Per-tool account lists** for Claude Code, GitHub Copilot/Codex and Gemini/AntiGravity, sorted alphabetically.
- **Automatic rollover**: when a reset time passes, an exhausted account becomes active again and its reset time is pushed forward in 5-hour steps until it is in the future, even if the app was closed for days.
- **Reset time independent of status**: every account always has a countdown running.
- **Natural time input**: type `3h 18m` or `25m` and see a live preview such as "Resets Today at 3:01 PM".
- **Visual reset bar**: 8 slots per account, yellow for hours (up to 5) and orange for days (up to 3).
- **Global status banner**: shows how many accounts are ready for work, or when the earliest one will be.
- **Cloud sync** with Supabase and login-protected routes.
- **Extra pages**: app wallet, payment schedule, notes, code experience and user management.

See [CORE_SPECS.md](CORE_SPECS.md) for the full behavior rules and UI specs.

## 1-Minute Quickstart

```bash
# 1. Clone repo
git clone https://github.com/minkoi007cs/token_wallet.git
cd token_wallet

# 2. Install and configure
npm install
cp .env.example .env

# 3. Run the dev server with HMR
npm run dev
# -> http://localhost:5173
```

Open `.env` and fill in your own Supabase project values:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Create the database tables by running [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Lint with Oxlint |
| `npm test` | Run unit tests with Vitest |

## Project structure

```text
src/
  components/   UI pieces (AccountCard, Modal, Toolbar, ...)
  contexts/     Auth context
  data/         Supabase mappers and sync logic
  pages/        TokenWallet, AppWallet, PaymentSchedule, Notes, ...
  utils/        Time parsing, health, ids, Supabase client
supabase/       Database schema
```

## Deploy

The project includes a `vercel.json`, so you can import the repo into [Vercel](https://vercel.com/) and add the two `VITE_SUPABASE_*` environment variables.

## Tech stack

React 19, TypeScript, Vite, React Router, Supabase, Vitest, Oxlint.
