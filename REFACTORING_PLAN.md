# TokenWalet — Refactoring Execution Plan

> **Audience:** AntiGravity (GA), executing autonomously.
> **Author:** repository inspection, 2026-09-22.
> **Baseline commit:** `1ded1bd` — *refactor(utils): add characterization tests and optimize parser performance*
> **Status:** not started.

---

## 0. How to use this document

Work **top to bottom**. Tasks are numbered `T<phase>.<n>`. Each task is a **single commit** and is independently revertable.

Do not start a task until the previous one is committed and the gate below is green:

```bash
npm run test && npx tsc -b && npm run lint && npm run build
```

If a task cannot be completed as written — the code no longer matches the quoted snippet, a test cannot be made to pass, a step turns out to be wrong — **stop, do not improvise a workaround, and report which task and which step**. A half-applied task in this codebase means data loss.

**Line numbers are as of `1ded1bd`.** If they have drifted, locate the target by the quoted code snippet, which is authoritative.

---

## 1. Ground rules

1. **One task, one commit.** Never batch tasks. The revert story depends on it.
2. **Tag before each phase:** `git tag pre-phase-N` before the first task in a phase. That tag is the rollback point.
3. **Never weaken a check to get to green.** No `@ts-ignore`, no `oxlint-disable`, no `it.skip`, no deleting an assertion. If a test fails, the code is wrong, not the test.
4. **Write the failing test first** where the task says so. Several tasks fix bugs that are currently invisible to the suite; the test must fail before the fix and pass after. Record both results in the commit body.
5. **No new runtime dependencies** unless a task explicitly authorizes one. Dev dependencies only where named.
6. **No behaviour changes beyond the task.** Do not "tidy while you're in there" — that destroys the revert story. Unrelated cleanup goes in Phase 5 or not at all.
7. **Do not touch `src/index.css` before Phase 5.**
8. **Preserve all Vietnamese UI strings verbatim.** They are product copy, not placeholders.
9. Commit messages follow the existing convention: `type(scope): imperative summary`. Body explains *why* and records the verification result.

---

## 2. Baseline — verified, do not re-litigate

| Check | Result |
|---|---|
| `npm run test` | 22 passed, 2 files (`timeParser`, `paymentParser`) |
| `npx tsc -b` | clean |
| `npm run lint` | 4 warnings (see below), 0 errors |
| `npm run build` | 644 KB JS (single chunk), 41 KB CSS |

Known lint warnings at baseline — **do not fix opportunistically**, they are assigned to tasks:
- `SettingsModal.tsx:4` only-export-components → T5.1
- `AppWallet.tsx:539` exhaustive-deps → T3.2
- `AuthContext.tsx:77` unused catch param → T0.3
- `AuthContext.tsx:159` only-export-components → leave; `useAuth` next to the provider is intentional

**Test environment note:** vitest runs in the **node** environment. There is no `jsdom`, no `happy-dom`, no `@testing-library/react`, and no vitest config file. Phases 0–3 are therefore designed so that **every new test is a pure-function test needing no DOM**. Only T4.4 adds DOM test tooling, and it is optional.

---

## 3. Task index

| ID | Task | Risk | Blocking |
|---|---|---|---|
| **Phase 0** | **Security & schema baseline** | | |
| T0.1 | Untrack `.env`, rotate anon key | low | yes |
| T0.2 | Write real schema + RLS for all six tables | medium | yes |
| T0.3 | Stop the client assigning its own role | low | yes |
| **Phase 1** | **Stop data loss** | | |
| T1.1 | Safe id generation (`src/utils/ids.ts`) | low | yes |
| T1.2 | Delete every blind-delete sync path | medium | yes |
| T1.3 | Guard sync behind a real load outcome | medium | yes |
| T1.4 | Explicit deletes at the point of deletion | medium | yes |
| **Phase 2** | **Extract the data layer** | | |
| T2.1 | Pure row mappers + round-trip tests | low | no |
| T2.2 | Pure sync-policy module + tests | low | no |
| T2.3 | Migrate PaymentSchedule onto the data layer | medium | no |
| T2.4 | Migrate TokenWallet | medium | no |
| T2.5 | Migrate AppWallet | medium | no |
| **Phase 3** | **AppWallet correctness** | | |
| T3.1 | DB authoritative; seed only when empty | medium | no |
| T3.2 | Collapse the health checker; stop auto-running it | low | no |
| **Phase 4** | **Rendering performance** | | |
| T4.1 | Fix the 1s interval teardown | medium | no |
| T4.2 | Split rollover from the display tick | medium | no |
| T4.3 | Extract + memoize `AccountCard` / `ResetBar` | medium | no |
| T4.4 | Route-level code splitting | low | no |
| **Phase 5** | **Shared UI** | | |
| T5.1 | `<Modal>` primitive | low | no |
| T5.2 | `<Toolbar>` (search + filters + sort) | medium | no |
| T5.3 | Icon module | low | no |
| T5.4 | Inline styles → CSS | low | no |

**If time is short, Phase 0 and Phase 1 are the whole job.** Everything after is debt reduction; those two are live data-loss and privilege-escalation paths.

---

# Phase 0 — Security & schema baseline

```bash
git tag pre-phase-0
```

Nothing in Phase 0 changes application behaviour for a correctly-provisioned user. It closes the holes that make every later phase unsafe to deploy.

> **⚠️ Steps marked `[HUMAN]` cannot be done by GA.** Stop and hand them to the repository owner. Do not proceed past a `[HUMAN]` step in the same task until it is confirmed done.

---

## T0.1 — Untrack `.env` and rotate the anon key

**Why.** `.env` is tracked in git (introduced in `8680d6e`) and `.gitignore` only covers `*.local`. The Supabase URL and anon key are in the repository history. On their own the anon key is meant to be public — but combined with the open `USING (true)` policy shipped in `supabase_schema.sql:35`, the repo hands any reader a writable production database.

**Files.** `.gitignore`, `.env` (untrack only), new `.env.example`, `README.md`

**Steps.**
1. Append to `.gitignore`:
   ```
   # Local environment
   .env
   .env.*
   !.env.example
   ```
2. `git rm --cached .env` — **do not delete the file from disk**, local dev needs it.
3. Create `.env.example` with the keys and no values:
   ```
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   ```
4. Add an `## Environment` section to `README.md`: copy `.env.example` to `.env`, fill from the Supabase dashboard.
5. `[HUMAN]` Rotate the anon key in the Supabase dashboard; update the local `.env` and the Vercel project env vars. The old key is in git history and must be assumed compromised.

**Tests.** None — infrastructure.

**Verify.** `git status` shows `.env` as untracked. `npm run dev` still boots (the file is still on disk).

**Accept.** `git ls-files --error-unmatch .env` exits non-zero.

**Rollback.** `git revert` the commit; `.env` returns to the index. History is not rewritten — the key rotation in step 5 is the real remediation, not the untracking.

**Commit.** `chore(security): untrack .env and document required environment`

---

## T0.2 — Real schema and RLS for all six tables

**Why.** The application reads and writes six tables:

