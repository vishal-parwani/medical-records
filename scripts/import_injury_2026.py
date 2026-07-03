"""One-time import: June 2026 right-clavicle fracture episode -> Firestore (Vishal).

Loads the records extracted from the hospital documents for Vishal's 13 Jun 2026
fall / right clavicle fracture and its surgical treatment into the same
familyMembers/{memberId}/{sectionId} schema the app uses (see js/utils.js).

Usage:
    pip install firebase-admin
    export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
    python3 scripts/import_injury_2026.py              # dry-run, writes nothing
    python3 scripts/import_injury_2026.py --commit     # actually writes
    python3 scripts/import_injury_2026.py --commit --update-profile  # + insurance

Unlike scripts/import_from_xlsx.py this script is idempotent: every record uses
a deterministic document id and is written with merge=True, so re-running it
updates the same docs instead of appending duplicates. Safe to re-run after
editing the data below. Dates are stored as free-text strings, matching the
rest of the database.
"""
import argparse
import sys

MEMBER_ID = 'vishal'

# section id (matches SECTIONS in js/utils.js) -> list of records.
# Each record MUST carry a stable '_id' (popped before write) so re-runs upsert.
RECORDS = {
    'conditions': [
        {
            '_id': 'injury2026-clavicle-fracture',
            'condition': 'Fracture of right clavicle (comminuted / multifragmentary, mid-shaft)',
            'dateDiagnosed': '13 Jun 2026',
            'status': 'Active — surgically fixed (ORIF 22 Jun 2026), healing',
            'treatingDoctor': 'Dr. Balamurugan J',
            'hospital': 'Kauvery Hospital / Apollo Spectra, Chennai',
            'notes': (
                'Fall at home on 13 Jun 2026 with injury to the right shoulder and the '
                'right side of the head. CT (13 Jun 2026) showed a comminuted fracture of '
                'the middle third of the right clavicle with mild angulation and surrounding '
                'soft-tissue edema; sternoclavicular and acromioclavicular joints normal, no '
                'subluxation/dislocation, no neurovascular compromise. Associated ~1 cm '
                'laceration of the right parietal scalp. Treated by ORIF of the right clavicle '
                'with acromioclavicular joint reconstruction on 22 Jun 2026.'
            ),
        },
    ],
    'surgeries': [
        {
            '_id': 'injury2026-orif-clavicle',
            'procedure': 'ORIF right clavicle with acromioclavicular joint (ACJ) reconstruction and coracoclavicular ligament repair',
            'date': '22 Jun 2026',
            'hospital': 'Apollo Spectra Hospitals, MRC Nagar, Chennai',
            'surgeon': 'Dr. Balamurugan J',
            'notes': (
                'Under general anaesthesia. Fracture reduced and fixed with lag screws and a '
                'Medtronic pre-contoured clavicle LCP plate (2.7/3.5) with locking/cortex '
                'screws; ACJ reconstruction and coracoclavicular ligament repair performed. '
                'Post-operative period uneventful. Admitted 21 Jun 2026, discharged 23 Jun 2026. '
                'Apollo MRN SMRC.0000051772.'
            ),
        },
    ],
    'consultations': [
        {
            '_id': 'injury2026-kauvery-er',
            'date': '13 Jun 2026',
            'doctor': 'Dr. William (ortho team)',
            'specialty': 'Emergency / Orthopaedics',
            'hospital': 'Kauvery Hospital, Alwarpet, Chennai',
            'reason': 'Fall at home (~08:00) with injury to right shoulder and right side of head',
            'diagnosis': (
                'Soft-tissue injury with right clavicle fracture; ~1 cm laceration of the right '
                'parietal scalp. Right shoulder tender, ROM painful and restricted. GCS 15/15, '
                'neurovascularly intact. No known allergies.'
            ),
            'prescription': (
                'Wound cleaning + T-Bact ointment, tetanus toxoid injection, right arm sling '
                'immobilisation, analgesics (Zerodol-P, Shelcal XT, Pantocid). Plan: ORIF.'
            ),
            'notes': 'ER discharge/transfer summary. Vitals stable (BP 140/90, SpO2 99%).',
        },
        {
            '_id': 'injury2026-drbala-opd',
            'date': '18 Jun 2026',
            'doctor': 'Dr. Balamurugan J',
            'specialty': 'Orthopaedics',
            'hospital': "Dr Bala's Ortho Clinic, Adyar, Chennai",
            'reason': 'Right shoulder pain — clavicle fracture review / surgical planning',
            'diagnosis': 'Proven right clavicle fracture (right shoulder); X-ray reviewed.',
            'prescription': (
                'Advised pre-operative workup — Surgipack 3 (CBC, ESR, CRP, blood grouping & Rh '
                'typing, renal function test, liver function test, 2D Echo, ECG). Advised ORIF '
                'right clavicle at Kauvery Hospital. Follow-up 20 Jun 2026.'
            ),
            'notes': '',
        },
    ],
    'labResults': [
        {
            '_id': 'injury2026-ct-shoulder',
            'date': '13 Jun 2026',
            'test': 'CT (Multislice) — Right Shoulder',
            'result': 'Comminuted fracture of the middle third of the right clavicle with mild angulation and surrounding soft-tissue edema',
            'normalRange': '',
            'status': 'Abnormal',
            'lab': 'Gemini Scans, Adyar',
            'orderedBy': 'Dr. Balamurugan J',
            'notes': (
                'SC and AC articulation normal; no subluxation/dislocation; no compression of '
                'subclavian vessels / brachial plexus; shoulder joint, humerus, coracoid and '
                'acromion normal. Reported by Dr. V. Ramkumar (Radiologist).'
            ),
        },
        {
            '_id': 'injury2026-xray-injury',
            'date': '13 Jun 2026',
            'test': 'X-ray — Right Shoulder Joint AP',
            'result': 'Right clavicle fracture',
            'normalRange': '',
            'status': 'Abnormal',
            'lab': 'Kauvery Hospital, Alwarpet',
            'orderedBy': 'Dr. William (ortho team)',
            'notes': 'Day-of-injury film.',
        },
        {
            '_id': 'injury2026-xray-preop',
            'date': '18 Jun 2026',
            'test': 'X-ray — Right Clavicle AP',
            'result': 'Right clavicle fracture (pre-operative)',
            'normalRange': '',
            'status': 'Abnormal',
            'lab': "Dr Bala's Ortho Clinic, Adyar",
            'orderedBy': 'Dr. Balamurugan J',
            'notes': 'Repeat film ~5 days after injury.',
        },
        {
            '_id': 'injury2026-xray-postop',
            'date': '22 Jun 2026',
            'test': 'X-ray — Right Clavicle (post-operative)',
            'result': 'LCP plate and screws in situ with good alignment of the reduced fracture',
            'normalRange': '',
            'status': 'Post-surgical',
            'lab': 'Apollo Spectra Hospitals',
            'orderedBy': 'Dr. Balamurugan J',
            'notes': 'Post-ORIF check film.',
        },
        {
            '_id': 'injury2026-cbc',
            'date': '21 Jun 2026',
            'test': 'Haemoglobin / CBC',
            'result': 'Hb 13.0 g/dL; TLC 6,840 /cu.mm; Platelets 2,52,000 /cu.mm',
            'normalRange': 'Hb 13–17 g/dL; TLC 4000–10000; Platelets 1.5–4.1 lakh',
            'status': 'Normal (Hb low-normal)',
            'lab': 'Apollo Spectra Hospitals',
            'orderedBy': 'Dr. Balamurugan J',
            'notes': 'Pre-operative Surgi Pack 2. Complete blood count within normal limits.',
        },
        {
            '_id': 'injury2026-coag',
            'date': '21 Jun 2026',
            'test': 'Coagulation profile (PT/INR, APTT)',
            'result': 'PT 15.8 s; INR 1.14; APTT 28.4 s',
            'normalRange': 'PT 11.6–16.6 s; APTT 28.3–36.0 s',
            'status': 'Normal',
            'lab': 'Apollo Spectra Hospitals',
            'orderedBy': 'Dr. Balamurugan J',
            'notes': 'Pre-operative; coagulation adequate for surgery.',
        },
        {
            '_id': 'injury2026-serology',
            'date': '21 Jun 2026',
            'test': 'Viral markers (HBsAg, HCV, HIV)',
            'result': 'HBsAg Non-reactive; HCV Negative; HIV Negative',
            'normalRange': 'Non-reactive / Negative',
            'status': 'Normal',
            'lab': 'Apollo Spectra Hospitals',
            'orderedBy': 'Dr. Balamurugan J',
            'notes': 'Routine pre-operative screening.',
        },
    ],
    'doctors': [
        {
            '_id': 'injury2026-dr-balamurugan',
            'specialty': 'Orthopaedics (Shoulder & Joint Reconstruction)',
            'name': 'Dr. Balamurugan J',
            'hospital': "Dr Bala's Ortho Clinic, Adyar / Kauvery Hospital, Chennai",
            'phone': '9790717766',
            'email': 'drbalaclinic@gmail.com',
            'notes': (
                'Operating surgeon for right clavicle ORIF (22 Jun 2026). Senior Consultant '
                'Orthopaedic Surgeon — MBBS, D.Ortho, DNB(Ortho), FIPO, FIAA(UK). Reg. No. 77924.'
            ),
        },
        {
            '_id': 'injury2026-dr-william',
            'specialty': 'Orthopaedics / Emergency',
            'name': 'Dr. William',
            'hospital': 'Kauvery Hospital, Alwarpet, Chennai',
            'phone': '',
            'email': '',
            'notes': 'Ortho team; attended in the ER on the day of injury (13 Jun 2026).',
        },
    ],
    'medications': [
        {
            '_id': 'injury2026-med-hifenac',
            'medication': 'Hifenac-P (aceclofenac + paracetamol)',
            'dosage': '1 tablet',
            'frequency': 'Twice daily, after food',
            'prescribedBy': 'Dr. Balamurugan J',
            'startDate': '23 Jun 2026',
            'endDate': '28 Jun 2026',
            'notes': 'Post-operative analgesia (5-day course).',
        },
        {
            '_id': 'injury2026-med-ultracet',
            'medication': 'Ultracet (tramadol + paracetamol)',
            'dosage': '1 tablet',
            'frequency': 'Twice daily, after food',
            'prescribedBy': 'Dr. Balamurugan J',
            'startDate': '23 Jun 2026',
            'endDate': '03 Jul 2026',
            'notes': 'Post-operative analgesia (10-day course).',
        },
        {
            '_id': 'injury2026-med-pand',
            'medication': 'Pan-D (pantoprazole + domperidone)',
            'dosage': '1 tablet',
            'frequency': 'Twice daily, before food',
            'prescribedBy': 'Dr. Balamurugan J',
            'startDate': '23 Jun 2026',
            'endDate': '03 Jul 2026',
            'notes': 'Gastric protection during the analgesic course (10 days).',
        },
        {
            '_id': 'injury2026-med-ccm',
            'medication': 'CCM (calcium + vitamin D3)',
            'dosage': '1 tablet',
            'frequency': 'Once daily, after food',
            'prescribedBy': 'Dr. Balamurugan J',
            'startDate': '23 Jun 2026',
            'endDate': '23 Jul 2026',
            'notes': 'Bone-healing support (1-month course).',
        },
    ],
    'healthRecommendations': [
        {
            '_id': 'injury2026-followup',
            'recommendation': 'Orthopaedic follow-up after right clavicle ORIF',
            'frequency': 'As advised post-op',
            'testsToInclude': 'Clinical review + check X-ray of the right clavicle',
            'nextDue': 'Review with Dr. Balamurugan J after 13 Jul 2026',
            'priority': 'High',
            'notes': (
                'Discharge advice: gentle shoulder active exercises and active elbow/wrist ROM. '
                'Dressing 28 Jun 2026; suture removal 05 Jul 2026.'
            ),
        },
    ],
}

