import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, remove, off, type DatabaseReference } from 'firebase/database';

// ========================================
// Firebase 設定
// Firebase Console → プロジェクトの設定 → マイアプリ から取得した値を入力してください
// ========================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- Types ---
export interface FirebaseGroupMember {
  name: string;
  wants: string[]; // booth numbers
  updatedAt: number;
}

// --- Helper: get or create a persistent member ID ---
const MEMBER_ID_KEY = 'sakenojin-member-id';
export function getMyMemberId(): string {
  let id = localStorage.getItem(MEMBER_ID_KEY);
  if (!id) {
    id = 'm-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    localStorage.setItem(MEMBER_ID_KEY, id);
  }
  return id;
}

// --- Group operations ---

/** Write my data to a group */
export function syncMyDataToGroup(
  groupId: string,
  memberId: string,
  name: string,
  wants: string[]
): Promise<void> {
  const memberRef = ref(db, `groups/${groupId}/members/${memberId}`);
  return set(memberRef, {
    name,
    wants,
    updatedAt: Date.now()
  });
}

/** Subscribe to all members in a group. Returns an unsubscribe function. */
export function subscribeToGroup(
  groupId: string,
  callback: (members: Record<string, FirebaseGroupMember>) => void
): () => void {
  const groupRef: DatabaseReference = ref(db, `groups/${groupId}/members`);
  const unsubscribe = onValue(groupRef, (snapshot) => {
    const val = snapshot.val();
    callback(val || {});
  });
  return () => off(groupRef, 'value', unsubscribe);
}

/** Remove myself from a group */
export function leaveGroup(groupId: string, memberId: string): Promise<void> {
  const memberRef = ref(db, `groups/${groupId}/members/${memberId}`);
  return remove(memberRef);
}

/** Check if Firebase is configured (not placeholder) */
export function isFirebaseConfigured(): boolean {
  return !firebaseConfig.apiKey.startsWith('YOUR_');
}