```
tkw_ai_tools             tkw_ai_accounts          tkw_app_projects
tkw_app_backlog_items    tkw_payment_schedules    tkw_user_permissions
```

`supabase_schema.sql` defines **one** of them, with a policy that grants everything to anon:

```sql
CREATE POLICY "Allow all for anon on tkw_payment_schedules"
ON public.tkw_payment_schedules FOR ALL USING (true) WITH CHECK (true);
```

The other five have no DDL and no reviewable policy in the repository at all — that schema exists only in production, where nobody can review it. This also contradicts the project's own standard in `.agents/skills/web-app-standards/SKILL.md`, which requires RLS on every table containing user data.

**Access model — read this before writing any SQL.** These tables hold **shared workspace data with role-based access**, *not* per-user data. Do **not** add `user_id` to the data tables and do **not** write `auth.uid() = user_id` policies on them: that would partition the workspace per user and make the owner's payment schedules invisible to everyone else. That is a product change, not a refactor. The rules the application actually implements are:

| Table | Read | Write |
|---|---|---|
| `tkw_app_projects`, `tkw_app_backlog_items` | **anon + authenticated** (the App Wallet is the public index route — `src/App.tsx:17`) | `can_edit_app_wallet` |
| `tkw_ai_tools`, `tkw_ai_accounts` | `can_read_token_wallet` | `can_edit_token_wallet` |
| `tkw_payment_schedules` | `can_read_payments` | `can_edit_payments` |
| `tkw_user_permissions` | own row, or any row if admin | admin only; self-insert allowed but forced to zero privileges |

**Files.** Replace `supabase_schema.sql` with `supabase/schema.sql`, as one idempotent, re-runnable script.

**Steps.**

1. Create `supabase/schema.sql`. Move the existing `tkw_payment_schedules` DDL across unchanged, then add DDL for the other five. Column names must match the mappers exactly — derive them from the code, not from memory:
   - `tkw_ai_tools` ← `src/pages/TokenWallet.tsx:397`
   - `tkw_ai_accounts` ← `src/pages/TokenWallet.tsx:402-415`
   - `tkw_app_projects` ← `src/pages/AppWallet.tsx:654-668` — note the TS field is `frontendUrl` but the column is **`url`**
   - `tkw_app_backlog_items` ← `src/pages/AppWallet.tsx:675-687`
   - `tkw_user_permissions` ← `src/pages/UserManagement.tsx:6-18`

   Every permission column must be declared `BOOLEAN NOT NULL DEFAULT false`, and `role TEXT NOT NULL DEFAULT 'user'`. T0.3 depends on those defaults.

2. Add a privilege helper. It must be `SECURITY DEFINER` so that policies consulting `tkw_user_permissions` do not recurse into that table's own RLS:

   ```sql
   CREATE OR REPLACE FUNCTION public.tkw_perm(flag text)
   RETURNS boolean
   LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
   AS $fn$
     SELECT COALESCE((
       SELECT CASE flag
         WHEN 'can_read_token_wallet' THEN p.can_read_token_wallet
         WHEN 'can_edit_token_wallet' THEN p.can_edit_token_wallet
         WHEN 'can_read_payments'     THEN p.can_read_payments
         WHEN 'can_edit_payments'     THEN p.can_edit_payments
         WHEN 'can_read_app_wallet'   THEN p.can_read_app_wallet
         WHEN 'can_edit_app_wallet'   THEN p.can_edit_app_wallet
         WHEN 'is_admin'              THEN (p.role = 'admin')
         ELSE false
       END
       FROM public.tkw_user_permissions p
       WHERE p.user_id = auth.uid()
     ), false);
   $fn$;
   ```

3. **Drop the open policy** and write per-table policies matching the table above. Pattern, per data table:

   ```sql
   DROP POLICY IF EXISTS "Allow all for anon on tkw_payment_schedules"
     ON public.tkw_payment_schedules;

   ALTER TABLE public.tkw_payment_schedules ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "read payments" ON public.tkw_payment_schedules
     FOR SELECT USING (public.tkw_perm('can_read_payments'));

   CREATE POLICY "write payments" ON public.tkw_payment_schedules
     FOR ALL USING (public.tkw_perm('can_edit_payments'))
              WITH CHECK (public.tkw_perm('can_edit_payments'));
   ```

   For the two App Wallet tables the SELECT policy is `USING (true)` — public read is intentional there and only there.

4. `tkw_user_permissions` needs its own shape. Self-registration is allowed but **cannot grant anything**; this is what closes the escalation hole:

   ```sql
   CREATE POLICY "read own or admin" ON public.tkw_user_permissions
     FOR SELECT USING (user_id = auth.uid() OR public.tkw_perm('is_admin'));

   CREATE POLICY "self register unprivileged" ON public.tkw_user_permissions
     FOR INSERT WITH CHECK (
       user_id = auth.uid()
       AND role = 'user'
       AND can_read_token_wallet = false AND can_edit_token_wallet = false
       AND can_read_payments     = false AND can_edit_payments     = false
       AND can_edit_app_wallet   = false
     );

   CREATE POLICY "admin manages permissions" ON public.tkw_user_permissions
     FOR UPDATE USING (public.tkw_perm('is_admin'))
                WITH CHECK (public.tkw_perm('is_admin'));
   ```

5. Add a commented bootstrap block at the end. The **first** admin cannot be created through the app, because no admin exists to grant it:

   ```sql
   -- Bootstrap: run once, manually, in the Supabase SQL editor.
   -- INSERT INTO public.tkw_user_permissions
   --   (user_id, email, role, can_read_token_wallet, can_edit_token_wallet,
   --    can_read_payments, can_edit_payments, can_read_app_wallet, can_edit_app_wallet)
   -- SELECT id, email, 'admin', true, true, true, true, true, true
   --   FROM auth.users WHERE email = '<owner email>'
   -- ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
   ```

6. Delete `supabase_schema.sql`.

7. `[HUMAN]` Apply `supabase/schema.sql` to the Supabase project and run the bootstrap block for the owner account.

**Tests.** None automated — there is no DB test harness in this project and adding one is out of scope for this plan.

**Verify.** `[HUMAN]`, after step 7:
- Owner account: all four tabs load and save.
- A second Google account with no permission row: App Wallet loads; Token Wallet and Payments show the permission wall; `supabase.from('tkw_payment_schedules').select('*')` in the console returns zero rows.
- That same account running `supabase.from('tkw_user_permissions').update({role:'admin'}).eq('user_id', <own id>)` is **rejected**.
- Signed out entirely: the App Wallet still renders projects.

**Accept.** All four points pass, and `grep -rn "USING (true)" supabase/` matches only the two App Wallet SELECT policies.

**Rollback.** Revert the file commit. Rolling back the *database* means re-granting a permissive policy — treat that as an incident, not a routine rollback.

**Commit.** `feat(security): add reviewable schema and role-based RLS for all tkw_ tables`

---

## T0.3 — Stop the client assigning its own role

