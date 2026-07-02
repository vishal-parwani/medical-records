import { db } from './config.js';
import {
  collection, getDocs, doc, setDoc, addDoc, deleteDoc, query, orderBy,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { SECTIONS, escapeHtml } from './utils.js';
import { invalidateSectionCache } from './search.js';

// Generic list+CRUD renderer, reused for all 9 record sections (conditions,
// medications, allergies, surgeries, vaccinations, doctors, consultations,
// labResults, healthRecommendations). Section shape (columns, labels) comes
// entirely from SECTIONS in utils.js — this file has no per-section logic.

let currentMemberId = null;
let currentSection = null;
let currentDocs = []; // [{id, ...fields}] cache for the open section, used by edit/delete

function sectionConfig(sectionId) {
  return SECTIONS.find(s => s.id === sectionId);
}

export async function loadSection(memberId, sectionId, containerEl) {
  const section = sectionConfig(sectionId);
  containerEl.innerHTML = '<div class="loading">Loading...</div>';

  const colRef = collection(db, 'familyMembers', memberId, sectionId);
  const snap = await getDocs(query(colRef, orderBy('__name__')));
  currentDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  currentMemberId = memberId;
  currentSection = sectionId;

  renderSection(section, containerEl);
}

function renderSection(section, containerEl) {
  const titleField = section.fields[0].key;

  const rowsHtml = currentDocs.length
    ? currentDocs.map(d => `
        <tr>
          <td data-label="${escapeHtml(section.fields[0].label)}"><strong>${escapeHtml(d[titleField]) || '—'}</strong></td>
          ${section.fields.slice(1, 4).map(f => `<td data-label="${escapeHtml(f.label)}">${escapeHtml(d[f.key]) || ''}</td>`).join('')}
          <td class="actions-cell">
            <button class="btn-icon" title="Edit" onclick="window.editRecord('${section.id}','${d.id}')">✎</button>
            <button class="btn-icon" title="Delete" onclick="window.deleteRecord('${section.id}','${d.id}')">🗑</button>
          </td>
        </tr>
      `).join('')
    : `<tr><td colspan="5" class="empty">No ${escapeHtml(section.label.toLowerCase())} recorded yet.</td></tr>`;

  containerEl.innerHTML = `
    <div class="section-header">
      <h3 class="section-title">${escapeHtml(section.label)}</h3>
      <button class="btn btn-secondary btn-sm" onclick="window.addRecord('${section.id}')">+ Add</button>
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            ${section.fields.slice(0, 4).map(f => `<th>${escapeHtml(f.label)}</th>`).join('')}
            <th></th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  `;
}

export function openRecordModal(sectionId, docId) {
  const section = sectionConfig(sectionId);
  const existing = docId ? currentDocs.find(d => d.id === docId) : null;

  document.getElementById('record-modal-title').textContent = `${existing ? 'Edit' : 'Add'} — ${section.label}`;
  document.getElementById('record-modal-section-id').value = sectionId;
  document.getElementById('record-modal-doc-id').value = docId || '';

  const body = document.getElementById('record-modal-body');
  body.innerHTML = section.fields.map(f => `
    <div class="form-row">
      <label>${escapeHtml(f.label)}${f.required ? ' *' : ''}</label>
      ${f.type === 'textarea'
        ? `<textarea data-field="${f.key}" rows="2">${escapeHtml(existing?.[f.key] || '')}</textarea>`
        : `<input type="text" data-field="${f.key}" value="${escapeHtml(existing?.[f.key] || '')}">`}
    </div>
  `).join('');

  document.getElementById('record-modal').classList.remove('hidden');
}

export async function saveRecord() {
  const sectionId = document.getElementById('record-modal-section-id').value;
  const docId = document.getElementById('record-modal-doc-id').value;
  const body = document.getElementById('record-modal-body');

  const data = {};
  body.querySelectorAll('[data-field]').forEach(el => {
    data[el.dataset.field] = el.value.trim();
  });

  const colRef = collection(db, 'familyMembers', currentMemberId, sectionId);
  if (docId) {
    await setDoc(doc(colRef, docId), data, { merge: true });
  } else {
    await addDoc(colRef, data);
  }

  invalidateSectionCache(currentMemberId, sectionId);
  document.getElementById('record-modal').classList.add('hidden');
}

export async function removeRecord(sectionId, docId) {
  await deleteDoc(doc(db, 'familyMembers', currentMemberId, sectionId, docId));
  invalidateSectionCache(currentMemberId, sectionId);
}