# Written to the member's personal-info doc only when --update-profile is passed,
# so existing imported profile fields are never clobbered by accident.
PROFILE_UPDATE = {
    'healthInsurance': 'Niva Bupa Health Insurance (cashless)',
    'policyNumber': 'Member ID 1037468051 (valid 04 Sep 2025 – 03 Sep 2026)',
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--commit', action='store_true',
                        help='actually write to Firestore (default: dry-run)')
    parser.add_argument('--update-profile', action='store_true',
                        help='also merge insurance fields into the personal-info doc')
    args = parser.parse_args()

    total = sum(len(v) for v in RECORDS.values())
    print(f'=== Import plan for member "{MEMBER_ID}" ({total} records) ===')
    for section_id, rows in RECORDS.items():
        print(f'\n{section_id}: {len(rows)} record(s)')
        for r in rows:
            title = r.get('condition') or r.get('procedure') or r.get('medication') \
                or r.get('test') or r.get('name') or r.get('recommendation') or r.get('date')
            print(f'  - [{r["_id"]}] {title}')
    if args.update_profile:
        print(f'\nprofile: merging {list(PROFILE_UPDATE)}')

    if not args.commit:
        print('\n(dry-run) nothing written. Re-run with --commit to write.')
        return

    import firebase_admin
    from firebase_admin import credentials, firestore

    firebase_admin.initialize_app(credentials.ApplicationDefault())
    db = firestore.client()
    member_ref = db.collection('familyMembers').document(MEMBER_ID)

    for section_id, rows in RECORDS.items():
        col_ref = member_ref.collection(section_id)
        for r in rows:
            data = {k: v for k, v in r.items() if k != '_id'}
            col_ref.document(r['_id']).set(data, merge=True)
        print(f'Wrote {len(rows)} record(s) to {section_id}')

    if args.update_profile:
        member_ref.set(PROFILE_UPDATE, merge=True)
        print(f'Merged profile fields: {list(PROFILE_UPDATE)}')

    print('\nDone.')


if __name__ == '__main__':
    sys.exit(main())