**Why.** `src/contexts/AuthContext.tsx:60-76` has the browser upsert its own permission row, with the role it picks for itself:

```ts
const defaultRow = {
  user_id: userId,
  email,
  role: isAdminEmail ? 'admin' : 'user',
  can_read_token_wallet: isAdminEmail,
  ...
};
await supabase.from('tkw_user_permissions').upsert(defaultRow, { onConflict: 'user_id', ignoreDuplicates: true });
```

The gate is `email === ADMIN_EMAIL`, a string constant at line 44 that ships in the public bundle. It is not a security control — the client decides what to send, and before T0.2 the database accepted it. After T0.2 the database *rejects* the privileged fields, so this code is now not merely unsafe but wrong: it will start failing silently.

**Files.** `src/contexts/AuthContext.tsx`

**Steps.**
1. Reduce `defaultRow` to identity only: `{ user_id: userId, email }`. Remove `role` and all six permission fields. Keep `ignoreDuplicates: true`; the new INSERT policy accepts the row only because the omitted columns fall back to their `false` / `'user'` defaults. **Confirm T0.2 declared those defaults** or this upsert will be rejected.
2. Delete `ADMIN_EMAIL` (line 44), `isAdminEmail`, and the `adminPerms` object (lines 50-58).
3. Delete the client-side admin fallback at lines 96-98:
   ```ts
   } else if (isAdminEmail) {
     setPermissions(adminPerms);   // ← remove this branch
   }
   ```
   A user whose row cannot be read now falls through to `DEFAULT_USER_PERMISSIONS`. That is correct: the UI should show what the database will actually allow, rather than tabs that then fail.
4. Replace the silent swallow at line 77 (`catch (_) { /* silent */ }`) with `catch (err) { console.warn('permission row upsert failed', err); }`. This also clears the baseline lint warning at `AuthContext.tsx:77`.

**Tests.** None — this is the deletion of a client-side grant; T0.2's verification covers the behaviour.

**Verify.** `npm run lint` drops to 3 warnings. Owner signs in → all tabs (permissions now come from the bootstrapped row). Fresh account signs in → App Wallet only.

**Accept.** `grep -rn "ADMIN_EMAIL\|adminPerms" src/` returns nothing.

**Rollback.** Single-file revert. Safe: if T0.2's bootstrap was missed, reverting restores the owner's client-side access while the row is fixed.

**Commit.** `fix(auth): remove client-side role assignment and hardcoded admin email`

---

# Phase 1 — Stop data loss

```bash
git tag pre-phase-1
```

**This is the most important phase in the document.** Two live paths destroy production data today. Everything after Phase 1 is debt reduction.

---

## T1.1 — Safe id generation

**Why.** Two separate defects share one root cause.

*Injection.* `src/pages/TokenWallet.tsx:626` builds a primary key straight from user input, collapsing whitespace and nothing else:

```ts
const newId = newToolName.toLowerCase().replace(/\s+/g, '-');
```

That id is interpolated raw into a delete predicate at `src/pages/TokenWallet.tsx:431`:

```ts
.delete().not('id', 'in', `(${toolIds.map(id => `"${id}"`).join(',')})`)
```

A tool named `x",y` yields the filter `("x",y")` — the quoting breaks, the `IN` list changes meaning, and the DELETE matches rows it should not. Account ids inherit the prefix (`${toolId}-${Date.now()}` at line 602), so `TokenWallet.tsx:423` is compromised by the same input.

*Collisions.* `pay-${Date.now()}` (`PaymentSchedule.tsx:228`, `:329`), `app-${Date.now()}` (`AppWallet.tsx:769`), `task-${Date.now()}` (`:816`), `bl-${Date.now()}` (`:1790`). Two rows created in the same millisecond collide, and `upsert` then silently overwrites one with the other.

**Files.** New `src/utils/ids.ts`, new `src/utils/ids.test.ts`, then the six call sites above.

**Steps.**
1. Create `src/utils/ids.ts` with two exported pure functions:
   - `newId(prefix: string): string` — returns `` `${prefix}-${crypto.randomUUID()}` ``. `crypto.randomUUID` is available in all browsers this project targets and in Node 18+, so it needs no polyfill and no dependency.
   - `slugifyId(input: string): string` — lowercase, trim, collapse whitespace to `-`, then **strip every character outside `[a-z0-9-]`**, collapse repeated `-`, trim leading/trailing `-`. Returns `''` for input that reduces to nothing.
2. Replace all six `Date.now()`-based id constructions with `newId('pay')`, `newId('app')`, `newId('task')`, `newId('bl')`, `newId(toolId)`.
3. In `handleAddTool` (`TokenWallet.tsx:624`), use `slugifyId(newToolName)`. If the result is `''`, show the existing alert path rather than creating a tool with an empty id.

**Tests.** `src/utils/ids.test.ts`, matching the existing style in `src/utils/paymentParser.test.ts` (`describe` / `it` / `expect`, vitest, no DOM):
- `slugifyId('Claude Code')` → `'claude-code'`
- `slugifyId('x",y')` → `'xy'` — **this is the injection regression test**; assert the result matches `/^[a-z0-9-]*$/`
- `slugifyId('  Multi   Space  ')` → `'multi-space'`
- `slugifyId('!!!')` → `''`
- `newId('pay')` called 1000 times in a loop produces 1000 distinct values
- `newId('pay')` output matches `/^pay-[0-9a-f-]{36}$/`

**Verify.** `npm run test` → 22 baseline + new ids tests, all passing.

**Accept.** `grep -rn 'Date.now()}`' src/pages/` finds no remaining id construction. No call site builds an id by string concatenation of user input.

**Rollback.** Single commit. Ids created before the revert remain valid — both formats are opaque strings, so old and new rows coexist.

**Commit.** `fix(data): generate collision-free ids and sanitise user-derived tool ids`

---

## T1.2 — Delete every blind-delete sync path

**Why.** Six call sites treat local React state as authoritative and delete everything the browser does not currently hold:

| File:line | Statement |
|---|---|
| `TokenWallet.tsx:423` | `.delete().not('id','in', "(...)")` accounts |
| `TokenWallet.tsx:425` | `.delete().neq('id','non_existent')` — **deletes every account row** |
| `TokenWallet.tsx:431` | `.delete().not('id','in', "(...)")` tools |
| `TokenWallet.tsx:433` | `.delete().neq('id','non_existent')` — **deletes every tool row** |
| `AppWallet.tsx:694` / `:696` | same shape, backlog items |
| `AppWallet.tsx:702` / `:704` | same shape, app projects |
| `PaymentSchedule.tsx:204` / `:207` | same shape, payment schedules |

`PaymentSchedule.tsx:207` is reachable today by a plain network error — see T1.3. The `.not('id','in', ...)` variants are the injection sink from T1.1.

**Files.** `src/pages/TokenWallet.tsx`, `src/pages/AppWallet.tsx`, `src/pages/PaymentSchedule.tsx`

