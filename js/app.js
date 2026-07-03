import { onAuthStateChanged, getRedirectResult } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { auth, db } from './config.js';
import { signInWithApple, signOut } from './auth.js';
import { MEMBERS, SECTIONS, escapeHtml } from './utils.js';
import { loadProfile, openProfileModal, saveProfile } from './profile.js';
import { loadSection, openRecordModal, saveRecord, removeRecord } from './records.js';
import { searchAll } from './search.js';

let activeMemberId = MEMBERS[0].id;

function buildMemberTabs() {
  const nav = document.getElementById('member-tab-nav');
  nav.innerHTML = MEMBERS.map((m, i) => `
    <button class="tab-btn ${i === 0 ? 'active' : ''}" data-member="${m.id}">${m.name}</button>
  `).join('');
  nav.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchMember(btn.dataset.member));
  });
}

function buildSectionContainers() {
  const main = document.getElementById('records-content');
  main.innerHTML = `
    <div id="profile-container" class="section"></div>
    ${SECTIONS.map(s => `<div id="section-${s.id}" class="section"></div>`).join('')}
  `;
}

async function switchMember(memberId) {
  activeMemberId = memberId;
  document.querySelectorAll('#member-tab-nav .tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.member === memberId);
  });
  await loadAllSections(memberId);
}

async function loadAllSections(memberId) {
  await loadProfile(memberId, document.getElementById('profile-container'));
  for (const section of SECTIONS) {
    await loadSection(memberId, section.id, document.getElementById(`section-${section.id}`));
  }
}

function wireModals() {
  document.getElementById('cancel-profile-btn').addEventListener('click', () => {
    document.getElementById('profile-modal').classList.add('hidden');
  });
  document.getElementById('save-profile-btn').addEventListener('click', async () => {
    const memberId = await saveProfile();
    await loadProfile(memberId, document.getElementById('profile-container'));
  });

  document.getElementById('cancel-record-btn').addEventListener('click', () => {
    document.getElementById('record-modal').classList.add('hidden');
  });
  document.getElementById('save-record-btn').addEventListener('click', async () => {
    const sectionId = document.getElementById('record-modal-section-id').value;
    await saveRecord();
    await loadSection(activeMemberId, sectionId, document.getElementById(`section-${sectionId}`));
  });
}

// ── Global search across every member + section ──

let searchDebounceHandle = null;

function wireGlobalSearch() {
  const input = document.getElementById('global-search-input');
  const resultsEl = document.getElementById('global-search-results');

  input.addEventListener('input', () => {
    clearTimeout(searchDebounceHandle);
    const value = input.value;
    searchDebounceHandle = setTimeout(() => runGlobalSearch(value), 250);
  });

  input.addEventListener('focus', () => {
    if (input.value.trim().length >= 2) resultsEl.classList.remove('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.global-search-bar')) {
      resultsEl.classList.add('hidden');
    }
  });
}

async function runGlobalSearch(queryText) {
  const resultsEl = document.getElementById('global-search-results');
  const q = queryText.trim();

  if (q.length < 2) {
    resultsEl.classList.add('hidden');
    resultsEl.innerHTML = '';
    return;
  }

  resultsEl.innerHTML = '<div class="search-result-item empty">Searching…</div>';
  resultsEl.classList.remove('hidden');

  const results = await searchAll(q);

  if (!results.length) {
    resultsEl.innerHTML = '<div class="search-result-item empty">No matches.</div>';
    return;
  }

  resultsEl.innerHTML = results.slice(0, 30).map(r => `
    <div class="search-result-item" onclick="window.jumpToSearchResult('${r.memberId}','${r.sectionId}',${r.docId ? `'${r.docId}'` : 'null'})">
      <div class="search-result-member">${escapeHtml(r.memberName)} · ${escapeHtml(r.sectionLabel)}</div>
      <div class="search-result-title">${escapeHtml(r.title)}</div>
      <div class="search-result-snippet">${escapeHtml(r.matchLabel)}: ${escapeHtml(r.matchSnippet)}</div>
    </div>
  `).join('');
}

window.jumpToSearchResult = async (memberId, sectionId, docId) => {
  document.getElementById('global-search-results').classList.add('hidden');
  document.getElementById('global-search-input').value = '';
  await switchMember(memberId);

  if (sectionId === 'profile') {
    const snap = await getDoc(doc(db, 'familyMembers', memberId));
    document.getElementById('profile-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
    openProfileModal(memberId, snap.exists() ? snap.data() : {});
    return;
  }

  const el = document.getElementById(`section-${sectionId}`);
  await loadSection(memberId, sectionId, el); // re-load so records.js's internal cache matches this section
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  openRecordModal(sectionId, docId);
};

window.editProfile = async (memberId) => {
  const snap = await getDoc(doc(db, 'familyMembers', memberId));
  openProfileModal(memberId, snap.exists() ? snap.data() : {});
};

window.addRecord = (sectionId) => openRecordModal(sectionId, null);
window.editRecord = (sectionId, docId) => openRecordModal(sectionId, docId);
window.deleteRecord = async (sectionId, docId) => {
  if (!confirm('Delete this record? This cannot be undone.')) return;
  await removeRecord(sectionId, docId);
  await loadSection(activeMemberId, sectionId, document.getElementById(`section-${sectionId}`));
};

function showApp(user) {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('user-name').textContent = user.displayName || user.email || '';
  buildMemberTabs();
  buildSectionContainers();
  wireModals();
  wireGlobalSearch();
  loadAllSections(activeMemberId);
}

function showAuthScreen() {
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

document.getElementById('apple-signin-btn').addEventListener('click', async () => {
  try {
    await signInWithApple();
  } catch (err) {
    alert(`Sign-in failed: ${err.message}`);
  }
});

document.getElementById('sign-out-btn').addEventListener('click', () => signOut());

// Surfaces errors from the redirect-based sign-in flow (e.g. the Apple
// return-URL/domain not being registered) once the browser lands back here.
getRedirectResult(auth).catch((err) => {
  alert(`Sign-in failed: ${err.message}`);
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    showApp(user);
  } else {
    showAuthScreen();
  }
});
