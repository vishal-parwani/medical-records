import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { auth, db } from './config.js';
import { signInWithApple, signOut } from './auth.js';
import { MEMBERS, SECTIONS } from './utils.js';
import { loadProfile, openProfileModal, saveProfile } from './profile.js';
import { loadSection, openRecordModal, saveRecord, removeRecord } from './records.js';

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

onAuthStateChanged(auth, (user) => {
  if (user) {
    showApp(user);
  } else {
    showAuthScreen();
  }
});