**Steps.**
1. In each of the three sync effects (`TokenWallet.tsx:392`, `AppWallet.tsx:649`, `PaymentSchedule.tsx:163`), delete the cleanup sections entirely — that is steps "3." and "4." in `TokenWallet` and `AppWallet`, and the `delete` calls inside the `if`/`else` in `PaymentSchedule`. Keep the upserts.
2. Do not replace them with anything in this task. Deletion is restored, correctly, in T1.4. Between T1.2 and T1.4 the app **leaks rows** on delete — that is a deliberate, safe intermediate state, and it is why T1.4 immediately follows.
3. Leave `PaymentSchedule.tsx`'s `localStorage` write at line 167 alone.

**Tests.** None — pure deletion. The guard against reintroduction is the grep in **Accept**.

**Verify.** `npm run test && npx tsc -b && npm run lint`. Manually: create, edit and delete an account; the edit persists across reload, the deleted account **reappears** on reload (expected until T1.4).

**Accept.** `grep -rn "non_existent\|not('id', 'in'" src/pages/` returns nothing.

**Rollback.** Single commit, pure deletion of destructive statements. This is the safest revert in the plan — and the one you should be least willing to make.

**Commit.** `fix(sync): remove blind table-wide deletes from all three sync effects`

---

## T1.3 — Guard sync behind a real load outcome

**Why.** `src/pages/PaymentSchedule.tsx:112-160` — when the Supabase fetch *throws* (offline, DNS failure, paused project), the `catch` at line 150 sets an error banner but leaves `loaded` as `[]`. Line 155 then runs `setSchedules([])` and `setIsLoaded(true)`, which arms the sync effect with empty state. The localStorage fallback exists only in the `else if (error)` branch at line 141 — so the one path with no cache protection is precisely the one that reaches the table-wide delete.

Removing the delete in T1.2 stops the data destruction. This task stops the *other* half: with empty state and `isLoaded === true`, the upsert branch is skipped but the app still presents an empty list as if it were real, and any subsequent edit syncs from a false baseline.

`TokenWallet.tsx:174-215` and `AppWallet.tsx:333-406` have the same defect with a different tail: on error they fall back to `DEFAULT_DATA` / `INITIAL_APP_DATA` and then **upsert the seed data over real rows**.

**Files.** All three page components.

**Steps.**
1. In each page, replace the `isLoaded: boolean` state with:
   ```ts
   const [loadState, setLoadState] = useState<'loading' | 'ready' | 'failed'>('loading');
   ```
2. Set `'ready'` only when the fetch returned without error **and** returned data. Set `'failed'` in both the `error` branch and the `catch`.
3. Change every sync effect's first line from `if (!isLoaded) return;` to `if (loadState !== 'ready') return;`. A failed load must never authorise a write.
4. Keep rendering whatever fallback data the page already shows on failure, but render it as read-only context, not as a syncing baseline. Where a page shows an error banner (`dbSyncError` in `PaymentSchedule`), reuse it; where it does not, add the same treatment as `isSupabasePaused` in `TokenWallet.tsx:172`.
5. Extract the decision into one pure function so it is testable without a DOM — `src/data/syncPolicy.ts`:
   ```ts
   export function shouldSync(loadState: 'loading' | 'ready' | 'failed'): boolean
   ```
   Trivial today; T2.2 grows it. Call it from all three effects so the rule has exactly one definition.

**Tests.** `src/data/syncPolicy.test.ts`:
- `shouldSync('loading')` → `false`
- `shouldSync('failed')` → `false`
- `shouldSync('ready')` → `true`

These are thin, but they pin the invariant so a later refactor cannot quietly widen it.

**Verify.** `npm run test && npx tsc -b`. Manually: open DevTools, set the network to offline, reload the Payments page. Expected — the error banner appears, the list is empty, and **the Network tab shows no PATCH/POST/DELETE to `tkw_payment_schedules`**. Restore the network, reload: all schedules return.

**Accept.** The offline check above shows zero write requests. `grep -rn "isLoaded" src/pages/` returns nothing.

**Rollback.** Three files, one commit. Reverting restores the pre-T1.3 guard, which is still safe *provided T1.2 stayed in*. Never revert T1.2 and T1.3 together.

**Commit.** `fix(sync): never write to Supabase from a failed or pending load`

---

## T1.4 — Explicit deletes at the point of deletion

**Why.** T1.2 removed row deletion from the app. Restore it the correct way: delete the specific row when the user deletes the specific thing. The handlers already know the id.

**Files.** All three page components.

**Steps.** Make each handler `async` and issue the delete alongside the local state update. On error, surface it and **do not** remove the row from local state — a failed delete must not look like it succeeded.

1. `TokenWallet.tsx:584` `handleRemoveAccount` → `supabase.from('tkw_ai_accounts').delete().eq('id', accountId)`
2. `TokenWallet.tsx:652` `handleRemoveTool` → delete the tool's accounts with `.in('id', accountIds)` (an **array**, never an interpolated string), then `.delete().eq('id', toolId)`.
3. `PaymentSchedule.tsx:287` `handleDeleteItem` → `.from('tkw_payment_schedules').delete().eq('id', id)`
4. `AppWallet.tsx:805` `handleDeleteApp` → delete the project's backlog rows with `.in('id', ...)`, then the project with `.eq('id', id)`.
5. `AppWallet.tsx:1763` — inline backlog delete inside the project-detail modal → `.from('tkw_app_backlog_items').delete().eq('id', bId)`.
6. **`AppWallet.tsx:845` `handleDeleteBacklogItem` is different — read this carefully.** It mutates modal-local `backlogItems` state only; nothing reaches `apps` until `handleSaveApp` (line ~812) commits `backlog: backlogItems`. So the DB delete cannot go in the handler. Instead, in `handleSaveApp`, diff the ids in `activeModal.app.backlog` against the ids in `backlogItems`, and delete the difference with `.in('id', removedIds)`. Putting the delete in `handleDeleteBacklogItem` would delete rows the user then abandons by closing the modal without saving.
7. **Do not add a delete at `TokenWallet.tsx:1273`.** That `filter` is the *move-account-between-tools* path, not a deletion. The account row survives with a new `tool_id`; deleting it there would destroy the account the user was moving.

**Tests.** Extract the diff from step 6 as a pure function in `src/data/syncPolicy.ts` and test it:
```ts
export function removedIds(before: {id: string}[], after: {id: string}[]): string[]
```
- nothing removed → `[]`
- one removed → that id
- item added and another removed → only the removed id
- `before` empty → `[]`

**Verify.** For each of the six paths: delete the item, confirm it disappears, **reload**, confirm it stays gone. Then specifically: open a project, delete a backlog item, close the modal **without saving**, reload — the item must still be there. Then move an account between tools and reload — the account must exist under the new tool.

**Accept.** All six delete paths survive a reload; the abandon-modal case and the move-account case both preserve data. Zero remaining string-interpolated PostgREST filters: `grep -rn "'in', \`" src/` returns nothing.

**Rollback.** One commit. Reverting returns to the T1.3 state, which leaks rows but destroys nothing.

**Commit.** `feat(sync): delete rows explicitly at the point of user deletion`

---

# Phase 2 — Extract the data layer

