# CLAUDE.md — medical-records

> **For AI assistants.** Read this first, then `PROJECT_BRIEF.md` for full
> architectural detail and history. Update the **STATUS** section below at
> the end of every session.

## Identity

Family Medical Records web app for the Parwani family (Vishal, Kasthuri,
Kimaya, Son). A static single-page web app storing what used to live in
`Family_Medical_Record.xlsx`. **The xlsx itself is NOT in this repo** — it
was purged from git history entirely (see STATUS 2026-07-03) once its data
was imported into Firestore, because the repo is now public and the xlsx
held real unredacted health data. If you need the original spreadsheet
structure for reference, it's documented in `PROJECT_BRIEF.md`, not in git.

- **Stack:** Plain HTML + ES-module JS + CSS. No build step, no bundler.
  Deliberately mirrors the sibling `vishal-parwani/cards-tracker` repo's
  architecture, fonts, colors, and Apple Sign-In auth pattern — same author,
  same conventions.
- **Backend:** Firestore + Firebase Auth (Apple Sign-In). Uses its **own
  dedicated Firebase project** (`family-medical-tracker-686ad`), separate
  from cards-tracker, because this is sensitive health data.
- **Live site:** `https://health.vishalparwani.com` — GitHub Pages serving
  `main`, custom domain via the `CNAME` file, same deploy convention as
  cards-tracker (deploy = merge to `main`).
- **Access control is stricter than cards-tracker:** Firestore rules
  (`firestore.rules`) allowlist by sign-in email (`vishal.parwani@gmail.com`,
  `kasthuri.p@gmail.com`), default-deny everything else. cards-tracker has
  no comparable rules file (single-user app). **Deployed and live** —
  published via the Firebase Console Rules tab (no `firebase.json`/CLI setup
  in this repo, deployed by pasting the file's contents into the console).

## Running locally

```bash
python3 -m http.server 3456
# Open http://localhost:3456
```

## Module map (`js/`)

| File | Responsibility |
|---|---|
| `config.js` | Firebase app init; exports `auth`/`db`. Wired to the real `family-medical-tracker-686ad` project. |
| `auth.js` | Apple Sign-In — `signInWithPopup`, identical pattern to cards-tracker (see STATUS 2026-07-03 for why this specific method matters). |
| `app.js` | Auth state listener, member-tab switching, modal wiring, global search wiring, `window.*` handlers for onclick |
| `profile.js` | Personal Information — one Firestore doc per member, read + edit modal |
| `records.js` | **Generic CRUD for all 9 record sections** (conditions, medications, allergies, surgeries, vaccinations, doctors, consultations, labResults, healthRecommendations). No per-section code — behavior comes entirely from each section's `fields` config in `utils.js`. Adding a new field or section means editing `SECTIONS` in `utils.js`, not this file. |
| `search.js` | Cross-member, cross-section search. Client-side, in-memory cache per member/section (and per-member profile), invalidated by `records.js`/`profile.js` on save/delete. `app.js` wires the search bar UI and jumping to a result (switches member tab, reloads the target section so `records.js`'s internal cache matches, opens the edit modal). |
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

**Real data is imported and live** (2026-07-03): Vishal 52 records/10
profile fields, Kasthuri 97/5, Kimaya 78/11, Son 0 (empty sheet, as
expected). Two known gaps needing manual entry: Kimaya's Allergies and
Doctors sections had no header row in the source xlsx, so the import
script couldn't map them — add that data by hand via the app.

## Import script

`scripts/import_from_xlsx.py` — one-time xlsx → Firestore migration,
**already run** against production (2026-07-03). Section/column detection
is keyword-based (not positional) because header text varies slightly
sheet-to-sheet. It's a one-time script — re-running it against the
now-populated database would append duplicates, not upsert. The source
xlsx is no longer in this repo (see Identity above); if you need to
re-import from scratch, the file lives only wherever Vishal kept a local
copy outside git.

---

## Conventions

- **When debugging something that has a known-working reference
  implementation elsewhere (e.g. cards-tracker for anything Firebase/Apple
  Sign-In related), compare the actual config/code FIRST before proposing
  new theories or new infrastructure.** This session burned real time on
  Safari-ITP and custom-authDomain theories for a broken Apple Sign-In
  before actually diffing against cards-tracker's Firebase Apple provider
  config, which immediately surfaced the real (much simpler) cause — see
  STATUS 2026-07-03. Don't repeat that: read the sibling repo's code/config
  before inventing an explanation.
- Don't create new files unless necessary; prefer editing existing modules.
- Don't add comments explaining what code does; only add a comment if
  there's a non-obvious reason a particular line exists.

---

## STATUS

**Last updated:** 2026-07-03

### Recently shipped
- 2026-07-03: **App is fully live and working end-to-end.** Sign-in,
  Firestore rules, hosting, and real data are all confirmed in production:
  - **Apple Sign-In fixed and verified.** Root cause of "nothing happens" /
    "reaches Apple then bounces back with no error": this project's
    Firebase Apple provider was configured with only a Services ID —
    Firebase lets you save it that way with no warning, but sign-in can't
    actually complete without also copying the **OAuth code flow
    configuration** (Team ID / Key ID / Private Key) from an already-working
    Apple provider (cards-tracker's). Once that was copied over, reverted
    `auth.js` from an interim `signInWithRedirect` experiment back to
    `signInWithPopup` (cards-tracker's proven pattern) — no remaining
    reason to diverge once the real config gap was closed. Full writeup in
    cards-tracker's `CLAUDE.md` ("Reusing this project's Apple Sign-In for a
    NEW Firebase project") since it applies to any future project reusing
    that Services ID.
  - **Firestore rules deployed** with the real allowlist emails
    (`vishal.parwani@gmail.com`, `kasthuri.p@gmail.com`), published via the
    Firebase Console Rules tab.
  - **Real data imported** via `scripts/import_from_xlsx.py` (see Firestore
    schema section above for counts / known gaps).
  - **Hosting live**: repo made public, GitHub Pages serving `main`, custom
    domain `health.vishalparwani.com` (CNAME record at Enom, same registrar
    as cards.vishalparwani.com), HTTPS enforced.
  - **`Family_Medical_Record.xlsx` purged from git entirely** (`git
    filter-repo`, force-pushed to `main` and both feature branches) before
    making the repo public — it held real unredacted health data and would
    otherwise have been publicly downloadable once Pages/public-repo were
    live.
  - **Cross-member search built** (`js/search.js`) — closes the brief's
    "retrieving and querying records" ask that was still open going into
    this session.
- 2026-07-02: **Firebase project created and wired up**, initial app
  scaffold (auth, generic record CRUD, Firestore rules skeleton, import
  script) stood up from scratch. See prior STATUS entries in git history
  for full detail.

### In progress / pending
- **Kimaya's Allergies and Doctors sections need manual entry** — the
  source xlsx had no header row for those two sections on her sheet, so the
  import script couldn't map the data and skipped it (flagged in its
  output, not silently dropped).
- **Not yet exercised: full CRUD round-trip in production** — sign-in and
  data loading are confirmed working, but add/edit/delete on a record and
  the personal-info edit modal haven't been explicitly tested against the
  live site yet. Worth a quick pass.
- Natural-language "ask questions about the records" via an LLM over the DB
  (mentioned in the original brief as a later nice-to-have) — not started.
