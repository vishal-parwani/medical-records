# Family Medical Records Web App — Project Brief

## Goal
Build a web app to store, update, retrieve, and query the family's medical
records that used to live in `Family_Medical_Record.xlsx`. Must support:
- Storing all existing info from the Excel file
- Updating records when new info is provided
- Retrieving and querying records when needed

**Status: live and working.** `https://health.vishalparwani.com`, real data
imported, cross-member search built. See `CLAUDE.md`'s STATUS section for
the full changelog; this file keeps the source-data structure notes and
architecture rationale that don't belong in a running-status log.

## Source data: `Family_Medical_Record.xlsx`
**The xlsx is no longer in this repo** — purged from git history entirely
once imported, because the repo is now public and the file held real
unredacted health data (see `CLAUDE.md` STATUS 2026-07-03). Structure, for
reference (verified by reading the file before it was removed):
- **Sheets:** `Dashboard`, `Vishal`, `Kimaya`, `Son`, `Kasthuri`
  (one sheet per family member + an overview dashboard)
- The family: Parwani family, Chennai. Members: Vishal (father, b. 28 Nov 1981),
  Kasthuri (mother/spouse), Kimaya (daughter, b. 18 Dec 2011), Son (sheet mostly empty).

### Per-member sheet sections
Each member sheet had a title row + "Last Updated" row, then section blocks
marked by a `"  SECTION NAME"` row (two leading spaces) followed by a header
row and data rows:
1. PERSONAL INFORMATION, 2. ACTIVE CONDITIONS / DIAGNOSES, 3. CURRENT
   MEDICATIONS, 4. ALLERGIES, 5. SURGERIES & PROCEDURES, 6. VACCINATIONS,
   7. DOCTORS & SPECIALISTS, 8. CONSULTATION HISTORY, 9. LAB RESULTS & REPORTS.

Confirmed during a second, deeper pass (inspecting actual cell contents, not
just the sheet-level summary) before the file was removed:
- Vishal and Kasthuri also had a **10th section, HEALTH RECOMMENDATIONS**
  (Test/Recommendation, Frequency, Tests to Include, Next Due, Priority,
  Notes) — not in the original brief, now modeled as `healthRecommendations`.
- Vishal's sheet split Consultation History into three blocks (general +
  "— OPHTHALMOLOGY" + "— GASTROENTEROLOGY" sub-sections). Same schema, just
  grouped by specialist for readability — the app merges them into one
  `consultations` list per member; the specialist distinction still lives in
  each row's own Speciality/Doctor columns.
- **Data-quality gaps, not app bugs:** Kimaya's ALLERGIES and DOCTORS &
  SPECIALISTS sections had no header row in the source sheet (data started
  immediately after the section title), and the DOCTORS rows were mostly
  half-filled (Speciality only, no name/hospital/phone for several rows).
  The import script detected and reported these instead of guessing — they
  still need fixing by hand in the live app (see `CLAUDE.md` pending list).
- Column headers varied slightly between sheets for the same section (e.g.
  Vaccinations: Vishal had "Date Given"/"Due/Booster Date"/"Batch No.",
  Kasthuri had "Date"/"Dose"). The app's schema normalizes these into one
  shared shape (`vaccinations.doseOrBooster` covers dose/booster/batch); the
  import script mapped by keyword match per column, not by position.
- Dates throughout were free text, not consistently formatted ("28 Nov 1981",
  "~1983", "pre-2024", "Apr 2023 (first documented)") — the app stores all
  dates as plain strings rather than typed dates. Converting to real dates
  later is possible but would require manually normalizing every row first;
  deferred rather than silently guessing/dropping ambiguous entries.

Data richness: Kimaya's sheet had 145 rows (detailed consultation history,
vaccinations, labs back to birth). Kasthuri (205 rows) and Vishal (119 rows)
were also substantial. Son's sheet was an empty template (kept as a 4th
member so the schema doesn't need to change if it's filled in later).

## Architecture
- **Stack — mirrors `cards-tracker` exactly, per Vishal's stated preference**:
  plain HTML + ES-module JS + CSS, no build step, no bundler. Firebase SDK
  loaded from CDN as ES modules (`js/config.js`).