```bash
git tag pre-phase-2
```

**Why this phase exists.** The same ~80-line load → map → sync block is written three times, once per page. Every Phase 1 bug existed in triplicate, and every future one will too. The mappers have already drifted apart (see T2.1).

**Design constraint.** Vitest runs in the **node** environment with no DOM libraries installed. This phase is therefore deliberately shaped so the logic worth testing lives in **pure functions** — mappers and policy — and the React hook is a thin shell over them. Do not add DOM test tooling here; that decision belongs to T4.4.

---

## T2.1 — Pure row mappers with round-trip tests

**Why.** Six hand-written `snake_case ↔ camelCase` mappings are spread across three files, and they have already diverged:
- `AppWallet.tsx:344` reads `frontendUrl: p.url` while `:658` writes `url: p.frontendUrl` — the asymmetry is correct but undocumented and easy to break.
- `AppWallet.tsx:355` hardcodes `isDisabled: false` with the comment `// DB doesn't have disabled for app projects`, so the disable toggle at `:796` never survives a reload. This is a live bug, not a style issue.

**Files.** New `src/data/mappers.ts`, new `src/data/mappers.test.ts`.

**Steps.**
1. For each of the five data tables define a matched pair of pure functions with no imports from React or Supabase:
   ```ts
   export function rowToAccount(row: AccountRow): Account
   export function accountToRow(account: Account, toolId: string): AccountRow
   ```
   …and the same for tools, app projects, backlog items and payment schedules.
2. Move the existing mapping expressions across **verbatim**, including the `Number(...)` coercions and `|| undefined` fallbacks. This task changes no behaviour — it only relocates and pins it.
3. Declare a `Row` type per table rather than using `any`. The current code leans on implicit `any` from the Supabase client; make the boundary explicit so a column rename becomes a type error instead of a runtime `undefined`.
4. Leave `isDisabled: false` exactly as it is for now, with the comment intact. T3.1 fixes it, and it needs its own failing test first.

**Tests.** `src/data/mappers.test.ts` — one round-trip per table:
```ts
expect(rowToAccount(accountToRow(account, 'tool-1'))).toEqual(account);
```
Build each fixture with **every optional field populated**, then a second fixture with every optional field absent. The populated round-trip is what catches a dropped column; the empty one catches a fallback that turns `undefined` into `''` or `0`.

Expect the App-project round-trip to **fail on `isDisabled`**. That is correct and expected. Mark it `it.fails(...)` with a comment pointing at T3.1 — do **not** weaken the fixture to make it pass, and do **not** use `it.skip`, which hides it.

**Verify.** `npm run test` — all round-trips green except the one documented `it.fails`.

**Accept.** Every mapping expression in the three page components has been replaced by a call into `src/data/mappers.ts`. No mapper imports React or the Supabase client.

**Rollback.** Additive plus mechanical substitution; single-commit revert.

**Commit.** `refactor(data): extract row mappers as pure functions with round-trip tests`

---

## T2.2 — Pure sync-policy module

**Why.** Every mutation currently rewrites the whole table. Renaming one account issues an upsert of every account; ticking one backlog checkbox rewrites every project and every backlog item. There is no debounce and no cancellation of in-flight writes, so two quick edits race and the loser silently wins.

**Files.** `src/data/syncPolicy.ts` (created in T1.3), `src/data/syncPolicy.test.ts`.

**Steps.** Add two pure functions alongside the existing `shouldSync` and `removedIds`:
1. ```ts
   export function changedRows<T extends { id: string }>(prev: T[], next: T[]): T[]
   ```
   Returns only rows that are new or structurally different from their `prev` counterpart. Compare with a stable serialisation of the row object — the rows are flat JSON scalars, so `JSON.stringify` over sorted keys is sufficient and needs no dependency. Do not reach for a deep-equality library.
2. ```ts
   export function planSync<T extends { id: string }>(
     prev: T[], next: T[]
   ): { upsert: T[]; deleteIds: string[] }
   ```
   Composes `changedRows` and `removedIds` into the single decision a caller needs.

**Tests.** Extend `syncPolicy.test.ts`:
- identical arrays → `{ upsert: [], deleteIds: [] }` (**the important one** — a no-op render must produce no writes)
- one field changed on one row → exactly that row in `upsert`
- new row appended → only the new row
- row removed → its id in `deleteIds`, `upsert` empty
- key order differs but values identical → still no-op
- `prev` empty and `next` empty → no-op

**Verify.** `npm run test`.

**Accept.** `planSync` is pure: no imports, no `Date.now()`, no randomness. Same inputs, same output, every time.

**Rollback.** Additive only; nothing calls it until T2.3.

**Commit.** `feat(data): add pure sync-planning helpers`

---

## T2.3 — Migrate PaymentSchedule onto the data layer

**Why.** Smallest of the three pages and the one that carried the worst bug, so it is the safest place to prove the abstraction.

**Files.** New `src/data/useSyncedCollection.ts`, `src/pages/PaymentSchedule.tsx`.

**Steps.**
1. Write `useSyncedCollection<T extends {id: string}>(opts)` taking `{ table, rowToItem, itemToRow, seed? }` and returning `{ items, setItems, loadState, error }`. Internals:
   - load once on mount; set `loadState` per T1.3
   - hold the last-synced snapshot in a `useRef`
   - on `items` change, if `shouldSync(loadState)`, compute `planSync(snapshotRef.current, items)`, and **return early when both arrays are empty**
   - debounce writes by 500 ms with a `useRef` timer; clear it on unmount
   - track the in-flight request and ignore a stale response that resolves after a newer one
   - update the snapshot ref only after a write succeeds
2. Keep the hook thin. Anything worth a test belongs in `mappers.ts` or `syncPolicy.ts`, which are already covered.
3. Replace `PaymentSchedule`'s load effect (lines 112-160) and sync effect (lines 163-215) with one `useSyncedCollection` call. Preserve the `localStorage` cache write and the `dbSyncError` banner — both are user-visible behaviour.
4. Keep the explicit delete from T1.4; the hook's `deleteIds` covers list-level removal, the handler covers the user action. If that turns out to double-delete, prefer the hook's path and drop the handler call — but verify, do not assume.

**Tests.** No new test file. The hook's logic is already covered by `mappers.test.ts` and `syncPolicy.test.ts`; testing the React shell would need DOM tooling this project does not have.

**Verify.** Full manual pass on the Payments page: quick-add, edit, mark paid, pause, delete, filter, sort. Reload after each. Then with DevTools open, rename one schedule and confirm the Network tab shows **one** PATCH after ~500 ms, carrying **one** row — not the whole table.

**Accept.** Renaming one item writes one row. Idle time produces zero requests. Every listed interaction survives a reload.

**Rollback.** Two files. Reverting returns `PaymentSchedule` to its Phase 1 state, which is already safe. The hook stays in the tree unused — harmless.

**Commit.** `refactor(payments): move persistence onto useSyncedCollection`

---

## T2.4 — Migrate TokenWallet

