# Ulrich Propiedades — Client Review Summary

> A one-page companion to the full review (`client-review-current-system-flow-and-implementation-plan.md`). Everything here was verified against the current codebase.

## Current milestone status

| Milestone | Scope | Status |
|---|---|---|
| **M1 — Public site + Listings** | Homepage, About, Contact, FAQ, Privacy, Terms, Listings + single listing, search/filters, maps, DB-connected data | ✅ **Ready for testing** (two small finishing items: Contact form not wired, Contact map is a static image) |
| **M2 — Property mgmt + Auth** | Register/login, OTP, reset, RBAC, staff login, listing CRUD, image pipeline, statuses, agent assignment, public sync | ✅ **Ready for testing — except email delivery** (⛔ Resend domain) |
| **M3 — CRM modules** | Agents, Contacts, Leads, Opportunities, Contracts, Notifications, metrics, agent profiles, activity, revenue | 🟡 **In progress** (most modules live; dashboard-home metrics still sample data; Opportunities/Contracts need a decision) |
| **M4 — Integrations, messaging, QA, launch** | Messaging, calendar, templates, Mailchimp, global search, QA, launch | 🔜 **Future** (global search, activity logs, scheduled tours, push already done early) |

## What is ready for client testing now

* ✅ **Public website + Listings** (live Google Maps on listing pages; public/dashboard listings in sync).
* ✅ **Authentication & staff onboarding** logic (login, OTP, reset, OAuth, invite/accept) — *email delivery is the only gap*.
* ✅ **Listings management** — full CRUD, WebP/~2K image optimization, cover/reorder/remove, status, feature, agent assignment.
* ✅ **Contacts, Leads, Opportunities, Contracts, Agents, Tours** — connected to real data with role-based access.
* ✅ **Leads → Opportunity conversion**, lead notes/activity, **public Tour request** (auto-creates Contact + Lead + Tour and notifies the agent).
* ✅ **In-app + browser push notifications**, **global ⌘K search**, **activity/audit logs**.

## The email blocker (⛔ most important)

* Two email paths: **Supabase Auth** sends OTP/password-reset; **Resend** (app code) sends **staff invitations only**.
* `RESEND_API_KEY` is present, but `MAIL_FROM` is unset → sender defaults to the **sandbox** `onboarding@resend.dev` (delivers only to the account owner). No verified domain.
* The reported *"registration appears stuck"* is almost certainly **Supabase's email rate limit**, not broken registration logic.
* **To unblock:** provide Resend access, verify the sending domain (DNS: SPF/DKIM/DMARC), set the sender address, and point **Supabase Auth SMTP** at Resend. Then ≈ **1 working day + testing** to finish the base template and connect all flows.

## Current Milestone 3 work in progress

* Dashboard **home metrics, revenue chart, locations panel, sales table** are still **sample data** (module pages show real metrics; the home aggregation endpoint isn't built yet).
* **Locations** and **Integrations** dashboard pages are **UI-only** (sample data). **Messages** and **Blog** are **UI-only** (no database models yet).
* **Notifications**: wired for invitations, listings, lead-assignment, and tour events; **not yet** for opportunity/contract/lead-created events or contract-expiry reminders (no scheduled job; email channel not implemented).
* **Contacts**: no duplicate detection on manual create; no dedicated detail page.

## Pending client decisions

1. ⛔ **Opportunities & Contracts — separate (Option A, current) or unified Deal (Option B)?** *(Team recommends Option A + a "create contract from won opportunity" helper.)*
2. ⛔ **Auto-create a Contract from a won Opportunity?** (auto / one-click / manual)
3. **"Convert Lead → Contact"** intent (redundant today — a Lead already requires a Contact).
4. **Agent removal:** delete vs deactivate/archive.
5. **Email sender address** + ⛔ **Resend access & domain verification.**
6. **Can Managers invite Agents?** (one-line change)
7. **Listings:** publish immediately or require approval?
8. **Per-role dashboard metrics visibility**, **Google Calendar** behavior, **import/export** needs, **Blog/CMS** expectations, **Contacts detail page**.

*(Full list: §18 of the main document.)*

## Recommended next implementation sequence

1. Finish M1/M2 items (wire Contact form, live Contact map, image-reorder/cover UI polish).
2. ⛔ Complete **Resend** setup + domain verification; build the reusable email template; connect OTP/reset/invite/tour emails.
3. Finalize **Contacts** (dedupe, detail page).
4. Finalize **Leads** (UI wiring; clarify convert-to-contact).
5. ⛔ Get the **Opportunities vs Contracts** decision.
6. Finalize that **database structure** + auto-contract behavior.
7. Build the **dashboard metrics** aggregation endpoint (replace sample data).
8. Real **Locations** + map flows (coordinate backfill, draw-on-map).
9. Finish **Tours** → **Google Calendar** sync.
10. Wire remaining **notifications** + **contract-expiry** job + email channel.
11. **Messaging** model + inbox.
12. **Blog/CMS** (if confirmed).
13. **Full QA** (role-based regression) → **launch & handoff**.

## Current blockers at a glance

| Blocker | Type | Owner |
|---|---|---|
| Resend domain not verified / `MAIL_FROM` unset | External config | Client provides; team configures |
| Supabase Auth SMTP not pointed at Resend | External config | Team (after credentials) |
| Opportunities vs Contracts structure | Client decision | Client |
| Auto-contract-from-opportunity behavior | Client decision | Client |
| VAPID keys absent (push inactive) | External config | Team/Client |
