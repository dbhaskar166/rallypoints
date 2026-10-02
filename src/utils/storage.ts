import { ClubData, UserProfile, UserWallet } from '../types';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testFirestoreConnection } from './firebase';

declare global {
  interface Window {
    storage?: {
      get: (key: string, shared?: boolean) => Promise<{ key: string; value: string; shared: boolean }>;
      set: (key: string, value: string, shared?: boolean) => Promise<{ key: string; value: string; shared: boolean }>;
      delete: (key: string, shared?: boolean) => Promise<{ key: string; deleted: boolean; shared: boolean }>;
      list: (prefix?: string, shared?: boolean) => Promise<{ keys: string[]; prefix: string; shared: boolean }>;
    };
  }
}

// Fallback in-memory / local storage implementation
if (typeof window !== 'undefined' && !window.storage) {
  const getStorageKey = (key: string, shared = false) => `rallypoint:${shared ? 'shared' : 'personal'}:${key}`;
  window.storage = {
    async get(key: string, shared = false) {
      const val = window.localStorage.getItem(getStorageKey(key, shared));
      if (val === null) throw new Error(`No value for key "${key}"`);
      return { key, value: val, shared: !!shared };
    },
    async set(key: string, value: string, shared = false) {
      window.localStorage.setItem(getStorageKey(key, shared), value);
      return { key, value, shared: !!shared };
    },
    async delete(key: string, shared = false) {
      const k = getStorageKey(key, shared);
      const exists = window.localStorage.getItem(k) !== null;
      window.localStorage.removeItem(k);
      return { key, deleted: exists, shared: !!shared };
    },
    async list(prefix = '', shared = false) {
      const p = getStorageKey(prefix, shared);
      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(p)) {
          keys.push(k.slice(getStorageKey('', shared).length));
        }
      }
      return { keys, prefix, shared: !!shared };
    },
  };
}

