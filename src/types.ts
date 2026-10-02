export type MatchFormat = 'Singles' | 'Doubles';

export interface Player {
  id: string;
  name: string;
  photoUrl?: string | null;
}

export interface Team {
  id: string;
  name: string;
  rightPlayer: string;
  leftPlayer?: string | null;
  photoUrl?: string | null;
  rightPhotoUrl?: string | null;
  leftPhotoUrl?: string | null;
}

export interface SetScore {
  a: number;
  b: number;
}

export interface MatchTimelineItem {
  id: string;
  text: string;
  scoreA: number;
  scoreB: number;
  server: string;
  time: number;
}

export interface MatchHistoryState {
  scoreA: number;
  scoreB: number;
  setsA: number;
  setsB: number;
  setHistory: SetScore[];
  currentSet: number;
  status: 'in-progress' | 'completed';
  winnerId: string | null;
  teamA: Team;
  teamB: Team;
  servingTeam: 'A' | 'B';
  setFinished: boolean;
  isDeuce: boolean;
  commentary: string;
}

export interface MatchSource {
  type: 'tournament' | 'booking' | 'quick';
  tournamentId?: string;
  roundIdx?: number;
  matchIdx?: number;
  bookingId?: string;
}

export interface Match {
  id: string;
  source: MatchSource;
  title: string;
  teamA: Team;
  teamB: Team;
  scoreA: number;
  scoreB: number;
  setsA: number;
  setsB: number;
  setHistory: SetScore[];
  currentSet: number;
  bestOf: number;
  pointsToWin: number;
  capPoints: number;
  servingTeam: 'A' | 'B';
  setFinished: boolean;
  isDeuce: boolean;
  status: 'in-progress' | 'completed';
  winnerId: string | null;
  history: MatchHistoryState[];
  commentary: string;
  timeline: MatchTimelineItem[];
  startTime: number;
}

export interface BracketMatch {
  id: string;
  teamA: { id: string; name: string; photoUrl?: string | null } | null;
  teamB: { id: string; name: string; photoUrl?: string | null } | null;
  winner: string | null;
  matchId: string | null;
}

export interface Bracket {
  rounds: BracketMatch[][];
}

export interface TournamentEntry {
  id: string;
  name: string;
  photoUrl?: string | null;
}

export interface Tournament {
  id: string;
  name: string;
  format: MatchFormat;
  date: string;
  venue: string;
  maxTeams: number;
  fee: number;
  createdBy: string;
  entries: TournamentEntry[];
  status: 'open' | 'live' | 'completed';
  bracket: Bracket | null;
  championName: string | null;
}

export interface CourtBooking {
  id: string;
  court: string;
  date: string;
  time: string;
  format: MatchFormat;
  slotsTotal: number;
  players: string[];
  createdBy: string;
  fee: number;
  status: 'open' | 'full' | 'completed';
  matchId: string | null;
  winner: string | null;
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  note: string;
  date: string;
}

export interface UserWallet {
  balance: number;
  transactions: WalletTransaction[];
}

export interface UserProfile {
  name: string;
  photoUrl: string | null;
}

export interface ClubData {
  tournaments: Tournament[];
  bookings: CourtBooking[];
  matches: Record<string, Match>;
  playerPhotos: Record<string, string>;
}
