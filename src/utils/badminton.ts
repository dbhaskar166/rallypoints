import { Bracket, BracketMatch, Match, MatchFormat, Team } from '../types';
import { generateId } from './storage';

/**
 * Parses names into right and left player names for doubles
 */
export function parsePlayerNames(name: string): { rightPlayer: string; leftPlayer: string | null } {
  const parts = (name || '')
    .split(/&|\/| and /i)
    .map(p => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return { rightPlayer: parts[0], leftPlayer: parts[1] };
  }
  return { rightPlayer: name, leftPlayer: null };
}

export function createTeam(id: string, name: string, right?: string, left?: string | null): Team {
  const parsed = parsePlayerNames(name);
  return {
    id,
    name,
    rightPlayer: right || parsed.rightPlayer || name,
    leftPlayer: left !== undefined ? left : parsed.leftPlayer,
  };
}

/**
 * Returns who is serving and which court they are serving from based on score
 * BWF Rule: Even score = Right court, Odd score = Left court
 */
export function getCurrentServer(team: Team, score: number): { name: string; court: 'Right' | 'Left' } {
  const isEven = score % 2 === 0;
  if (!team.leftPlayer) {
    return {
      name: team.rightPlayer || team.name,
      court: isEven ? 'Right' : 'Left',
    };
  }
  return {
    name: isEven ? team.rightPlayer : team.leftPlayer,
    court: isEven ? 'Right' : 'Left',
  };
}

/**
 * Returns the receiver name in the diagonal court
 */
export function getCurrentReceiver(serverCourt: 'Right' | 'Left', opponentTeam: Team): string {
  if (!opponentTeam.leftPlayer) {
    return opponentTeam.rightPlayer || opponentTeam.name;
  }
  return serverCourt === 'Right' ? opponentTeam.rightPlayer : opponentTeam.leftPlayer;
}

/**
 * Swaps positions of the two players in a doubles team (used when serving side wins a rally)
 */
export function swapTeamPositions(team: Team): Team {
  if (!team.leftPlayer) return team;
  return {
    ...team,
    rightPlayer: team.leftPlayer,
    leftPlayer: team.rightPlayer,
  };
}

/**
 * Generates single-elimination tournament bracket
 */
function nextPowerOfTwo(n: number): number {
  let count = 2;
  while (count < n) count *= 2;
  return count;
}

export function generateBracket(entries: { id: string; name: string; photoUrl?: string | null }[]): Bracket {
  const size = nextPowerOfTwo(Math.max(entries.length, 2));
  // Shuffle entries for unbiased seeding
  const shuffled = [...entries];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  // Fill byes with null
  while (shuffled.length < size) {
    shuffled.push(null as unknown as { id: string; name: string; photoUrl?: string | null });
  }

  const round1: BracketMatch[] = [];
  for (let i = 0; i < size; i += 2) {
    round1.push({
      id: generateId(),
      teamA: shuffled[i] || null,
      teamB: shuffled[i + 1] || null,
      winner: null,
      matchId: null,
    });
  }

  const rounds: BracketMatch[][] = [round1];
  let currentRoundSize = size / 2;
  while (currentRoundSize > 1) {
    const nextRound: BracketMatch[] = [];
    for (let i = 0; i < currentRoundSize / 2; i++) {
      nextRound.push({
        id: generateId(),
        teamA: null,
        teamB: null,
        winner: null,
        matchId: null,
      });
    }
    rounds.push(nextRound);
    currentRoundSize = currentRoundSize / 2;
  }

  // Handle byes automatically
  propagateBracketByes(rounds);
  return { rounds };
}

export function propagateBracketByes(rounds: BracketMatch[][]) {
  for (let r = 0; r < rounds.length; r++) {
    for (let m = 0; m < rounds[r].length; m++) {
      const match = rounds[r][m];
      if (!match.winner) {
        let byeWinner: { id: string; name: string; photoUrl?: string | null } | null = null;
        if (match.teamA && !match.teamB) {
          byeWinner = match.teamA;
        } else if (match.teamB && !match.teamA) {
          byeWinner = match.teamB;
        }
        if (byeWinner && r + 1 < rounds.length) {
          match.winner = byeWinner.id;
          const nextMatch = rounds[r + 1][Math.floor(m / 2)];
          if (m % 2 === 0) {
            nextMatch.teamA = byeWinner;
          } else {
            nextMatch.teamB = byeWinner;
          }
        }
      }
    }
  }
}

/**
 * Creates a new initialized match
 */
export function initializeMatch(
  source: Match['source'],
  title: string,
  teamA: Team,
  teamB: Team,
  pointsToWin = 21,
  capPoints = 30
): Match {
  const server = getCurrentServer(teamA, 0);
  const receiver = getCurrentReceiver(server.court, teamB);
  const commentary = `🏸 Match begins · ${server.name} serving from the ${server.court} court to ${receiver}`;

  return {
    id: generateId(),
    source,
    title,
    teamA,
    teamB,
    scoreA: 0,
    scoreB: 0,
    setsA: 0,
    setsB: 0,
    setHistory: [],
    currentSet: 1,
    bestOf: 3,
    pointsToWin,
    capPoints,
    servingTeam: 'A',
    setFinished: false,
    isDeuce: false,
    status: 'in-progress',
    winnerId: null,
    history: [],
    commentary,
    timeline: [
      {
        id: generateId(),
        text: 'Match started',
        scoreA: 0,
        scoreB: 0,
        server: server.name,
        time: Date.now(),
      },
    ],
    startTime: Date.now(),
  };
}

/**
 * Format milliseconds into MM:SS
 */
export function formatDuration(startTime: number): string {
  const totalSeconds = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
  const mins = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (totalSeconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

export function formatDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

import { triggerFeedback, FeedbackType } from './feedback';

/**
 * Tactical audio and haptic feedback dispatcher for scoring actions
 */
export function playPointChime(type: FeedbackType = 'point') {
  triggerFeedback(type, true);
}