- **Auth:** Firebase Auth, Apple Sign-In (`js/auth.js`, `signInWithPopup` —
  identical pattern to cards-tracker's `js/auth.js`). Getting this working
  required copying cards-tracker's Apple provider **OAuth code flow
  configuration** (Team ID/Key ID/Private Key) into this project's Firebase
  console, not just the Services ID — see cards-tracker's `CLAUDE.md` for
  the full writeup, since it applies to any future project reusing that
  Services ID.
- **Firebase project: a NEW, dedicated project** (`family-medical-tracker-686ad`,
  not shared with cards-tracker) — decided so this sensitive health data has
  its own auth/rules/billing blast radius.
- **Access: Vishal + Kasthuri only**, enforced two ways:
  1. Firestore security rules (`firestore.rules`) check
     `request.auth.token.email` against a hardcoded allowlist
     (`vishal.parwani@gmail.com`, `kasthuri.p@gmail.com`) on every
     read/write, with a default-deny fallback rule for anything else. This
     is **stronger than cards-tracker** (single-user app, no comparable
     rules file) because this is health data for two people, not one.
  2. Rules are **deployed** (published via the Firebase Console Rules tab).
- **Hosting:** GitHub Pages serving `main`, custom domain
  `health.vishalparwani.com` (CNAME record at Enom — same registrar as
  cards.vishalparwani.com), HTTPS enforced. Repo is public (required for
  free GitHub Pages); made safe to do so only after purging the xlsx from
  git history.
- **Theme:** `css/style.css` reuses cards-tracker's palette/fonts verbatim
  (Nunito, cream `#f5ede4` background, terracotta `#c4845a` accent, brown
  `#5c3d2e` header) minus the finance-specific chrome (charts, VT chips, AEP
  ribbons) that doesn't apply here.

### Firestore schema
```
familyMembers/{memberId}                 — one doc per member (personal info)
  { name, dob, age, bloodGroup, primaryDoctor, doctorPhone, healthInsurance,
    policyNumber, emergencyContact, emergencyPhone, birthDetails, notes }

familyMembers/{memberId}/conditions/{id}
familyMembers/{memberId}/medications/{id}
familyMembers/{memberId}/allergies/{id}
familyMembers/{memberId}/surgeries/{id}
familyMembers/{memberId}/vaccinations/{id}
familyMembers/{memberId}/doctors/{id}
familyMembers/{memberId}/consultations/{id}
familyMembers/{memberId}/labResults/{id}
familyMembers/{memberId}/healthRecommendations/{id}
```
Field shapes for each subcollection are defined once, in `js/utils.js`
(`SECTIONS` array) — that's also what drives the generic CRUD UI, so adding
a field means editing one array, not touching every screen.
`memberId` values: `vishal`, `kasthuri`, `kimaya`, `son` (`js/utils.js::MEMBERS`).

**Real data is imported** (2026-07-03): Vishal 52 records/10 profile fields,
Kasthuri 97/5, Kimaya 78/11, Son 0 (empty sheet). Kimaya's Allergies/Doctors
still need manual entry (see gaps noted above).

### UI implemented
- Member tab nav (Vishal / Kasthuri / Kimaya / Son) — switches which
  member's records are shown.
- Personal Information: read-only card + edit modal (`js/profile.js`).
- All 9 record sections share **one generic CRUD module** (`js/records.js`):
  a data table (title col + first 3 fields + actions) with Add/Edit/Delete,
  driven entirely by each section's `fields` config in `js/utils.js` — no
  per-section code. Mobile: tables collapse to stacked cards below 600px,
  same convention as cards-tracker.
- **Cross-member search built** (`js/search.js`) — a search bar above the
  member tabs queries every member's personal info + all 9 record sections,
  shows matches grouped by member/section, jumping to a result switches
  tabs/scrolls/opens the edit modal directly. Closes the brief's
  "retrieving and querying records" ask.

### One-time import script
`scripts/import_from_xlsx.py` (openpyxl + firebase-admin) — **already run
against production**. Parsed each member sheet's section markers, mapped
header cells to canonical field keys by keyword (not position, since
headers varied slightly per sheet). It's a one-time script — re-running
against the now-populated database would append duplicates, not upsert.

## Still open / next steps
1. **Kimaya's Allergies and Doctors sections need manual entry** (data-quality
   gap in the source file, not an app bug — see above).
2. **Full CRUD round-trip not yet explicitly exercised in production** —
   sign-in and data loading are confirmed working, but add/edit/delete on a
   record and the personal-info edit modal haven't been explicitly tested
   against the live site yet.
3. Natural-language "ask questions about the records" via an LLM over the DB
   (mentioned in the original brief as a later nice-to-have) — not started.

## Cross-repo conventions
Deliberately mirrors `vishal-parwani/cards-tracker`: same no-build-step
architecture, same Apple Sign-In pattern, same fonts/colors, same
mobile-table-collapses-to-cards convention, same `window.*` pattern for
modal-opener functions bound to HTML `onclick` handlers, same GitHub Pages +
custom domain + "deploy = merge to main" hosting convention. Diverges only
where the data is genuinely different (per-member subcollections instead of
a flat transactions collection; stricter allowlisted Firestore rules
instead of "any signed-in user"; free-text dates instead of Firestore
Timestamps; no source spreadsheet committed to git, unlike nothing
comparable in cards-tracker).

## Git / workflow context
- Repo: `vishal-parwani/medical-records`
- Branches: `main` (live, deployed) and
  `claude/medical-records-onboarding-pda2su` (kept in sync with `main`).
- openpyxl was used to read/parse the xlsx before it was removed from git.