**Prerequisite.** T2.3 shipped and verified in production for at least one working session. Do not migrate all three pages in one sitting.

**Files.** `src/pages/TokenWallet.tsx`.

**Steps.**
1. Replace the load effect (174-215) and sync effect (392-438) with `useSyncedCollection`.
2. `TokenWallet` holds a **nested** shape — `AITool[]` each with `accounts: Account[]` — across two tables. Use two `useSyncedCollection` calls, one per table, and derive the nested view with `useMemo`. Do not add nesting support to the hook for a single caller; that is the abstraction earning complexity it has not yet justified.
3. Hold `DEFAULT_DATA` as the hook's `seed`, applied **only when the load succeeds and returns zero rows** — never on failure. This is the bug from T1.3 in its second form.

**Tests.** None new.

**Verify.** Add a tool, add an account, rename both, set a reset time, mark run-out, set a due date, disable an account, move an account between tools, delete an account, delete a tool. Reload after each. Confirm the move-account case (per T1.4 step 7) does not delete the account.

**Accept.** All of the above survive a reload. One edit writes one row.

**Rollback.** Single file, single commit.

**Commit.** `refactor(token-wallet): move persistence onto useSyncedCollection`

---

## T2.5 — Migrate AppWallet

**Prerequisite.** T2.4 shipped and verified. **Do T3.1 first if you prefer** — the merge bug is entangled with this page's load path, and fixing it before migrating is legitimate. Pick one order and note it in the commit body.

**Files.** `src/pages/AppWallet.tsx`.

**Steps.** As T2.4, two tables (`tkw_app_projects`, `tkw_app_backlog_items`). Keep the backlog-diff delete from T1.4 step 6 wired into `handleSaveApp`.

**Verify.** Create, edit, disable and delete a project; add, edit, complete and delete backlog items; the abandon-modal-without-saving case from T1.4.

**Accept.** As T2.4. After this task the three near-identical sync blocks are gone — confirm with `grep -c "syncToSupabase" src/pages/*.tsx` returning zero.

**Commit.** `refactor(app-wallet): move persistence onto useSyncedCollection`

---

# Phase 3 — AppWallet correctness

```bash
git tag pre-phase-3
```

---

## T3.1 — Make the database authoritative; seed only when empty

**Why.** `src/pages/AppWallet.tsx:371-398`. For any project whose id matches an entry in `INITIAL_APP_DATA`, the hardcoded constant **overwrites the row loaded from the database**:

```ts
mergedById.set(dbApp.id, {
  ...initApp,                                    // ← constant wins
  backlog: dbApp.backlog?.length ? dbApp.backlog : initApp.backlog
});
```

Only `backlog` survives from the DB. Edit a seeded project's name, URL, status or priority: it saves to state, syncs to Supabase, looks correct — and on the next reload the constant wins and the sync effect writes the stale value straight back over the user's edit. The change is destroyed silently, and the user has no way to tell.

`:355` (`isDisabled: false`) is the same defect by a different route: the column does not exist, so the toggle at `:796` never persists.

**Files.** `supabase/schema.sql`, `src/data/mappers.ts`, `src/data/mappers.test.ts`, `src/pages/AppWallet.tsx`.

**Steps.**
1. **Write the failing test first.** In `mappers.test.ts`, remove the `it.fails` marker from T2.1's App-project round-trip and add a merge test:
   ```ts
   // a DB row whose id matches a seed entry must win on every field
   ```
   Confirm both fail before touching the implementation, and record that in the commit body.
2. Add `is_disabled BOOLEAN NOT NULL DEFAULT false` to `tkw_app_projects` in `supabase/schema.sql`. `[HUMAN]` apply the migration.
3. Map it in both directions in `mappers.ts`; delete the `isDisabled: false` hardcode and its comment.
4. Replace the merge at `:371-398` with: **if the DB returned any rows, use them and nothing else.** Apply `INITIAL_APP_DATA` only when the load succeeded *and* returned zero rows — the same seed rule as T2.4 step 3. Extract it as a pure function so it is testable:
   ```ts
   export function seedIfEmpty<T>(loaded: T[], seed: T[]): T[]
   ```
5. Delete the now-unreachable `initialById` / `mergedById` merge machinery — roughly 25 lines.

**Tests.**
- the two from step 1, now passing
- `seedIfEmpty([], seed)` → `seed`
- `seedIfEmpty([row], seed)` → `[row]` — seed must not be appended
- `seedIfEmpty([], [])` → `[]`

**Verify.** Edit a **seeded** project's name (one present in `INITIAL_APP_DATA`), reload — the new name persists. Disable a project, reload — it stays disabled. Point the app at an empty table, reload — the seed projects appear exactly once, not duplicated.

**Accept.** A seeded project's edits survive a reload. `grep -n "mergedById\|initialById" src/pages/AppWallet.tsx` returns nothing.

**Rollback.** Single file plus a mapper change. The `is_disabled` column is additive and can stay.

**Commit.** `fix(app-wallet): make the database authoritative and seed only an empty table`

---

## T3.2 — Collapse the health checker and stop it running automatically

**Why.** Two problems.

*Privacy.* `src/pages/AppWallet.tsx:537` auto-runs health checks on mount, and `:449` posts each project URL to `https://api.allorigins.win`. AppWallet is the **unauthenticated index route** (`src/App.tsx:17-19`), so every anonymous visitor causes the full list of internal project URLs — including backend hosts — to be sent to an unaffiliated third party. Nobody consented to that and nothing in the UI discloses it.

*Complexity.* `checkSingleAppHealth` (`:440-505`) is 66 lines of three fallback strategies, try/catch nested four deep, and six hand-paired `setTimeout`/`clearTimeout` calls. Two of its `catch` blocks are unreachable: the outer `try` at `:447` wraps an inner `try` that already catches everything, and the same pattern repeats at `:474`. `handleRunHealthCheckAll` (`:507`) then fires all of them in parallel with no concurrency cap.

**Files.** `src/pages/AppWallet.tsx`.

**Steps.**
1. Delete the auto-run effect at `:537-541`. Health checks become **manual only**, via the existing button. This also clears the baseline `exhaustive-deps` warning at `:539` — by removing the effect, not by editing the dependency array.
2. Collapse the three strategies to one. Keep the CORS-proxy path, since reading real status codes is the feature's whole point; drop Methods 2 and 3, which can only report "reachable" and already return `healthy` for opaque responses.
3. Replace the six manual timers with `AbortSignal.timeout(9000)`. Flatten to a single `try`/`catch`.
4. Cap concurrency at 5 in `handleRunHealthCheckAll` rather than `Promise.all` over the whole list. A simple index-cursor loop with 5 workers is enough — no dependency.
5. Add one line of visible disclosure next to the button, in Vietnamese to match the surrounding copy, stating that checking sends project URLs to a third-party service.

**Tests.** Extract the response interpretation as a pure function and test it:
```ts
export function interpretHealth(httpCode: number | undefined): 'healthy' | 'failed'
```
- `401` → `healthy` (protected but reachable — preserve the existing rule at `:460`)
- `403` → `healthy`
- `404` → `failed`
- `500` → `failed`
- `200` → `healthy`
- `undefined` → `healthy` (preserve current behaviour at `:465`)

