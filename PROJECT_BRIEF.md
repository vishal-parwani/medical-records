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

### Per-member sheet sections (consistent across members)
Each member sheet has a title row + "Last Updated" row, then these sections:
1. **PERSONAL INFORMATION** — Full Name, DOB, Age, Blood Group, Primary Doctor,
   Doctor Phone, Health Insurance, Policy Number, Emergency Contact, Emergency Phone,
   Birth Details (for Kimaya).
2. **ACTIVE CONDITIONS / DIAGNOSES** — Condition, Date Diagnosed, Status
   (Active/Resolved), Treating Doctor, Hospital/Clinic, Notes.
3. **CURRENT MEDICATIONS** — Medication, Dosage, Frequency, Prescribed By,
   Start Date, End Date, Notes.
4. **ALLERGIES** — allergen, reaction, etc.
5. **SURGERIES & PROCEDURES** — Procedure, Date, Hospital, Surgeon/Doctor, Notes.
6. **VACCINATIONS** — Vaccine, Date, Hospital, Doctor, Clinic, Notes.
7. **DOCTORS & SPECIALISTS** — Specialty, Name, Address, Phone, Email, Notes.
8. **CONSULTATION HISTORY** — Date, Doctor, Speciality, Hospital, Reason for Visit,
   Diagnosis/Findings, Prescription/Action, Notes.
9. **LAB RESULTS & REPORTS** — Date, Test/Report, Result, Normal Range,
   Status (Normal/High/Low), Lab/Clinic, Ordered By, Notes.

The Dashboard sheet is a FAMILY OVERVIEW table: Member, DOB, Blood Group,
Key Conditions, Known Allergies, Current Medications, Primary Doctor, Last Updated.

Data richness note: Kimaya's sheet is the most complete (145 rows) with detailed
consultation history, vaccination records, and lab results going back to birth.
Kasthuri (205 rows) and Vishal (119 rows) also have substantial data. Son sheet
is essentially a blank template.

## Recommended architecture (agreed direction)
- Relational schema: a `family_members` table + one child table per section
  (conditions, medications, allergies, surgeries, vaccinations, doctors,
  consultations, lab_results), each foreign-keyed to member.
- One-time **import script** to parse the xlsx into the DB.
- CRUD forms per section + a search/filter/query view (by member, condition,
  date range, doctor, etc.).
- Optional later: natural-language "ask questions about the records" via an LLM
  over the DB.
- Private hosting (NOT a public URL / not a third-party low-code tool) because
  this is sensitive health data. Behind a login.

## User's stated preferences (from conversation)
- User has a **custom domain** available for hosting.
- Wants to **reuse conventions from their existing "cards tracker" project**:
  same login mechanism, fonts, color scheme, UI elements, and general preferences.

## OPEN QUESTIONS / BLOCKERS for next session
The assistant this session was **scoped to only the `vishal-parwani/medical-records`
repo** and could NOT read the cards-tracker project. To match it, the next session
needs from the user:
1. **Stack** of cards tracker (e.g. Next.js+React, Flask/FastAPI, static+Supabase, etc.)
   — ideally paste `package.json` / requirements, or grant repo access.
2. **Auth mechanism** used in cards tracker (share the login setup/files).
3. **Hosting setup** (platform + how the custom domain is wired; DB choice).
4. **Theme files** — fonts, colors, shared CSS / UI components to mirror.

Suggested defaults if user just wants to proceed:
- Next.js + React, SQLite (self-hosted) or Postgres (if multi-device),
  simple password or email+password auth, deploy to custom domain.

## Git / workflow context
- Working branch: `claude/family-medical-records-app-4117ce`
- Repo: `vishal-parwani/medical-records` (currently just the xlsx + README).
- openpyxl was used to read the xlsx (had to `pip install openpyxl`).

## Status
No code written yet. Waiting on cards-tracker reference details (stack/auth/theme/hosting)
before scaffolding.
