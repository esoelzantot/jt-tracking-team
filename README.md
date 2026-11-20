# Tracking Hub — J&T Express

Internal tool for the Tracking Team: type a shipper's **name or code** and instantly see the
account manager, the support agent who covers them, and the pickup branch stats.

## Features
- **Instant search** (name / code / last digits of the code, Arabic-aware, typo tolerant) with a live profile card.
- **Leave hand-off**: set an agent to *On leave* and every search for their clients shows the support agent instead.
  - Per-client `Support agent`, or a per-agent `Default cover agent` that covers all their accounts.
- **Shared branches** (e.g. GI-Project BR): each client has its own account manager; unassigned clients are flagged.
- **Agents** directory with generated avatars (male / female / hijab), branches, clients and workload.
- **Branches** list with volume, customers and agents.
- **Dashboard** (sign-in required): overview, clients / agents / branches CRUD, bulk assign, Excel import and export.
- Arabic (RTL) + English, mobile-first.

## Run locally
```bash
npm install
npm run dev
```
Without Firebase keys the app runs in **demo mode** (data is kept in the browser; any email signs in).

## Connect Firebase
1. Create a Firebase project → add a **Web app** → copy the config into `.env.local` (see `.env.example`).
2. Enable **Firestore** and **Authentication → Email/Password**.
3. Create the admin users in Authentication, then for each one create a document `admins/{uid}` in Firestore (any content).
4. Deploy the security rules: `npx firebase-tools deploy --only firestore:rules`
   (reading is open to the team, writing is admin only — tighten `allow read` if needed).
5. Sign in on `/dashboard` → **Import Excel** → drop the Tracking Team sheet → **Merge**.

Re-importing later with **Merge** keeps the assignments, support agents, statuses and phones edited in the dashboard.

## Data model (Firestore)
| Collection | Doc id | Fields |
|---|---|---|
| `clients` | client code | name, code, branchId, agentId, supportAgentId, notes |
| `agents` | agent ID | name, gender, hijab, status (`active`/`leave`/`off`), coverAgentId, phone, email, area |
| `branches` | slug of name | name, area, avgShipmentsPerDay, totalCustomers, agentIds[] |
