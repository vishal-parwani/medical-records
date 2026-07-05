# Health-insurance evaluation — session handoff

> **Purpose.** Context transfer for a *new* Claude Code session (e.g. a local one)
> to continue the family health-insurance selection without re-deriving everything.
>
> **PRIVACY — read first.** This file is **health-free and PII-free by design**,
> because this repo is **public**. It contains **no** medical details and **no**
> personal identifiers (no DOBs, phone, exact address). The medical layer lives
> **only in Firestore** (`family-medical-tracker-686ad`) and must be re-read there
> with the Admin service-account key — never copied into this repo. Personal
> identifiers (DOBs, PIN, mobile) are held by the user and entered directly into
> the new session, not committed here.

---

## 1. The task

Pick the best health-insurance cover for a **family floater, 4 members** (2 adults,
2 children), based in **Chennai**. Evaluated against a 46-point checklist the user
prepared (room rent, co-pay, sub-limits, restoration, waiting periods, OPD/dental,
AYUSH, insurer reliability, etc.).

**Latest stated priorities (these override the earlier "value" framing):**
- **Premium is no barrier.**
- Goal is **best coverage + least friction** (fewest claim-time disputes / fewest moving parts).
- No maternity needed (family complete).
- Heavy outpatient usage → OPD + dental genuinely wanted.

## 2. Shortlist (all clear the hard non-negotiables: no room cap, 0 co-pay, no base deductible, no sub-limits)

| Plan | Insurer | Note |
|---|---|---|
| Optima Secure | HDFC Ergo | Best claims reliability; consumables/2×/bonus in-built; **OPD+dental are paid add-ons** |
| Medicare Premier | Tata AIG | **24-mo PED (all conditions)**; OPD+dental+consumables in-built; only firm price (~₹60.5k/₹1cr Zone-B) |
| ProHealth Prime (Advantage + Prime Plus) | ManipalCigna | **Richest built-in OPD+dental+AYUSH-OPD**; 24-mo PED; needs Prime Plus for any-room; Chennai = Zone II |
| Elevate | ICICI Lombard | Unlimited reset, best solvency (2.69×), strong OPD+ add-on; headline CSR noisy |
| ReAssure 2.0 (Titanium+) | Niva Bupa | **Only plan that can fully REMOVE the PED wait**; unlimited restoration; **busiest claims desk** |
| Care Supreme | Care Health | Cheapest clean ₹1cr; **no real OPD/dental**; low ICR + high rejection disputes |
| *(alt)* Activ One | Aditya Birla | Best bonus engine; day-1 PED for lifestyle conditions only |

Dropped: Star Comprehensive (room cap; worst complaints), Bajaj Health Guard
(one-time restore, no OPD, consumables excluded), Go Digit (cap-first), Niva Aspire
(force-bundled maternity).

## 3. Two ways the ranking was cut

- **Fully-loaded value (when cost mattered):** Tata #1, ManipalCigna #2 (fewest riders
  needed), then HDFC, ICICI, Niva, Care. See `shortlist.html`.
- **Least-friction (current priority, cost no barrier):** the value case dissolves.
  Decision now rests on **claim-desk reliability + waiting-period exposure + how much is in-built.**

## 4. Reliability / denial record (weight this over headline CSR)

| Insurer | CSR (count) | ICR (value payout) | Complaints/10k | Ombudsman rejections |
|---|---|---|---|---|
| HDFC Ergo | ~96.7–97.4% | ~79–85% (generous) | ~9–15 | Low |
| Tata AIG | ~86.6% | mid | ~9.8 | Low |
| ICICI Lombard | ~84.5–97% (noisy) | ~82% | ~9–14 | Low |
| ManipalCigna | ~93.7% | ~74.8% | ~23 | Moderate |
| Niva Bupa | ~92.4% | ~61% | ~43 | high (~1,770) |
| Care Health | ~96.7% | ~64.5% (low) | ~42 | high (~2,393) |
| Star (excluded) | ~99% | ~70% | ~52 | ~10,000+ |

Note: IRDAI opened enforcement (Jun 2025) against 8 majors (incl. HDFC, ICICI, Tata,
Niva, Care, ManipalCigna) for rejections/deductions → wording protects you, not brand.
Ombudsman upholds ~71% of complaints for policyholders → disclose fully, keep paperwork.

## 5. Current recommendation (cost no barrier · least friction)

- **Lead: HDFC Ergo Optima Secure, single large base**, fully loaded (Unlimited Restore +
  Optima Wellbeing OPD/dental + PED-reduction). Near-maximal coverage + the **steadiest
  claims desk** (the friction that hurts most). Residual weakness: 36-mo PED on
  non-lifestyle conditions.
- **Switch to Tata Medicare Premier** if the **shortest waiting clock across *all*
  conditions** (24-mo, everything in-built) matters more than raw claims-desk record.
- **Niva ReAssure 2.0** is the only one that can *remove* the PED wait — but worst claims desk.

## 6. Structure decision

**One single ₹1 crore base (consider ₹2 crore / infinite SI).** NOT base + super top-up —
that split's only merit was saving premium (now irrelevant) and it *adds* friction
(two policies, deductible mechanics, split benefits). Never use employer cover to meet a
top-up deductible (vanishes on job change).

## 7. Open actions for the next session

1. **Live quotes** (network was blocked in the remote container; a local session with a
   browser tool can run them). Use the runbook template below.
2. **Re-read Firestore** (Admin SDK, `familyMembers/*`) to reload the medical layer that
   weights waiting-period / underwriting exposure. Do **not** copy specifics into this repo.
3. **Get the ANA repeat/rheumatology report** from the user (they state a later test was
   negative; the document was not in Firestore as of this session — verify).
4. **Disclose every condition in writing** at proposal (top reason claims are voided);
   full disclosure starts the 60-month moratorium.
5. **Compare underwriting *offers*** (loadings/exclusions) across 2–3 insurers — for this
   family the verdict on the two adults' declared conditions matters more than feature deltas.

## 8. Quote runbook (template — user fills the < > placeholders live)

**Members:** Adult1 M `<DOB>`, Adult2 F `<DOB>`, Child1 F `<DOB>`, Child2 M `<DOB>` — one floater.
**Location:** Chennai, PIN `<PIN>` · Email: `dummy@vishalparwani.com` · **OTP phone: user's real mobile.**
**Medical questions:** answer truthfully from the Firestore record (re-read it). ANA = negative
(pending the user's repeat report).

1. **HDFC Ergo → Optima Secure** → 4 members, PIN → capture base at **₹1cr and ₹2cr**, then
   add-on deltas: **Unlimited Restore, Optima Wellbeing (OPD/dental), PED-reduction/ABCD**.
2. **Tata AIG → Medicare Premier** → capture base at **₹1cr and ₹2cr** (OPD/dental/consumables
   in-built; PED 24-mo — no riders).
3. **ManipalCigna → ProHealth Prime (Advantage)** → SI **₹1cr**, add **Prime Plus** → capture
   base + Prime Plus (OPD/dental/AYUSH-OPD/consumables in-built).
4. *(optional)* ICICI Elevate, Niva ReAssure 2.0.

Capture: `Insurer | SI | base (incl GST) | +each add-on | total`, then hand back for the
fully-loaded + friction comparison.

---

*Deliverable artifact: `insurance-eval/shortlist.html` (health-free visual scorecard).
Also published as a private Claude Artifact during the originating session.*
