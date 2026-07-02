# Family Medical Records Web App — Project Brief

## Goal
Build a web app to store, update, retrieve, and query the family's medical
records that currently live in `Family_Medical_Record.xlsx`. Must support:
- Storing all existing info from the Excel file
- Updating records when new info is provided
- Retrieving and querying records when needed

## Source data: `Family_Medical_Record.xlsx`
Structure (verified by reading the file):
- **Sheets:** `Dashboard`, `Vishal`, `Kimaya`, `Son`, `Kasthuri`
  (one sheet per family member + an overview dashboard)
- The family: Parwani family, Chennai. Members: Vishal (father, b. 28 Nov 1981),
  Kasthuri (mother/spouse), Kimaya (daughter, b. 18 Dec 2011), Son (sheet mostly empty).

### Per-member sheet sections
Each member sheet has a title row + "Last Updated" row, then section blocks
marked by a `"  SECTION NAME"` row (two leading spaces) followed by a header
row and data rows:
1. PERSONAL INFORMATION, 2. ACTIVE CONDITIONS / DIAGNOSES, 3. CURRENT
   MEDICATIONS, 4. ALLERGIES, 5. SURGERIES & PROCEDURES, 6. VACCINATIONS,
   7. DOCTORS & SPECIALISTS, 8. CONSULTATION HISTORY, 9. LAB RESULTS & REPORTS.

Confirmed during a second, deeper pass (inspecting actual cell contents, not
just the sheet-level summary):
- Vishal and Kasthuri also have a **10th section, HEALTH RECOMMENDATIONS**
  (Test/Recommendation, Frequency, Tests to Include, Next Due, Priority,
  Notes) — not in the original brief, now modeled as `healthRecommendations`.
- Vishal's sheet splits Consultation History into three blocks (general +
  "— OPHTHALMOLOGY" + "— GASTROENTEROLOGY" sub-sections). These are the same
  schema, just grouped by specialist in the spreadsheet for readability — the
  app merges them into one `consultations` list per member; the specialist
  distinction still lives in each row's own Speciality/Doctor columns.
- **Data-quality gaps, not app bugs:** Kimaya's ALLERGIES and DOCTORS &
  SPECIALISTS sections have no header row in the source sheet (data starts
  immediately after the section title), and the DOCTORS rows are mostly
  half-filled (Speciality only, no name/hospital/phone for several rows). The
  import script (`scripts/import_from_xlsx.py`) detects and reports rows it
  can't confidently map instead of guessing — check its printed "skipped"
  list after any import run and fix those two spots by hand in the app.
- Column headers vary slightly between sheets for the same section (e.g.
  Vaccinations: Vishal has "Date Given"/"Due/Booster Date"/"Batch No.",
  Kasthuri has "Date"/"Dose"). The app's schema normalizes these into one
  shared shape (`vaccinations.doseOrBooster` covers dose/booster/batch); the
  import script maps by keyword match per column, not by position.
- Dates throughout are free text, not consistently formatted ("28 Nov 1981",
  "~1983", "pre-2024", "Apr 2023 (first documented)") — the app stores all
  dates as plain strings rather than typed dates. Converting to real dates
  later is possible but would require manually normalizing every row first;
  deferred rather than silently guessing/dropping ambiguous entries.

Data richness: Kimaya's sheet has 145 rows (detailed consultation history,
vaccinations, labs back to birth). Kasthuri (205 rows) and Vishal (119 rows)
are also substantial. Son's sheet is an empty template (kept as a 4th member
so the schema doesn't need to change if it's filled in later).

## Architecture (implemented this session)
- **Stack — mirrors `cards-tracker` exactly, per Vishal's stated preference**:
  plain HTML + ES-module JS + CSS, no build step, no bundler. Firebase SDK
  loaded from CDN as ES modules (`js/config.js`).
