import { db } from './config.js';
import {
  collection, getDocs, doc, getDoc,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { MEMBERS, SECTIONS, PERSONAL_INFO_FIELDS } from './utils.js';

// Simple in-memory cache so repeated keystrokes (and re-searching after
// closing a result) don't re-fetch every member/section on every query.
// Invalidated by records.js/profile.js on save/delete so search results
// stay fresh after an edit.
const cache = new Map();

async function getSectionDocs(memberId, sectionId) {
  const key = `${memberId}:${sectionId}`;
  if (cache.has(key)) return cache.get(key);
  const snap = await getDocs(collection(db, 'familyMembers', memberId, sectionId));
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  cache.set(key, docs);
  return docs;
}

async function getProfile(memberId) {
  const key = `profile:${memberId}`;
  if (cache.has(key)) return cache.get(key);
  const snap = await getDoc(doc(db, 'familyMembers', memberId));
  const data = snap.exists() ? snap.data() : {};
  cache.set(key, data);
  return data;
}

export function invalidateSectionCache(memberId, sectionId) {
  cache.delete(`${memberId}:${sectionId}`);
}

export function invalidateProfileCache(memberId) {
  cache.delete(`profile:${memberId}`);
}

// Returns [{memberId, memberName, sectionId, sectionLabel, docId, title, matchLabel, matchSnippet}]
// sectionId === 'profile' (docId null) means the match was in Personal Information.
export async function searchAll(queryText) {
  const q = queryText.trim().toLowerCase();
  if (!q) return [];
  const results = [];

  for (const member of MEMBERS) {
    const profile = await getProfile(member.id);
    const profileMatch = PERSONAL_INFO_FIELDS.find(
      f => (profile[f.key] || '').toString().toLowerCase().includes(q)
    );
    if (profileMatch) {
      results.push({
        memberId: member.id,
        memberName: member.name,
        sectionId: 'profile',
        sectionLabel: 'Personal Information',
        docId: null,
        title: profile.name || member.name,
        matchLabel: profileMatch.label,
        matchSnippet: profile[profileMatch.key],
      });
    }

    for (const section of SECTIONS) {
      const docs = await getSectionDocs(member.id, section.id);
      for (const d of docs) {
        const fieldMatch = section.fields.find(
          f => (d[f.key] || '').toString().toLowerCase().includes(q)
        );
        if (fieldMatch) {
          results.push({
            memberId: member.id,
            memberName: member.name,
            sectionId: section.id,
            sectionLabel: section.label,
            docId: d.id,
            title: d[section.fields[0].key] || '(untitled)',
            matchLabel: fieldMatch.label,
            matchSnippet: d[fieldMatch.key],
          });
        }
      }
    }
  }

  return results;
}