export const generateId = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const cloneData = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export const getInitialClubData = (): ClubData => {
  return {
    tournaments: [
      {
        id: 't-prime-open',
        name: 'Apex Masters Cup 2026',
        format: 'Doubles',
        date: '2026-10-15',
        venue: 'Court 1 · Main Arena',
        maxTeams: 8,
        fee: 250,
        createdBy: 'Alex Chen',
        status: 'live',
        championName: null,
        entries: [
          { id: 'e1', name: 'Alex & Marcus' },
          { id: 'e2', name: 'Vikram & Daniel' },
          { id: 'e3', name: 'Elena & Sophia' },
          { id: 'e4', name: 'Chen & Kevin' },
        ],
        bracket: {
          rounds: [
            [
              {
                id: 'm1',
                teamA: { id: 'e1', name: 'Alex & Marcus' },
                teamB: { id: 'e2', name: 'Vikram & Daniel' },
                winner: 'e1',
                matchId: 'match-apex-qf1',
              },
              {
                id: 'm2',
                teamA: { id: 'e3', name: 'Elena & Sophia' },
                teamB: { id: 'e4', name: 'Chen & Kevin' },
                winner: null,
                matchId: 'match-apex-qf2',
              },
            ],
            [
              {
                id: 'm-final',
                teamA: { id: 'e1', name: 'Alex & Marcus' },
                teamB: null,
                winner: null,
                matchId: null,
              },
            ],
          ],
        },
      },
      {
        id: 't-singles-smash',
        name: 'Singles Rapid Championship',
        format: 'Singles',
        date: '2026-10-22',
        venue: 'Court 3 · Oak Parquet',
        maxTeams: 4,
        fee: 150,
        createdBy: 'Vikram Patel',
        status: 'open',
        championName: null,
        entries: [
          { id: 's1', name: 'Vikram Patel' },
          { id: 's2', name: 'Marcus Vance' },
        ],
        bracket: null,
      },
      {
        id: 't-fall-classic',
        name: 'Midnight Smash Invitational',
        format: 'Doubles',
        date: '2026-09-28',
        venue: 'Court 2 · Synthetic Volt',
        maxTeams: 4,
        fee: 200,
        createdBy: 'Sarah Lin',
        status: 'completed',
        championName: 'Sarah & Dev',
        entries: [
          { id: 'f1', name: 'Sarah & Dev' },
          { id: 'f2', name: 'Liam & Noah' },
        ],
        bracket: {
          rounds: [
            [
              {
                id: 'f-final',
                teamA: { id: 'f1', name: 'Sarah & Dev' },
                teamB: { id: 'f2', name: 'Liam & Noah' },
                winner: 'f1',
                matchId: null,
              },
            ],
          ],
        },
      },
    ],
    bookings: [
      {
        id: 'b-court-1',
        court: 'Court 1 · Main Glass Arena',
        date: '2026-10-04',
        time: '18:00',
        format: 'Doubles',
        slotsTotal: 4,
        players: ['Alex Chen', 'Elena Rostova', 'Vikram Patel'],
        createdBy: 'Alex Chen',
        fee: 100,
        status: 'open',
        matchId: null,
        winner: null,
      },
      {
        id: 'b-court-2',
        court: 'Court 2 · Synthetic Volt',
        date: '2026-10-04',
        time: '19:30',
        format: 'Singles',
        slotsTotal: 2,
        players: ['Marcus Vance', 'Daniel Zhao'],
        createdBy: 'Marcus Vance',
        fee: 120,
        status: 'full',
        matchId: 'match-booking-c2',
        winner: null,
      },
      {
        id: 'b-court-3',
        court: 'Court 3 · Oak Parquet',
        date: '2026-10-05',
        time: '17:00',
        format: 'Doubles',
        slotsTotal: 4,
        players: ['Sophia Wu', 'Liam Chen'],
        createdBy: 'Sophia Wu',
        fee: 80,
        status: 'open',
        matchId: null,
        winner: null,
      },
    ],
    matches: {
      'match-apex-qf2': {
        id: 'match-apex-qf2',
        source: {
          type: 'tournament',
          tournamentId: 't-prime-open',
          roundIdx: 0,
          matchIdx: 1,
        },
        title: 'Apex Masters Cup · Semifinal 2',
        teamA: {
          id: 'e3',
          name: 'Elena & Sophia',
          rightPlayer: 'Elena Rostova',
          leftPlayer: 'Sophia Wu',
        },
        teamB: {
          id: 'e4',
          name: 'Chen & Kevin',
          rightPlayer: 'Kevin Zhang',
          leftPlayer: 'Chen Wei',
        },
        scoreA: 18,
        scoreB: 17,
        setsA: 1,
        setsB: 0,
        setHistory: [{ a: 21, b: 19 }],
        currentSet: 2,
        bestOf: 3,
        pointsToWin: 21,
        capPoints: 30,
        servingTeam: 'A',
        setFinished: false,
        isDeuce: false,
        status: 'in-progress',
        winnerId: null,
        history: [],
        commentary: '⚡ Elena serves from Right court (Score 18) to Chen Wei · Set 2: 18–17',
        timeline: [
          {
            id: 't-1',
            text: 'Elena smashes cross-court winner · 18–17',
            scoreA: 18,
            scoreB: 17,
            server: 'Elena Rostova',
            time: Date.now() - 25000,
          },
          {
            id: 't-2',
            text: 'Kevin net kill into center · 17–17',
            scoreA: 17,
            scoreB: 17,
            server: 'Kevin Zhang',
            time: Date.now() - 65000,
          },
        ],
        startTime: Date.now() - 14 * 60 * 1000,
      },
      'match-apex-qf1': {
        id: 'match-apex-qf1',
        source: {
          type: 'tournament',
          tournamentId: 't-prime-open',
          roundIdx: 0,
          matchIdx: 0,
        },
        title: 'Apex Masters Cup · Semifinal 1',
        teamA: {
          id: 'e1',
          name: 'Alex & Marcus',
          rightPlayer: 'Alex Chen',
          leftPlayer: 'Marcus Vance',
        },
        teamB: {
          id: 'e2',
          name: 'Vikram & Daniel',
          rightPlayer: 'Vikram Patel',
          leftPlayer: 'Daniel Brooks',
        },
        scoreA: 21,
        scoreB: 18,
        setsA: 2,
        setsB: 0,
        setHistory: [
          { a: 21, b: 16 },
          { a: 21, b: 18 },
        ],
        currentSet: 2,
        bestOf: 3,
        pointsToWin: 21,
        capPoints: 30,
        servingTeam: 'A',
        setFinished: true,
        isDeuce: false,
        status: 'completed',
        winnerId: 'e1',
        history: [],
        commentary: '🏆 Alex & Marcus defeat Vikram & Daniel in straight sets (21-16, 21-18)',
        timeline: [
          {
            id: 't-qf1-1',
            text: 'Alex steep smash down the T line',
            scoreA: 21,
            scoreB: 18,
            server: 'Alex Chen',
            time: Date.now() - 3600000,
          },
          {
            id: 't-qf1-2',
            text: 'Daniel dropshot winner on right sideline',
            scoreA: 20,
            scoreB: 18,
            server: 'Daniel Brooks',
            time: Date.now() - 3609000,
          },
          {
            id: 't-qf1-3',
            text: 'Marcus fast reflex net tap winner',
            scoreA: 20,
            scoreB: 17,
            server: 'Marcus Vance',
            time: Date.now() - 3617000,
          },
        ],
        startTime: Date.now() - 4200000,
      },
      'match-league-clash': {
        id: 'match-league-clash',
        source: {
          type: 'booking',
        },
        title: 'Club League · Court 1 Showcase',
        teamA: {
          id: 't-alex',
          name: 'Alex & Marcus',
          rightPlayer: 'Alex Chen',
          leftPlayer: 'Marcus Vance',
        },
        teamB: {
          id: 't-vikram',
          name: 'Vikram & Daniel',
          rightPlayer: 'Vikram Patel',
          leftPlayer: 'Daniel Brooks',
        },
        scoreA: 19,
        scoreB: 21,
        setsA: 1,
        setsB: 2,
        setHistory: [
          { a: 21, b: 15 },
          { a: 17, b: 21 },
          { a: 19, b: 21 },
        ],
        currentSet: 3,
        bestOf: 3,
        pointsToWin: 21,
        capPoints: 30,
        servingTeam: 'B',
        setFinished: true,
        isDeuce: false,
        status: 'completed',
        winnerId: 't-vikram',
        history: [],
        commentary: '🏆 Vikram & Daniel triumph in a 3-set thriller over Alex & Marcus!',
        timeline: [
          {
            id: 't-lc-1',
            text: 'Vikram backhand cross flick winner',
            scoreA: 19,
            scoreB: 21,
            server: 'Vikram Patel',
            time: Date.now() - 86400000,
          },
          {
            id: 't-lc-2',
            text: 'Alex jump smash from rear court',
            scoreA: 19,
            scoreB: 20,
            server: 'Alex Chen',
            time: Date.now() - 86409500,
          },
        ],
        startTime: Date.now() - 88000000,
      },
      'match-midnight-final': {
        id: 'match-midnight-final',
        source: {
          type: 'tournament',
          tournamentId: 't-fall-classic',
          roundIdx: 0,
          matchIdx: 0,
        },
        title: 'Midnight Smash Invitational · Final',
        teamA: {
          id: 'f1',
          name: 'Sarah & Dev',
          rightPlayer: 'Sarah Lin',
          leftPlayer: 'Dev Malhotra',
        },
        teamB: {
          id: 'f2',
          name: 'Liam & Noah',
          rightPlayer: 'Liam Chen',
          leftPlayer: 'Noah Vance',
        },
        scoreA: 21,
        scoreB: 16,
        setsA: 2,
        setsB: 0,
        setHistory: [
          { a: 21, b: 14 },
          { a: 21, b: 16 },
        ],
        currentSet: 2,
        bestOf: 3,
        pointsToWin: 21,
        capPoints: 30,
        servingTeam: 'A',
        setFinished: true,
        isDeuce: false,
        status: 'completed',
        winnerId: 'f1',
        history: [],
        commentary: '🏆 Sarah & Dev win the Midnight Smash Championship!',
        timeline: [
          {
            id: 't-mf-1',
            text: 'Dev interception smash down the middle',
            scoreA: 21,
            scoreB: 16,
            server: 'Dev Malhotra',
            time: Date.now() - 172800000,
          },
        ],
        startTime: Date.now() - 175000000,
      },
    },
    playerPhotos: {
      'alex chen': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      'elena rostova': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    },
  };
};

