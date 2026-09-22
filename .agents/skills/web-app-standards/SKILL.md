---
name: web-app-standards
description: >-
  Engineering standards, architecture rules, Google OAuth + Supabase Auth patterns,
  Vercel Monorepo deployment guidelines, fixed port allocation table, mock seed data scripts,
  and clean DB reset workflows for all web applications developed by johnnyhoang.
---

# Web Application Engineering Standards & Architecture Guide (Release-Ready for johnnyhoang)

This skill provides the mandatory architectural patterns, security standards, local development configurations, and deployment guidelines for all web applications in the workspace ecosystem.

---

## 🔑 1. Google OAuth & Supabase Auth Integration

### Authentication Architecture
- **Auth Broker:** Dùng Supabase Auth (`@supabase/supabase-js`) cho Google Login với `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`. Frontend apps không bao giờ lưu trữ hoặc xử lý mật khẩu thô.
- **Provider Setup:**
  - Google Cloud Console: OAuth 2.0 Web Client ID.
  - Authorized Redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
- **Frontend Integration Pattern:**
  - Client Instance: Dùng `@supabase/supabase-js` khởi tạo `supabaseClient` với `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`.
  - Sign-in call:
    ```typescript
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    ```
  - State Listener: Use `supabase.auth.onAuthStateChange((_event, session) => ...)` to reactively update user session.

### Row Level Security (RLS) & Access Control
- Every table containing user data MUST have Row Level Security enabled (`ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`).
- Standard Policy Patterns:
  ```sql
  -- User owns row
  CREATE POLICY "Users manage own data" ON <table>
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  -- Public read, authenticated write
  CREATE POLICY "Public read" ON <table> FOR SELECT USING (true);
  CREATE POLICY "Auth write" ON <table> FOR INSERT WITH CHECK (auth.role() = 'authenticated');

  -- Admin role check
  CREATE POLICY "Admin full access" ON <table> FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
  ```

### Mandatory Project Table Prefix Convention
When multiple web applications share a single Supabase PostgreSQL Database, **EVERY CREATED TABLE MUST HAVE A PROJECT PREFIX** to prevent naming collisions across applications.

| Project Name | Prefix | Example Table Names |
|:---|:---|:---|
| **Token Wallet** | `tkw_` | `tkw_app_projects`, `tkw_user_permissions` |
| **Family Management** | `fml_` | `fml_members`, `fml_transactions`, `fml_tasks` |
| **BETH (Quant Bot)** | `beth_` | `beth_trades`, `beth_bot_config`, `beth_signals` |
| **LnD Portal** | `lnd_` | `lnd_employees`, `lnd_courses`, `lnd_learning_progress` |
| **AdmissionDecisionEngine** | `ade_` | `ade_schools`, `ade_score_cutoffs` |
| **gameEngG10** | `g10_` | `g10_students`, `g10_quizzes` |
| **coffee_shop_24hxh** | `coffee_` | `coffee_products`, `coffee_orders` |
| **qlhs_dtnt** | `dtnt_` | `dtnt_students`, `dtnt_evaluations` |
| **MOM Health** | `mh_` | `mh_menstrual_cycles`, `mh_daily_logs`, `mh_app_settings` |

---

## 🚀 2. Monorepo Architecture & Vercel Deployment

### Directory Layout
```text
my-monorepo/
├── apps/
│   ├── web/          ← Frontend (React / Vite / Next.js)
│   │   ├── package.json
│   │   └── src/
│   └── api/          ← Backend Serverless API (Express / NestJS)
│       ├── package.json
│       └── src/
├── packages/
│   └── shared/       ← Shared DTOs, types, constants
│       └── package.json
├── package.json      ← Root workspace configuration
└── turbo.json        ← Turborepo pipeline configuration
```

### Vercel Deployment Rules
- Each application inside `apps/` MUST be created as its own Vercel Project.
- **Root Directory:** Set explicitly to `apps/web` or `apps/api` in Vercel Project Settings.
- **Frontend Environment Variables:** Use `VITE_` prefix (Vite) or `NEXT_PUBLIC_` (Next.js) for browser exposure.
- **Serverless API Config (`apps/api/vercel.json`):**
  ```json
  {
    "version": 2,
    "builds": [{ "src": "dist/main.js", "use": "@vercel/node" }],
    "routes": [{ "src": "/(.*)", "dest": "dist/main.js" }]
  }
  ```
- **Custom Domain:** Configure CNAME `cname.vercel-dns.com` for production domains (e.g. `family.minkoi.org`).

