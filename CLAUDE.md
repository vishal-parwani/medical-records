# CLAUDE.md — medical-records

> **For AI assistants.** Read this first, then `PROJECT_BRIEF.md` for full
> architectural detail and history. Update the **STATUS** section below at
> the end of every session.

## Identity

Family Medical Records web app for the Parwani family (Vishal, Kasthuri,
Kimaya, Son). A static single-page web app storing what used to live in
`Family_Medical_Record.xlsx` (kept in the repo as the historical source).

- **Stack:** Plain HTML + ES-module JS + CSS. No build step, no bundler.
  Deliberately mirrors the sibling `vishal-parwani/cards-tracker` repo's
  architecture, fonts, colors, and Apple Sign-In auth pattern — same author,
  same conventions.
- **Backend:** Firestore + Firebase Auth (Apple Sign-In). Uses its **own
  dedicated Firebase project** (`family-medical-tracker-686ad`), separate
  from cards-tracker, because this is sensitive health data.
- **Access control is stricter than cards-tracker:** Firestore rules
  (`firestore.rules`) allowlist by sign-in email (Vishal + Kasthuri only),
  default-deny everything else. cards-tracker has no comparable rules file
  (single-user app). See `PROJECT_BRIEF.md` for the current state of the two
  `REPLACE_WITH_..._SIGNIN_EMAIL` placeholders — **the app does not work for
  anyone until those are filled in and the rules are deployed.**

## Running locally

```bash
python3 -m http.server 3456
# Open http://localhost:3456
```

## Module map (`js/`)

| File | Responsibility |
|---|---|
| `config.js` | Firebase app init; exports `auth`/`db`. **Wired up to the real `family-medical-tracker-686ad` project** (2026-07-02). |
| `auth.js` | Apple Sign-In (identical pattern to cards-tracker) |
| `app.js` | Auth state listener, member-tab switching, modal wiring, `window.*` handlers for onclick |
| `profile.js` | Personal Information — one Firestore doc per member, read + edit modal |
| `records.js` | **Generic CRUD for all 9 record sections** (conditions, medications, allergies, surgeries, vaccinations, doctors, consultations, labResults, healthRecommendations). No per-section code — behavior comes entirely from each section's `fields` config in `utils.js`. Adding a new field or section means editing `SECTIONS` in `utils.js`, not this file. |
| `utils.js` | `MEMBERS`, `SECTIONS` (the schema/CRUD-driving config), `PERSONAL_INFO_FIELDS`, `escapeHtml` |

## Firestore schema

```
familyMembers/{memberId}                              — personal info doc
familyMembers/{memberId}/{sectionId}/{docId}           — one of 9 subcollections
```
`memberId` ∈ `vishal`, `kasthuri`, `kimaya`, `son`. `sectionId` ∈ the 9 ids in
`utils.js::SECTIONS`. All dates are stored as free-text strings, not
Firestore Timestamps — the source spreadsheet's dates aren't consistently
formatted enough to type them safely on import (see `PROJECT_BRIEF.md`).

## Import script

`scripts/import_from_xlsx.py` — one-time xlsx → Firestore migration.
Section/column detection is keyword-based (not positional) because header
text varies slightly sheet-to-sheet. Run `--dry-run` first. See
`PROJECT_BRIEF.md` for the two known data-quality gaps it will flag
(Kimaya's Allergies/Doctors sections lack header rows in the source file).

---

## STATUS

**Last updated:** 2026-07-02

### Recently shipped
- 2026-07-02: **Firebase project created and wired up.** Vishal created a
  dedicated Firebase project (`family-medical-tracker-686ad`) and pasted its
  web app config; `js/config.js` now points at the real project instead of
  `TODO_REPLACE` placeholders. **Still not verified live** — Firestore
  database, Apple Sign-In provider, authorized domains, the rules deploy,
  and the two real sign-in emails for `firestore.rules` are all still
  pending on the Firebase-console side (see PROJECT_BRIEF.md's numbered
  setup checklist). Don't assume sign-in works yet until those are done.
- 2026-07-02: **Initial scaffold.** Full architecture stood up from scratch:
  `index.html`, `css/style.css` (ported from cards-tracker, trimmed of
  finance-specific chrome), `js/{config,auth,utils,profile,records,app}.js`,
  `firestore.rules` (email-allowlist + default-deny), and
  `scripts/import_from_xlsx.py`. Decisions made this session: new dedicated
  Firebase project (not shared with cards-tracker), Vishal+Kasthuri access
  only, Apple Sign-In to match cards-tracker. Import script's `--dry-run`
  was tested against the real `Family_Medical_Record.xlsx` and correctly
  extracted profile fields + 200+ records across the three populated member
  sheets.

### In progress / pending
- Firestore database not confirmed created yet in the new project.
- Apple Sign-In provider not confirmed enabled in the new project (needs
  Apple Developer Services ID / Team ID / Key ID / private key, plus the
  new project's authDomain added as a return URL on the Apple side).
- Authorized domains (localhost + eventual hosting domain) not confirmed.
- `firestore.rules` still has the two `REPLACE_WITH_..._SIGNIN_EMAIL`
  placeholders — not deployed yet. Get the real emails by having both
  Vishal and Kasthuri sign in once and checking Authentication → Users.
- Cross-member search/filter/query view not built yet (brief's "retrieving
  and querying records" ask) — currently one member/one section at a time.
- Hosting not set up (planned: GitHub Pages + custom domain, matching
  cards-tracker).
- Real Firestore import not run (only `--dry-run`); needs a service account
  key from the new project first.

### Open ideas / not started
- Natural-language "ask questions about the records" via an LLM over the DB
  (mentioned in the original brief as a later nice-to-have).