const CLUB_DATA_DOC = 'primary';
const CLUB_COLLECTION = 'clubData';

export async function fetchClubData(): Promise<ClubData> {
  const initial = getInitialClubData();
  try {
    const docRef = doc(db, CLUB_COLLECTION, CLUB_DATA_DOC);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as ClubData;
      const merged: ClubData = {
        tournaments: data.tournaments && data.tournaments.length > 0 ? data.tournaments : initial.tournaments,
        bookings: data.bookings && data.bookings.length > 0 ? data.bookings : initial.bookings,
        matches: data.matches && Object.keys(data.matches).length > 0 ? data.matches : initial.matches,
        playerPhotos: data.playerPhotos && Object.keys(data.playerPhotos).length > 0 ? data.playerPhotos : initial.playerPhotos,
      };
      if (typeof window !== 'undefined' && window.storage) {
        window.storage.set('club-data', JSON.stringify(merged), true).catch(() => {});
      }
      return merged;
    } else {
      // Document does not exist in Firestore yet, initialize it
      await setDoc(docRef, initial);
      if (typeof window !== 'undefined' && window.storage) {
        window.storage.set('club-data', JSON.stringify(initial), true).catch(() => {});
      }
      return initial;
    }
  } catch (firestoreError) {
    console.warn('Firestore fetch failed, checking local storage cache:', firestoreError);
    if (typeof window !== 'undefined' && window.storage) {
      try {
        const res = await window.storage.get('club-data', true);
        if (res.value) {
          const parsed = JSON.parse(res.value);
          return {
            tournaments: parsed.tournaments || initial.tournaments,
            bookings: parsed.bookings || initial.bookings,
            matches: parsed.matches || initial.matches,
            playerPhotos: parsed.playerPhotos || initial.playerPhotos,
          };
        }
      } catch {}
    }
    return initial;
  }
}