---

## 🔌 3. Fixed Local Port Allocation Table (Non-Docker)

To prevent port conflicts, broken OAuth callbacks, and CORS errors when running multiple local applications simultaneously without Docker, strictly adhere to the fixed port allocation table below:

| Application Name | App Path | Frontend Local URL | Backend API Local URL | Config Method |
|:---|:---|:---|:---|:---|
| **Token Wallet** | `TokenWalet` | `http://localhost:5173` | N/A (Frontend Only) | `vite.config.ts` (`strictPort: true`) |
| **Family Management** | `family` | `http://localhost:5174` | `http://localhost:5001` | Vite Monorepo + Express |
| **BETH (Quant Bot)** | `BETH` | `http://localhost:5175` | `http://localhost:5002` | `package.json` (`next dev -p 5175`) |
| **gameEngG10** | `gameEngG10` | `http://localhost:5176` | `http://localhost:5003` | `vite.config.ts` (`strictPort: true`) |
| **AdmissionDecisionEngine** | `AdmissionDecisionEngine` | `http://localhost:5177` | `http://localhost:5004` | Vite + NestJS |
| **coffee_shop_24hxh** | `coffee24h` / `coffee_shop_24hxh` | `http://localhost:5178` | `http://localhost:5005` | Vite + NestJS |
| **qlhs_dtnt** | `dtnt` | `http://localhost:5179` | `http://localhost:5006` | `vite.config.js` (`strictPort: true`) |
| **gous** | `gous` | `http://localhost:5180` | `http://localhost:5007` | Vite + Express |
| **MOM Health** | `benh` | `http://localhost:5181` | N/A (Frontend Only) | `vite.config.ts` (`strictPort: true`) |

### Enforcement in Vite (`vite.config.ts`)
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true, // Throws an error immediately if port is in use instead of auto-incrementing
  },
});
```

---

## 🔄 4. Multi-App Auth Isolation & Redirect Prevention

### Cause of Misdirection
When multiple apps share one Supabase Auth instance, Supabase falls back to the default **Site URL** if `redirectTo` is missing or the target domain is omitted from the Redirect URLs Whitelist.

### Prevention Protocol
1. **Whitelist All Sub-App Redirect URLs:**
   In Supabase Dashboard → Auth → URL Configuration → Redirect URLs, register all sub-app domains and local ports:
   ```text
   https://family.minkoi.org/**
   https://token-wallet-chi.vercel.app/**
   http://localhost:5173/**
   http://localhost:5174/**
   http://localhost:5175/**
   http://localhost:5176/**
   http://localhost:5177/**
   http://localhost:5178/**
   http://localhost:5179/**
   http://localhost:5180/**
   ```
2. **Explicit Frontend `redirectTo`:**
   Always specify `redirectTo: \`${window.location.origin}/\`` during `signInWithOAuth` calls.

---

## 💻 5. Local Development with Remote Supabase Cloud DB

### Configuration Pattern
- Place `.env.local` files in local project roots (never check `.env.local` into Git).
- Frontend variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Backend CORS setup for local Express/NestJS APIs:
  ```typescript
  import cors from 'cors';

  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'https://family.minkoi.org',
  ];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS'));
      }
    },
    credentials: true,
  }));
  ```

---

## 🎲 6. Mock Seed Data Generator Requirements

Every management system or data-driven application MUST include an automated mock data generator script (`scripts/seed-mock-data.ts`).

### Example (L&D Portal Domain):
- **Employees:** Seed 30–50 employees with Names, Emails, Roles, Departments.
- **Courses & Lectures:** Seed mandatory and elective course catalogues with materials.
- **Learning Progress & Logs:** Seed progress percentages, quiz scores, certificates, and activity logs to feed monitoring dashboards with realistic telemetry.

### Seed Script Pattern (`scripts/seed-mock-data.ts`):
```typescript
import { supabase } from '../src/utils/supabaseClient';

async function seedMockData() {
  console.log('🌱 Seeding mock data...');

  const employees = Array.from({ length: 30 }, (_, i) => ({
    id: `emp-${i + 1}`,
    full_name: `Employee ${i + 1}`,
    email: `emp${i + 1}@company.com`,
    department: ['Engineering', 'Product', 'HR'][i % 3],
  }));
  await supabase.from('employees').upsert(employees);

  console.log('✅ Seeding complete!');
}

seedMockData().catch(console.error);
```

