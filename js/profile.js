import { db } from './config.js';
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { PERSONAL_INFO_FIELDS, escapeHtml } from './utils.js';

export async function loadProfile(memberId, containerEl) {
  containerEl.innerHTML = '<div class="loading">Loading...</div>';
  const snap = await getDoc(doc(db, 'familyMembers', memberId));
  const data = snap.exists() ? snap.data() : {};
  renderProfile(memberId, data, containerEl);
}

function renderProfile(memberId, data, containerEl) {
  const rows = PERSONAL_INFO_FIELDS.map(f => `
    <div class="profile-row">
      <span class="profile-label">${escapeHtml(f.label)}</span>
      <span class="profile-value">${escapeHtml(data[f.key]) || '<span class="profile-empty">—</span>'}</span>
    </div>
  `).join('');

  containerEl.innerHTML = `
    <div class="profile-card">
      <div class="profile-grid">${rows}</div>
      <div class="profile-actions">
        <button class="btn btn-secondary btn-sm" onclick="window.editProfile('${memberId}')">Edit</button>
      </div>
    </div>
  `;
}

export function openProfileModal(memberId, data) {
  const modal = document.getElementById('profile-modal');
  const body = document.getElementById('profile-modal-body');
  document.getElementById('profile-modal-member-id').value = memberId;

  body.innerHTML = PERSONAL_INFO_FIELDS.map(f => `
    <div class="form-row">
      <label>${escapeHtml(f.label)}</label>
      ${f.type === 'textarea'
        ? `<textarea data-field="${f.key}" rows="2">${escapeHtml(data[f.key] || '')}</textarea>`
        : `<input type="text" data-field="${f.key}" value="${escapeHtml(data[f.key] || '')}">`}
    </div>
  `).join('');

  modal.classList.remove('hidden');
}

export async function saveProfile() {
  const memberId = document.getElementById('profile-modal-member-id').value;
  const body = document.getElementById('profile-modal-body');
  const data = {};
  body.querySelectorAll('[data-field]').forEach(el => {
    data[el.dataset.field] = el.value.trim();
  });
  await setDoc(doc(db, 'familyMembers', memberId), data, { merge: true });
  document.getElementById('profile-modal').classList.add('hidden');
  return memberId;
}