export async function saveClubData(data: ClubData): Promise<void> {
  // Update local fast cache
  if (typeof window !== 'undefined' && window.storage) {
    window.storage.set('club-data', JSON.stringify(data), true).catch(() => {});
  }

  // Persist to Cloud Firestore database
  try {
    const docRef = doc(db, CLUB_COLLECTION, CLUB_DATA_DOC);
    await setDoc(docRef, data);
  } catch (error) {
    console.error('Failed to persist club data to Firestore:', error);
  }
}

/**
 * Real-time listener for multi-device sync
 */
export function subscribeToClubData(callback: (data: ClubData) => void): () => void {
  try {
    const docRef = doc(db, CLUB_COLLECTION, CLUB_DATA_DOC);
    return onSnapshot(
      docRef,
      snapshot => {
        if (snapshot.exists()) {
          const d = snapshot.data() as ClubData;
          callback({
            tournaments: d.tournaments || [],
            bookings: d.bookings || [],
            matches: d.matches || {},
            playerPhotos: d.playerPhotos || {},
          });
        }
      },
      error => {
        console.warn('Firestore real-time subscription error:', error);
      }
    );
  } catch (e) {
    console.warn('Unable to subscribe to Firestore real-time updates:', e);
    return () => {};
  }
}

export async function fetchUserProfile(): Promise<UserProfile | null> {
  if (typeof window === 'undefined' || !window.storage) return null;
  try {
    const res = await window.storage.get('profile', false);
    return JSON.parse(res.value);
  } catch {
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  if (typeof window === 'undefined' || !window.storage) return;
  try {
    await window.storage.set('profile', JSON.stringify(profile), false);
  } catch (e) {
    console.error('Failed to save profile', e);
  }
}

export async function fetchUserWallet(): Promise<UserWallet> {
  const defaultWallet: UserWallet = {
    balance: 500, // Welcome credit
    transactions: [
      {
        id: 'tx-welcome',
        type: 'credit',
        amount: 500,
        note: 'Welcome sign-up reward · RallyPoint Club',
        date: new Date().toISOString(),
      },
    ],
  };

  if (typeof window === 'undefined' || !window.storage) return defaultWallet;
  try {
    const res = await window.storage.get('wallet', false);
    return JSON.parse(res.value);
  } catch {
    try {
      await window.storage.set('wallet', JSON.stringify(defaultWallet), false);
    } catch {}
    return defaultWallet;
  }
}

export async function saveUserWallet(wallet: UserWallet): Promise<void> {
  if (typeof window === 'undefined' || !window.storage) return;
  try {
    await window.storage.set('wallet', JSON.stringify(wallet), false);
  } catch (e) {
    console.error('Failed to save wallet', e);
  }
}