**Verify.** Load the App Wallet signed out; the Network tab shows **no** request to `allorigins.win`. Click the check button: requests appear, at most 5 in flight. A project with a known-404 URL reports failed.

**Accept.** Zero third-party requests on page load. `checkSingleAppHealth` is under 25 lines. `npm run lint` shows no `exhaustive-deps` warning.

**Rollback.** Single file, single commit.

**Commit.** `fix(app-wallet): make health checks manual, single-strategy and concurrency-capped`

---

# Phase 4 — Rendering performance

```bash
git tag pre-phase-4
```

---

## T4.1 — Fix the interval teardown

**Why.** `src/pages/TokenWallet.tsx:440-475`:

```ts
useEffect(() => {
  const interval = setInterval(() => { ... setTools(nextTools); }, 1000);
  return () => clearInterval(interval);
}, [tools]);
```

The effect closes over `tools` and depends on `tools`, so **every tick that changes state destroys and recreates the timer**. The 1 Hz `setCurrentTime` at `:443` re-renders the entire 1,439-line component — every card, every progress bar, and all the modal JSX — once per second, indefinitely, whether or not anything is visible.

**Files.** `src/pages/TokenWallet.tsx`.

**Steps.**
1. Hold the interval in a `useRef` and give the effect an **empty** dependency array.
2. Read current state inside the tick via the functional updater `setTools(prev => ...)` instead of the captured `tools`.
3. Keep `setCurrentTime(now)` at 1 Hz for now — T4.3 confines its blast radius.

**Tests.** Extract the rollover arithmetic — currently inline at `:450-462` — into a pure function in `src/utils/timeParser.ts`, next to the existing helpers:
```ts
export function rollForward(resetTime: number, now: number, stepMs?: number): number
```
Test in the existing `timeParser.test.ts`:
- `resetTime` in the future → returned unchanged
- one step overdue → advanced by exactly one 5-hour step
- ten steps overdue → lands in the future in one call (the app-closed-for-days case from `CORE_SPECS.md` Rule 2)
- `resetTime === now` → advanced by one step, never returns `now`
- result is always `> now`

**Verify.** Leave the Token Wallet open for two minutes with DevTools' Performance panel recording. Timer creation count must be **1**, not ~120.

**Accept.** `setInterval` appears once in the file, inside an effect with `[]` dependencies.

**Rollback.** Single file.

**Commit.** `perf(token-wallet): stop recreating the countdown interval on every tick`

---

## T4.2 — Split rollover from the display tick

**Why.** When an account rolls over, the 1 Hz tick calls `setTools(...)`, which triggers the sync effect. Pre-Phase-2 that meant a full-table rewrite; post-Phase-2 it is one row, but it is still a **database write driven by a display timer**. With N accounts resetting in the same window it is N writes in one second.

**Files.** `src/pages/TokenWallet.tsx`.

**Steps.**
1. Keep the 1 Hz timer for `currentTime` only — display, no state mutation, no writes.
2. Move the rollover scan to its own interval at 60 s, calling `rollForward` from T4.1. A five-hour countdown does not need second-accurate rollover; the displayed countdown stays second-accurate regardless because it is derived from `currentTime`.
3. Run the rollover scan once on mount so a page opened after a long absence corrects immediately — `CORE_SPECS.md` Rule 2 requires this.

**Tests.** Covered by `rollForward` from T4.1.

**Verify.** Set an account's reset time ~90 seconds out. Watch it: the countdown ticks every second; the status flips to active within a minute of hitting zero; the Network tab shows **one** write at rollover, not one per second.

**Accept.** No Supabase write is issued from the 1-second timer.

**Rollback.** Single file.

**Commit.** `perf(token-wallet): decouple account rollover from the display tick`

---

## T4.3 — Extract and memoize the account card

**Why.** Even with T4.1 and T4.2, `setCurrentTime` at 1 Hz re-renders the whole page component. The per-account work is the JSX at `:969-1034`, including `calculateBarPercentages`, `formatResetTime` and `formatVerboseCountdown` per account per second, plus eight grid-line divs each.

**Files.** New `src/components/AccountCard.tsx`, new `src/components/ResetBar.tsx`, `src/pages/TokenWallet.tsx`.

**Steps.**
1. Extract `<ResetBar targetTime currentTime />` from the IIFE at `:1016-1031`. The eight grid lines are static — hoist them to a module-level constant array instead of rebuilding them each render.
2. Extract `<AccountCard account tool currentTime onOpen />` from `:969-1034`. Pass a **stable** `onOpen` via `useCallback`, or memoisation buys nothing.
3. Wrap both in `React.memo`.
4. Move the inline `style={{}}` on the bar fills into CSS custom properties so the memo comparison is not defeated by a fresh object literal each render.

**Tests.** None automated without DOM tooling; T4.4 covers that if taken.

**Verify.** React DevTools Profiler, "Highlight updates while rendering" on. With the page idle, only the cards whose displayed countdown text actually changed should flash — not the page header, not the toolbar, not the modal container.

**Accept.** Idle re-render is confined to `AccountCard` subtrees. `TokenWallet.tsx` drops below ~1,200 lines.

**Rollback.** Three files, one commit; purely a component extraction.

**Commit.** `perf(token-wallet): extract and memoize AccountCard and ResetBar`

---

## T4.4 — Route-level code splitting

**Why.** `src/App.tsx:5-9` imports all five pages eagerly, so the build is a single 644 KB chunk. A visitor to the public App Wallet downloads the 1,035-line `Notes` page, the payments page and the user-management table they may never open — and if they are not signed in, may not be permitted to open.

**Files.** `src/App.tsx`.

**Steps.**
1. Convert all five page imports to `React.lazy(() => import('./pages/X'))`.
2. Wrap `<Outlet />` in `src/components/Layout.tsx:115` with `<Suspense>`, reusing the existing `protected-spinner` markup from `ProtectedRoute.tsx:15` as the fallback so the loading state stays visually consistent.
3. Optional, only if the numbers justify it: add `build.rollupOptions.output.manualChunks` in `vite.config.ts` to split the Supabase client into its own vendor chunk.

**Tests.** None. Verification is the build output.

**Verify.** `npm run build` and compare against the 644 KB baseline. Then `npm run preview`, load `/` with a cold cache, and confirm from the Network tab that the Notes chunk is not fetched until `/notes` is visited.

**Accept.** At least three JS chunks; the entry chunk is meaningfully smaller than baseline (target ≈350 KB, but **record the real number** — do not claim a figure you did not measure). The Notes chunk loads only on navigation.

**Rollback.** Single file.

**Commit.** `perf(build): split routes into lazy-loaded chunks`

> **Optional, only if DOM tests are wanted later:** add `jsdom` and `@testing-library/react` as devDependencies, add `test: { environment: 'jsdom' }` to `vite.config.ts`, and make it **its own commit** with no other changes. Per ground rule 5 this is the only dependency addition the plan authorises, and it is not required by any task above.