### Package.json Commands:
```json
"scripts": {
  "db:seed": "tsx scripts/seed-mock-data.ts"
}
```

---

## 🧹 7. Clean DB & Reset Scripts for Fresh Deployment

Every application MUST provide an automated database wipe/clean script (`scripts/clean-db.ts`) to return the database to a Zero-Data state for fresh deployment or handoff.

### Clean Script Pattern (`scripts/clean-db.ts`):
```typescript
import { supabase } from '../src/utils/supabaseClient';

async function cleanDatabase() {
  console.log('🧹 Cleaning Database for Fresh Deployment...');

  // Delete records in reverse order of foreign key dependencies
  await supabase.from('learning_progress').delete().neq('id', 'non_existent');
  await supabase.from('courses').delete().neq('id', 'non_existent');
  await supabase.from('employees').delete().neq('id', 'non_existent');

  console.log('✨ Database reset complete. Ready for Fresh Deployment!');
}

cleanDatabase().catch(console.error);
```

### Package.json Script Suite:
```json
"scripts": {
  "db:seed": "tsx scripts/seed-mock-data.ts",
  "db:clean": "tsx scripts/clean-db.ts",
  "db:reset": "npm run db:clean && npm run db:seed"
}
```

---

## 🎨 9. Frontend UI Refactor & Design Standards (`frontend-design`)

When refactoring UI for production applications using the `frontend-design` skill:

- **Zero Behavior Change:** NEVER alter business logic, API contracts, routes, state management, or existing operational behavior. No fake demo screens.
- **Pre-Refactor Analysis:**
  1. Inspect existing frontend structure, design tokens, shared components, typography, and colors.
  2. Identify "AI-generated UI" anti-patterns: generic uniform card radii, excessive gradients, gratuitous glassmorphism, repetitive card-grid layouts, cluttered icons/badges, weak typography hierarchy, and arbitrary spacing.
  3. Summarize issues briefly and propose 2 distinct design directions aligned with product purpose. Pick the most rationale-driven approach before modifying code.
- **Execution Rules:**
  - Preserve brand identity, core content, and valid design tokens.
  - **Mandatory Logo & Favicon:** Every Web or App MUST have a unique, custom-designed Logo and Favicon (default Vite/React/Next.js/HTML favicons strictly forbidden).
  - Establish strong visual hierarchy with purposeful typography, spacing, and layout choices.
  - Avoid AI aesthetic tropes (excessive gradients, glassmorphism, "AI purple", default Inter/Arial fonts, unnecessary card grids, decorative icons/animations).
  - Design rhythm, clear empty/loading/error states, responsive grid breakpoints, and full accessibility (contrast, hover/focus states).

---

## 📋 10. Comprehensive AI Verification Checklist

When auditing or reviewing code for any project in `D:\Hoa Hoang\Apps`, verify compliance against this checklist:

- [ ] **Google OAuth & Supabase Auth:** Dùng Supabase Auth (`@supabase/supabase-js`) cho Google Login với `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`, provider configured, `signInWithOAuth` uses `window.location.origin`, RLS active on user tables.
- [ ] **Monorepo & Vercel:** Correct Root Directory set per Vercel Project, frontend env vars use `VITE_` / `NEXT_PUBLIC_`.
- [ ] **Fixed Local Ports:** Port assigned from allocation table with `strictPort: true` in `vite.config.ts` or `-p <port>` in Next.js.
- [ ] **Auth Isolation:** Sub-app origin registered in Supabase Auth Whitelist, `redirectTo` explicitly passed.
- [ ] **Local Dev:** `.env.local` configured for remote Supabase DB, Express/NestJS CORS allows local frontend origins.
- [ ] **Mock Data Generator:** `scripts/seed-mock-data.ts` present, seeds realistic domain records, runnable via `npm run db:seed`.
- [ ] **Clean & Reset Scripts:** `scripts/clean-db.ts` present, deletes data in correct foreign-key reverse order, runnable via `npm run db:clean` / `npm run db:reset`.
- [ ] **Code Quality:** TypeScript strict mode enabled, `type-only imports` used for types under `verbatimModuleSyntax`.
- [ ] **Logo & Favicon:** Every Web/App MUST have a unique, custom-designed Logo and Favicon (default framework favicons forbidden).
- [ ] **Frontend Design (Skill frontend-design):** Business logic & API contract preserved 100%, AI-generated UI tropes eliminated, strong typography & visual hierarchy established, responsive & accessible states verified.