- **Auth:** Firebase Auth, Apple Sign-In (`js/auth.js`, identical pattern to
  cards-tracker's `js/auth.js`).
- **Firebase project: a NEW, dedicated project** (not shared with
  cards-tracker) — decided so this sensitive health data has its own
  auth/rules/billing blast radius. `js/config.js` currently has placeholder
  `TODO_REPLACE` values; fill in from Firebase Console → Project settings
  once the project is created.
- **Access: Vishal + Kasthuri only**, enforced two ways:
  1. Firestore security rules (`firestore.rules`) check
     `request.auth.token.email` against a hardcoded allowlist on every
     read/write, with a default-deny fallback rule for anything else. This
     is **stronger than cards-tracker** (single-user app, no comparable
     rules file) because this is health data for two people, not one.
  2. `firestore.rules` currently has two `REPLACE_WITH_..._SIGNIN_EMAIL`
     placeholders — **must be filled in with the real sign-in emails**
     before the rules are deployed, otherwise nobody (including Vishal) can
     read/write. Apple Sign-In may hand back a private relay address; use
     whatever email actually appears in Firebase Console → Authentication →
     Users after each person's first sign-in attempt.
- **Hosting:** not yet set up — plan is GitHub Pages + custom domain,
  matching cards-tracker's convention, once a domain/subdomain is chosen.
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

### UI implemented
- Member tab nav (Vishal / Kasthuri / Kimaya / Son) — switches which
  member's records are shown.
- Personal Information: read-only card + edit modal (`js/profile.js`).
- All 9 record sections share **one generic CRUD module** (`js/records.js`):
  a data table (title col + first 3 fields + actions) with Add/Edit/Delete,
  driven entirely by each section's `fields` config in `js/utils.js` — no
  per-section code. Mobile: tables collapse to stacked cards below 600px,
  same convention as cards-tracker.
- Not yet built: search/filter/query view across all records (brief's
  "retrieving and querying records" ask) — currently you can only browse one
  member's one section table at a time. Natural next step once the basic
  CRUD is verified end-to-end.

### One-time import script
`scripts/import_from_xlsx.py` (openpyxl + firebase-admin). Parses each
member sheet's section markers, maps header cells to canonical field keys by
keyword (not position, since headers vary slightly per sheet), and either
prints a dry-run plan (`--dry-run`, no writes) or imports into Firestore
using `GOOGLE_APPLICATION_CREDENTIALS`. **Dry-run tested against the real
xlsx this session** — correctly extracted 10-11 profile fields and 200+
records per member across the three populated sheets, and correctly flagged
the two spots it couldn't map (Kimaya's Allergies/Doctors — see data-quality
note above) instead of silently guessing. Not yet run for a real import
(needs a live Firestore project + service account key first). It's a
one-time script — re-running against a non-empty database appends
duplicates rather than upserting.

## Still open / next steps
1. Create the new Firebase project, enable Apple Sign-In, fill in
   `js/config.js`'s `TODO_REPLACE` values.
2. Fill in the two email placeholders in `firestore.rules` and deploy the
   rules (`firebase deploy --only firestore:rules`, once a `firebase.json`
   exists — not set up yet, no Firebase CLI config in this repo).
3. Get a service account key, run `scripts/import_from_xlsx.py` for real
   (start with `--dry-run` again against the live setup as a sanity check).
4. Decide hosting (GitHub Pages + custom domain, matching cards-tracker) and
   wire up a `CNAME` file.
5. Build the cross-member search/filter/query view.
6. Fix the two data-quality gaps flagged above (Kimaya Allergies/Doctors) by
   hand once the app is live.
7. **Not verified live** — no Firebase project exists yet, so none of the
   auth/CRUD/rules code has been run in a browser. Once step 1-2 are done,
   sign in as both Vishal and Kasthuri and confirm: tab switching, personal
   info edit, add/edit/delete on at least one record section, and that the
   Firestore rules actually block a third account.

## Cross-repo conventions
Deliberately mirrors `vishal-parwani/cards-tracker`: same no-build-step
architecture, same Apple Sign-In pattern, same fonts/colors, same
mobile-table-collapses-to-cards convention, same `window.*` pattern for
modal-opener functions bound to HTML `onclick` handlers. Diverges only where
the data is genuinely different (per-member subcollections instead of a flat
transactions collection; stricter allowlisted Firestore rules instead of
"any signed-in user"; free-text dates instead of Firestore Timestamps).

## Git / workflow context
- Working branch: `claude/medical-records-onboarding-pda2su`
- Repo: `vishal-parwani/medical-records`
- openpyxl was used to read/parse the xlsx.