---

# Phase 5 — Shared UI

```bash
git tag pre-phase-5
```

Cosmetic and lowest-risk. Nothing here fixes a defect; it pays down the duplication that makes every future change cost three edits. **Do not start Phase 5 with Phases 0–1 unfinished.**

---

## T5.1 — `<Modal>` primitive

**Why.** The overlay + header + close-SVG + `stopPropagation` block is copied at least five times: `SettingsModal.tsx:19-29`, `TokenWallet.tsx` (add-tool, add-account, manage-account, rename-tool), `AppWallet.tsx` (edit-app, project-detail, edit-backlog), `PaymentSchedule.tsx` (item modal, SQL modal).

**Steps.** Create `src/components/Modal.tsx` taking `{ title, onClose, maxWidth?, children }`. Replace each copy. Move `applyTheme` out of `SettingsModal.tsx` into `src/utils/theme.ts` — that clears the baseline `only-export-components` warning at `SettingsModal.tsx:4` at its root rather than suppressing it.

**Verify.** Open and close every modal; check the overlay click-to-close and the `stopPropagation` on the panel still behave.

**Commit.** `refactor(ui): extract shared Modal primitive`

---

## T5.2 — `<Toolbar>` — search, filters, sort

**Why.** Three pages declare the same block of state: `searchQuery`, `statusFilter`, a type/recurrence/tool filter, `visibilityFilter`, `sortBy`, `sortOrder` — 21 near-identical `useState` calls at `TokenWallet.tsx:250-256`, `AppWallet.tsx:422-429` and `PaymentSchedule.tsx:105-109`, followed by three ~60-line filter-and-sort `useMemo` blocks with the same structure.

**Steps.** Extract a `useListControls` hook plus a presentational `<Toolbar>` taking a filter-definition array. Keep the per-page *predicates* in their pages — they are genuinely different. Only the state plumbing and the sort comparator are shared. **Do not** generalise the predicates into a config DSL; that trades duplication for a worse problem.

**Verify.** Every filter and sort combination on all three pages, including the "clear filters" affordance.

**Commit.** `refactor(ui): share list search, filter and sort controls`

---

## T5.3 — Icon module

**Why.** Brand and UI SVGs are inlined throughout, with `switch`-based icon pickers at `TokenWallet.tsx:53`, `AppWallet.tsx` and `PaymentSchedule.tsx:27`. The Google logo alone is duplicated verbatim in `ProtectedRoute.tsx:28-33` and `Layout.tsx:102-107`.

**Steps.** Create `src/components/icons/` with one named export per icon. Replace inline copies. Keep the tool/brand pickers as thin lookup maps, not `switch` statements.

**Verify.** Every page renders its icons unchanged in both themes; the Google logo is identical on the sign-in wall and in the header.

**Commit.** `refactor(ui): extract inline SVGs into an icon module`

---

## T5.4 — Inline styles into CSS

**Why.** 255 `style={{...}}` sites (115 in `AppWallet` alone) coexist with a 2,616-line `index.css` containing 19 `!important` declarations — the `!important`s exist largely to win against the inline styles. They also defeat `React.memo` by allocating a fresh object every render.

**Steps.** Move inline styles to classes in `index.css`, then remove the `!important` declarations that become unnecessary. Work **one component per commit** — this is the easiest task in the plan to get visually wrong, and small commits make a regression bisectable.

**Verify.** Every page in **both** light and dark themes (`[data-theme="light"]` overrides live at `index.css:35`, `:112`, `:1683`, `:1827`). Check at mobile width too.

**Commit.** `refactor(ui): move inline styles into stylesheet (<component>)`

---

# Appendix A — Out of scope

Do **not** do these as part of this plan. Several are tempting while in the neighbourhood; raise them separately.

- Rewriting `src/utils/timeParser.ts` or `paymentParser.ts`. They are the only well-tested modules in the repo (22 passing characterization tests as of `1ded1bd`). Leave them alone except for the additive `rollForward` in T4.1.
- Replacing React Router, adding a state-management library, adding React Query. `useSyncedCollection` is deliberately ~60 lines of local code; a data-fetching library is a bigger commitment than this codebase currently justifies.
- Adding realtime subscriptions. `Notes.tsx:489` documents the pattern, but nothing uses it and combining realtime with the sync loop before Phase 2 is settled will produce update storms.
- Translating the UI to English, or Vietnamese to English. The mixed-language copy is intentional.
- `Notes.tsx`. It is 1,035 lines of static documentation content with no logic and no persistence. It costs bundle size, which T4.4 addresses; it needs no refactor.
- Upgrading dependencies. Out of scope entirely — separate work, one package per PR.

---

# Appendix B — Verification commands

```bash
npm run test          # vitest, node environment, 22 tests at baseline
npx tsc -b            # must stay clean
npm run lint          # 4 warnings at baseline; T0.3 and T3.2 reduce this to 2
npm run build         # 644 KB single chunk at baseline
npm run dev           # http://localhost:5173, strict port
```

The gate before every commit: **all four of the first four, green.**

---

# Appendix C — Progress checklist

Update this section as tasks land. One line, with the commit sha.

```
[ ] T0.1  untrack .env + rotate key            [HUMAN step pending]
[ ] T0.2  schema + RLS for six tables          [HUMAN step pending]
[ ] T0.3  remove client-side role assignment
[ ] T1.1  safe id generation
[ ] T1.2  remove blind deletes
[ ] T1.3  guard sync behind load outcome
[ ] T1.4  explicit deletes
[ ] T2.1  pure row mappers
[ ] T2.2  pure sync policy
[ ] T2.3  migrate PaymentSchedule
[ ] T2.4  migrate TokenWallet
[ ] T2.5  migrate AppWallet
[ ] T3.1  DB authoritative, seed when empty
[ ] T3.2  health check: manual, single-strategy
[ ] T4.1  fix interval teardown
[ ] T4.2  split rollover from display tick
[ ] T4.3  extract + memoize AccountCard
[ ] T4.4  route-level code splitting
[ ] T5.1  Modal primitive
[ ] T5.2  Toolbar
[ ] T5.3  icon module
[ ] T5.4  inline styles → CSS
```

---

# Appendix D — If something goes wrong

| Symptom | Action |
|---|---|
| A test that should fail passes | The fix landed before the test. Revert the fix, confirm red, re-apply. Do not proceed on an unproven test. |
| Rows disappear after a deploy | `git reset --hard pre-phase-<N>`, redeploy, then restore from a Supabase point-in-time backup. Report before doing anything else. |
| A user reports "no permission" after Phase 0 | Their `tkw_user_permissions` row is missing or unprivileged. An admin grants it in the Users tab. This is correct behaviour, not a regression. |
| `tsc -b` fails only after a mapper change | A column name does not match the DDL. Fix the mapper against `supabase/schema.sql`, never by widening the type to `any`. |
| A step contradicts what the code actually does | **Stop.** The plan was written against `1ded1bd`. Report the discrepancy with file and line; do not guess at the intent. |
