export const MEMBERS = [
  { id: 'vishal', name: 'Vishal' },
  { id: 'kasthuri', name: 'Kasthuri' },
  { id: 'kimaya', name: 'Kimaya' },
  { id: 'son', name: 'Son' },
];

export const PERSONAL_INFO_FIELDS = [
  { key: 'name', label: 'Full Name' },
  { key: 'dob', label: 'Date of Birth' },
  { key: 'age', label: 'Age' },
  { key: 'bloodGroup', label: 'Blood Group' },
  { key: 'primaryDoctor', label: 'Primary Doctor' },
  { key: 'doctorPhone', label: 'Doctor Phone' },
  { key: 'healthInsurance', label: 'Health Insurance' },
  { key: 'policyNumber', label: 'Policy Number' },
  { key: 'emergencyContact', label: 'Emergency Contact' },
  { key: 'emergencyPhone', label: 'Emergency Phone' },
  { key: 'birthDetails', label: 'Birth Details', type: 'textarea' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

// One entry per record-list section. `id` is also the Firestore subcollection
// name under familyMembers/{memberId}. `fields[0]` is treated as the row's
// display title in the table.
export const SECTIONS = [
  {
    id: 'conditions',
    label: 'Conditions & Diagnoses',
    fields: [
      { key: 'condition', label: 'Condition / Diagnosis', required: true },
      { key: 'dateDiagnosed', label: 'Date Diagnosed' },
      { key: 'status', label: 'Status (Active/Resolved)' },
      { key: 'treatingDoctor', label: 'Treating Doctor' },
      { key: 'hospital', label: 'Hospital / Clinic' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  {
    id: 'medications',
    label: 'Current Medications',
    fields: [
      { key: 'medication', label: 'Medication / Drug', required: true },
      { key: 'dosage', label: 'Dosage' },
      { key: 'frequency', label: 'Frequency' },
      { key: 'prescribedBy', label: 'Prescribed By' },
      { key: 'startDate', label: 'Start Date' },
      { key: 'endDate', label: 'End Date' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  {
    id: 'allergies',
    label: 'Allergies',
    fields: [
      { key: 'allergen', label: 'Allergen', required: true },
      { key: 'type', label: 'Type (Food/Drug/Other)' },
      { key: 'reaction', label: 'Reaction' },
      { key: 'severity', label: 'Severity (Mild/Moderate/Severe)' },
      { key: 'diagnosedDate', label: 'Diagnosed Date' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  {
    id: 'surgeries',
    label: 'Surgeries & Procedures',
    fields: [
      { key: 'procedure', label: 'Procedure', required: true },
      { key: 'date', label: 'Date' },
      { key: 'hospital', label: 'Hospital' },
      { key: 'surgeon', label: 'Surgeon / Doctor' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  {
    id: 'vaccinations',
    label: 'Vaccinations',
    fields: [
      { key: 'vaccine', label: 'Vaccine', required: true },
      { key: 'date', label: 'Date' },
      { key: 'doseOrBooster', label: 'Dose / Booster / Batch No.' },
      { key: 'hospital', label: 'Hospital / Clinic' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  {
    id: 'doctors',
    label: 'Doctors & Specialists',
    fields: [
      { key: 'specialty', label: 'Speciality', required: true },
      { key: 'name', label: 'Doctor Name' },
      { key: 'hospital', label: 'Hospital / Clinic' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  {
    id: 'consultations',
    label: 'Consultation History',
    fields: [
      { key: 'date', label: 'Date', required: true },
      { key: 'doctor', label: 'Doctor' },
      { key: 'specialty', label: 'Speciality' },
      { key: 'hospital', label: 'Hospital' },
      { key: 'reason', label: 'Reason for Visit' },
      { key: 'diagnosis', label: 'Diagnosis / Findings', type: 'textarea' },
      { key: 'prescription', label: 'Prescription / Action', type: 'textarea' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  {
    id: 'labResults',
    label: 'Lab Results & Reports',
    fields: [
      { key: 'date', label: 'Date', required: true },
      { key: 'test', label: 'Test / Report' },
      { key: 'result', label: 'Result' },
      { key: 'normalRange', label: 'Normal Range' },
      { key: 'status', label: 'Status (Normal/High/Low)' },
      { key: 'lab', label: 'Lab / Clinic' },
      { key: 'orderedBy', label: 'Ordered By' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  {
    id: 'healthRecommendations',
    label: 'Health Recommendations',
    fields: [
      { key: 'recommendation', label: 'Test / Recommendation', required: true },
      { key: 'frequency', label: 'Frequency' },
      { key: 'testsToInclude', label: 'Tests to Include' },
      { key: 'nextDue', label: 'Next Due (Approx.)' },
      { key: 'priority', label: 'Priority' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
];

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
