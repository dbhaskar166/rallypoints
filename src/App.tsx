/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ClubData,
  CourtBooking,
  Match,
  MatchFormat,
  Tournament,
  UserProfile,
  UserWallet,
} from './types';
import {
  fetchClubData,
  saveClubData,
  fetchUserProfile,
  saveUserProfile,
  fetchUserWallet,
  saveUserWallet,
  generateId,
  cloneData,
} from './utils/storage';
import {
  createTeam,
  generateBracket,
  getCurrentReceiver,
  getCurrentServer,
  initializeMatch,
  playPointChime,
  swapTeamPositions,
} from './utils/badminton';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { TournamentsView } from './components/TournamentsView';
import { TournamentDetailView } from './components/TournamentDetailView';
import { BookingsView } from './components/BookingsView';
import { BookingDetailView } from './components/BookingDetailView';
import { ScoreHubView } from './components/ScoreHubView';
import { LiveScoreView } from './components/LiveScoreView';
import { WalletView } from './components/WalletView';
import { ProfileModal } from './components/ProfileModal';
import { OnboardingModal } from './components/OnboardingModal';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [club, setClub] = useState<ClubData>({
    tournaments: [],
    bookings: [],
    matches: {},
    playerPhotos: {},
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<UserWallet>({ balance: 0, transactions: [] });

  // Navigation state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tournaments' | 'bookings' | 'scoring' | 'wallet'>('dashboard');
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);

  // Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Avoid race conditions when saving
  const saveCounterRef = useRef(0);

  // Initial load
  useEffect(() => {
    (async () => {
      const p = await fetchUserProfile();
      const w = await fetchUserWallet();
      const c = await fetchClubData();

      setProfile(p);
      setWallet(w);
      setClub(c);
      setLoading(false);

      if (!p) {
        setShowOnboarding(true);
      }
    })();
  }, []);

  // Periodic polling for shared club synchronization
  const syncClubData = useCallback(async () => {
    if (saveCounterRef.current > 0) return;
    try {
      const fresh = await fetchClubData();
      setClub(fresh);
    } catch (e) {
      console.error('Polling error', e);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(syncClubData, 4500);
    return () => clearInterval(interval);
  }, [syncClubData]);

  // Synchronized Club Saver
  const updateClub = async (newClub: ClubData) => {
    setClub(newClub);
    saveCounterRef.current++;
    try {
      await saveClubData(newClub);
    } finally {
      saveCounterRef.current--;
    }
  };

  // Wallet deduction helper
  const deductWallet = async (amount: number, note: string): Promise<boolean> => {
    if (amount <= 0) return true;
    if (wallet.balance < amount) return false;

    const newWallet: UserWallet = {
      balance: Math.round((wallet.balance - amount) * 100) / 100,
      transactions: [
        {
          id: generateId(),
          type: 'debit',
          amount,
          note,
          date: new Date().toISOString(),
        },
        ...wallet.transactions,
      ],
    };
    setWallet(newWallet);
    await saveUserWallet(newWallet);
    return true;
  };

  // Wallet top-up helper
  const addFunds = async (amount: number, note = 'Wallet Top-Up') => {
    if (amount <= 0) return;
    const newWallet: UserWallet = {
      balance: Math.round((wallet.balance + amount) * 100) / 100,
      transactions: [
        {
          id: generateId(),
          type: 'credit',
          amount,
          note,
          date: new Date().toISOString(),
        },
        ...wallet.transactions,
      ],
    };
    setWallet(newWallet);
    await saveUserWallet(newWallet);
  };

  // Profile save helper
  const handleSaveProfile = async (name: string, photoUrl: string | null) => {
    const newProfile: UserProfile = { name, photoUrl };
    setProfile(newProfile);
    setShowOnboarding(false);
    await saveUserProfile(newProfile);

    // Register photo in club registry
    if (photoUrl) {
      const updated = cloneData(club);
      updated.playerPhotos[name.trim().toLowerCase()] = photoUrl;
      await updateClub(updated);
    }
  };

  // --- Tournament Handlers ---
  const handleCreateTournament = async (data: {
    name: string;
    format: MatchFormat;
    date: string;
    venue: string;
    maxTeams: number;
    fee: number;
  }) => {
    const newTourney: Tournament = {
      id: generateId(),
      name: data.name,
      format: data.format,
      date: data.date,
      venue: data.venue,
      maxTeams: data.maxTeams,
      fee: data.fee,
      createdBy: profile?.name || 'Club Member',
      entries: [],
      status: 'open',
      bracket: null,
      championName: null,
    };

    const updated = cloneData(club);
    updated.tournaments.unshift(newTourney);
    await updateClub(updated);
    setActiveTournamentId(newTourney.id);
  };

  const handleJoinTournament = async (entryName: string) => {
    if (!activeTournamentId) return;
    const target = club.tournaments.find(t => t.id === activeTournamentId);
    if (!target || target.status !== 'open' || target.entries.length >= target.maxTeams) return;

    if (target.fee > 0 && wallet.balance >= target.fee) {
      await deductWallet(target.fee, `Entry Fee · ${target.name}`);
    }

    const updated = cloneData(club);
    const tourney = updated.tournaments.find((t: Tournament) => t.id === activeTournamentId);
    if (tourney) {
      tourney.entries.push({
        id: generateId(),
        name: entryName,
        photoUrl: profile?.photoUrl || null,
      });
      await updateClub(updated);
    }
  };

  const handleStartTournament = async () => {
    if (!activeTournamentId) return;
    const updated = cloneData(club);
    const tourney = updated.tournaments.find((t: Tournament) => t.id === activeTournamentId);
    if (!tourney || tourney.entries.length < 2) return;

    tourney.bracket = generateBracket(tourney.entries);
    tourney.status = 'live';
    await updateClub(updated);
  };

  const handlePlayBracketMatch = async (roundIdx: number, matchIdx: number) => {
    if (!activeTournamentId) return;
    const updated = cloneData(club);
    const tourney = updated.tournaments.find((t: Tournament) => t.id === activeTournamentId);
    if (!tourney || !tourney.bracket) return;

    const bm = tourney.bracket.rounds[roundIdx][matchIdx];
    if (!bm.teamA || !bm.teamB || bm.winner) return;

    const match = initializeMatch(
      {
        type: 'tournament',
        tournamentId: activeTournamentId,
        roundIdx,
        matchIdx,
      },
      `${tourney.name} · Round ${roundIdx + 1}`,
      createTeam(bm.teamA.id, bm.teamA.name),
      createTeam(bm.teamB.id, bm.teamB.name)
    );

    bm.matchId = match.id;
    updated.matches[match.id] = match;
    await updateClub(updated);

    setActiveMatchId(match.id);
    setActiveTab('scoring');
  };

  const handleAdminAddEntry = async (name: string, photoUrl?: string) => {
    if (!activeTournamentId) return;
    const updated = cloneData(club);
    const tourney = updated.tournaments.find((t: Tournament) => t.id === activeTournamentId);
    if (!tourney || tourney.entries.length >= tourney.maxTeams) return;

    tourney.entries.push({
      id: generateId(),
      name,
      photoUrl: photoUrl || null,
    });
    if (photoUrl) {
      updated.playerPhotos[name.trim().toLowerCase()] = photoUrl;
    }
    await updateClub(updated);
  };

  const handleAdminRemoveEntry = async (entryId: string) => {
    if (!activeTournamentId) return;
    const updated = cloneData(club);
    const tourney = updated.tournaments.find((t: Tournament) => t.id === activeTournamentId);
    if (!tourney || tourney.status !== 'open') return;

    tourney.entries = tourney.entries.filter((e: { id: string }) => e.id !== entryId);
    await updateClub(updated);
  };

  // --- Booking Handlers ---
  const handleCreateBooking = async (data: {
    court: string;
    date: string;
    time: string;
    format: MatchFormat;
    fee: number;
  }) => {
    const slots = data.format === 'Singles' ? 2 : 4;
    const newBooking: CourtBooking = {
      id: generateId(),
      court: data.court,
      date: data.date,
      time: data.time,
      format: data.format,
      slotsTotal: slots,
      players: profile ? [profile.name] : ['Organizer'],
      createdBy: profile?.name || 'Club Member',
      fee: data.fee,
      status: 'open',
      matchId: null,
      winner: null,
    };

    const updated = cloneData(club);
    updated.bookings.unshift(newBooking);
    await updateClub(updated);
    setActiveBookingId(newBooking.id);
  };

  const handleJoinBooking = async () => {
    if (!activeBookingId || !profile) return;
    const target = club.bookings.find(b => b.id === activeBookingId);
    if (!target || target.players.includes(profile.name) || target.players.length >= target.slotsTotal)
      return;

    if (target.fee > 0 && wallet.balance >= target.fee) {
      await deductWallet(target.fee, `Court Fee · ${target.court}`);
    }

    const updated = cloneData(club);
    const b = updated.bookings.find((item: CourtBooking) => item.id === activeBookingId);
    if (b) {
      b.players.push(profile.name);
      if (b.players.length >= b.slotsTotal) {
        b.status = 'full';
      }
      await updateClub(updated);
    }
  };

  const handleStartCourtMatch = async () => {
    if (!activeBookingId) return;
    const updated = cloneData(club);
    const b = updated.bookings.find((item: CourtBooking) => item.id === activeBookingId);
    if (!b || b.players.length < b.slotsTotal) return;

    let teamA, teamB;
    if (b.format === 'Singles') {
      teamA = createTeam('p0', b.players[0]);
      teamB = createTeam('p1', b.players[1]);
    } else {
      teamA = createTeam('ta', `${b.players[0]} & ${b.players[1]}`, b.players[0], b.players[1]);
      teamB = createTeam('tb', `${b.players[2]} & ${b.players[3]}`, b.players[2], b.players[3]);
    }

    const match = initializeMatch(
      { type: 'booking', bookingId: activeBookingId },
      `${b.court} · Session`,
      teamA,
      teamB
    );

    b.matchId = match.id;
    updated.matches[match.id] = match;
    await updateClub(updated);

    setActiveMatchId(match.id);
    setActiveTab('scoring');
  };

  // --- Quick Match Handler ---
  const handleStartQuickMatch = async (data: {
    format: MatchFormat;
    nameA?: string;
    nameB?: string;
    rightA?: string;
    leftA?: string;
    rightB?: string;
    leftB?: string;
    pointsToWin: number;
    capPoints: number;
    bestOf: number;
  }) => {
    let teamA, teamB;
    if (data.format === 'Doubles') {
      teamA = createTeam(
        'ta',
        `${data.rightA} & ${data.leftA}`,
        data.rightA,
        data.leftA
      );
      teamB = createTeam(
        'tb',
        `${data.rightB} & ${data.leftB}`,
        data.rightB,
        data.leftB
      );
    } else {
      teamA = createTeam('pa', data.nameA || 'Player A');
      teamB = createTeam('pb', data.nameB || 'Player B');
    }

    const match = initializeMatch(
      { type: 'quick' },
      'Quick Arena Match',
      teamA,
      teamB,
      data.pointsToWin,
      data.capPoints
    );
    match.bestOf = data.bestOf;

    const updated = cloneData(club);
    updated.matches[match.id] = match;
    await updateClub(updated);

    setActiveMatchId(match.id);
    setActiveTab('scoring');
  };

  // --- Live Scoring Logic (Official BWF Engine) ---
  const handlePoint = async (teamKey: 'A' | 'B') => {
    if (!activeMatchId) return;
    const updated = cloneData(club);
    const m: Match = updated.matches[activeMatchId];
    if (!m || m.status === 'completed' || m.setFinished) return;

    // Push previous snapshot to undo history
    m.history.push({
      scoreA: m.scoreA,
      scoreB: m.scoreB,
      setsA: m.setsA,
      setsB: m.setsB,
      setHistory: cloneData(m.setHistory),
      currentSet: m.currentSet,
      status: m.status,
      winnerId: m.winnerId,
      teamA: cloneData(m.teamA),
      teamB: cloneData(m.teamB),
      servingTeam: m.servingTeam,
      setFinished: m.setFinished,
      isDeuce: m.isDeuce,
      commentary: m.commentary,
    });

    if (teamKey === 'A') {
      m.scoreA++;
    } else {
      m.scoreB++;
    }

    const activeScore = teamKey === 'A' ? m.scoreA : m.scoreB;
    const opponentScore = teamKey === 'A' ? m.scoreB : m.scoreA;
    const scoringTeam = teamKey === 'A' ? m.teamA : m.teamB;

    // Check Deuce
    m.isDeuce = m.scoreA >= m.pointsToWin - 1 && m.scoreB >= m.pointsToWin - 1;

    // Check Set Win condition:
    // (score >= pointsToWin AND difference >= 2) OR score reaches capPoints
    const isSetWon =
      (activeScore >= m.pointsToWin && activeScore - opponentScore >= 2) ||
      activeScore === m.capPoints;

    if (isSetWon) {
      if (teamKey === 'A') {
        m.setsA++;
      } else {
        m.setsB++;
      }
      m.setHistory.push({ a: m.scoreA, b: m.scoreB });
      m.setFinished = true;
      m.isDeuce = false;

      const neededSets = Math.ceil(m.bestOf / 2);
      const isMatchWon = (teamKey === 'A' ? m.setsA : m.setsB) >= neededSets;

      if (isMatchWon) {
        m.status = 'completed';
        m.winnerId = scoringTeam.id;
        m.commentary = `🏆 Match Concluded! ${scoringTeam.name} triumphs! (${m.setsA}–${m.setsB})`;
        playPointChime('game');
      } else {
        m.commentary = `🎉 ${scoringTeam.name} wins Set ${m.currentSet}! (${m.scoreA}–${m.scoreB})`;
        playPointChime('game');
      }

      m.timeline.unshift({
        id: generateId(),
        text: m.commentary,
        scoreA: m.scoreA,
        scoreB: m.scoreB,
        server: scoringTeam.name,
        time: Date.now(),
      });
    } else {
      // Standard rally continuation:
      // BWF Rule:
      // - If serving team won the rally: same server retains serve and swaps right/left court.
      // - If receiving team won the rally: they gain a point and become new serving team without swapping. Server is determined by their score (even=right, odd=left).
      if (m.servingTeam === teamKey) {
        // Serving side won rally -> swap positions
        if (teamKey === 'A') {
          m.teamA = swapTeamPositions(m.teamA);
        } else {
          m.teamB = swapTeamPositions(m.teamB);
        }
      } else {
        // Service change
        m.servingTeam = teamKey;
      }

      const currentServerTeam = teamKey === 'A' ? m.teamA : m.teamB;
      const opponentTeam = teamKey === 'A' ? m.teamB : m.teamA;
      const srv = getCurrentServer(currentServerTeam, activeScore);
      const rec = getCurrentReceiver(srv.court, opponentTeam);

      m.commentary = `⚡ ${scoringTeam.name} wins rally · ${srv.name} serves from ${srv.court} court to ${rec} · ${m.scoreA}–${m.scoreB}`;
      m.timeline.unshift({
        id: generateId(),
        text: `${scoringTeam.name} point · ${m.scoreA}–${m.scoreB}`,
        scoreA: m.scoreA,
        scoreB: m.scoreB,
        server: srv.name,
        time: Date.now(),
      });
    }

    // Sync outcome back to Tournament or Booking if match completed
    if (m.status === 'completed') {
      if (m.source.type === 'tournament' && m.source.tournamentId !== undefined) {
        const tourney = updated.tournaments.find(
          (t: Tournament) => t.id === m.source.tournamentId
        );
        if (tourney && tourney.bracket && m.source.roundIdx !== undefined && m.source.matchIdx !== undefined) {
          const roundIdx = m.source.roundIdx;
          const matchIdx = m.source.matchIdx;
          const bm = tourney.bracket.rounds[roundIdx][matchIdx];
          bm.winner = m.winnerId;

          const winningTeam = m.winnerId === m.teamA.id ? m.teamA : m.teamB;

          // Advance to next round if available
          if (roundIdx + 1 < tourney.bracket.rounds.length) {
            const nextMatch = tourney.bracket.rounds[roundIdx + 1][Math.floor(matchIdx / 2)];
            if (matchIdx % 2 === 0) {
              nextMatch.teamA = winningTeam;
            } else {
              nextMatch.teamB = winningTeam;
            }
          } else {
            // Tournament Champion!
            tourney.status = 'completed';
            tourney.championName = winningTeam.name;
          }
        }
      } else if (m.source.type === 'booking' && m.source.bookingId) {
        const booking = updated.bookings.find((b: CourtBooking) => b.id === m.source.bookingId);
        if (booking) {
          booking.status = 'completed';
          booking.winner = m.winnerId === m.teamA.id ? m.teamA.name : m.teamB.name;
        }
      }
    }

    await updateClub(updated);
  };

  const handleUndo = async () => {
    if (!activeMatchId) return;
    const updated = cloneData(club);
    const m: Match = updated.matches[activeMatchId];
    if (!m || !m.history || m.history.length === 0) return;

    const prev = m.history.pop()!;
    Object.assign(m, prev);
    if (m.timeline.length > 0) {
      m.timeline.shift();
    }
    await updateClub(updated);
  };

  const handleNextSet = async () => {
    if (!activeMatchId) return;
    const updated = cloneData(club);
    const m: Match = updated.matches[activeMatchId];
    if (!m || !m.setFinished || m.status === 'completed') return;

    m.currentSet++;
    m.scoreA = 0;
    m.scoreB = 0;
    m.setFinished = false;
    m.isDeuce = false;
    m.servingTeam = m.servingTeam === 'A' ? 'B' : 'A'; // Service alternates in new set

    const srvTeam = m.servingTeam === 'A' ? m.teamA : m.teamB;
    const oppTeam = m.servingTeam === 'A' ? m.teamB : m.teamA;
    const srv = getCurrentServer(srvTeam, 0);
    const rec = getCurrentReceiver(srv.court, oppTeam);

    m.commentary = `🏸 Set ${m.currentSet} begins · ${srv.name} serving from the ${srv.court} court to ${rec}`;
    m.timeline.unshift({
      id: generateId(),
      text: m.commentary,
      scoreA: 0,
      scoreB: 0,
      server: srv.name,
      time: Date.now(),
    });

    await updateClub(updated);
  };

  const handleResetMatch = async () => {
    if (!activeMatchId) return;
    const updated = cloneData(club);
    const m: Match = updated.matches[activeMatchId];
    if (!m) return;

    m.scoreA = 0;
    m.scoreB = 0;
    m.setsA = 0;
    m.setsB = 0;
    m.setHistory = [];
    m.currentSet = 1;
    m.status = 'in-progress';
    m.winnerId = null;
    m.history = [];
    m.setFinished = false;
    m.isDeuce = false;
    m.servingTeam = 'A';
    m.commentary = 'Match reset · Ready for Set 1 (0–0)';
    m.timeline = [
      {
        id: generateId(),
        text: 'Match reset',
        scoreA: 0,
        scoreB: 0,
        server: m.teamA.rightPlayer,
        time: Date.now(),
      },
    ];
    m.startTime = Date.now();

    await updateClub(updated);
  };

  const handleSwapPositions = async (teamKey: 'A' | 'B') => {
    if (!activeMatchId) return;
    const updated = cloneData(club);
    const m: Match = updated.matches[activeMatchId];
    if (!m || m.scoreA > 0 || m.scoreB > 0 || m.status === 'completed') return;

    if (teamKey === 'A') {
      m.teamA = swapTeamPositions(m.teamA);
    } else {
      m.teamB = swapTeamPositions(m.teamB);
    }

    const srvTeam = m.servingTeam === 'A' ? m.teamA : m.teamB;
    const oppTeam = m.servingTeam === 'A' ? m.teamB : m.teamA;
    const srv = getCurrentServer(srvTeam, 0);
    const rec = getCurrentReceiver(srv.court, oppTeam);

    m.commentary = `Positions adjusted · ${srv.name} serving from ${srv.court} court to ${rec}`;
    await updateClub(updated);
  };

  const handleChangeBestOf = async (newBestOf: number) => {
    if (!activeMatchId) return;
    const updated = cloneData(club);
    const m: Match = updated.matches[activeMatchId];
    if (!m) return;

    m.bestOf = newBestOf;
    const neededSets = Math.ceil(newBestOf / 2);
    if (m.setsA >= neededSets) {
      m.status = 'completed';
      m.winnerId = m.teamA.id;
      m.commentary = `🏆 Match Concluded! ${m.teamA.name} triumphs! (${m.setsA}–${m.setsB})`;
    } else if (m.setsB >= neededSets) {
      m.status = 'completed';
      m.winnerId = m.teamB.id;
      m.commentary = `🏆 Match Concluded! ${m.teamB.name} triumphs! (${m.setsA}–${m.setsB})`;
    } else {
      if (m.status === 'completed') {
        m.status = 'in-progress';
        m.winnerId = null;
        m.setFinished = true;
        m.commentary = `Match extended to Best of ${newBestOf} sets · Ready for Set ${m.currentSet + 1}`;
      }
    }
    await updateClub(updated);
  };

  const handleUpdatePlayerPhoto = async (playerName: string, photoUrl: string | null) => {
    const updated = cloneData(club);
    const key = playerName.trim().toLowerCase();
    if (photoUrl) {
      updated.playerPhotos[key] = photoUrl;
    } else {
      delete updated.playerPhotos[key];
    }

    if (profile && profile.name.trim().toLowerCase() === key) {
      const p = { ...profile, photoUrl };
      setProfile(p);
      await saveUserProfile(p);
    }

    await updateClub(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08090C] text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-[#CEFF00]/10 border border-[#CEFF00]/30 flex items-center justify-center text-2xl animate-pulse mb-3">
          🏸
        </div>
        <div className="font-display font-bold text-sm tracking-wider uppercase text-white/70">
          Entering RallyPoint Arena...
        </div>
      </div>
    );
  }

  const liveMatchesCount = Object.values(club.matches).filter(m => m.status === 'in-progress').length;
  const activeMatch = activeMatchId ? club.matches[activeMatchId] : null;
  const activeTournament = activeTournamentId
    ? club.tournaments.find(t => t.id === activeTournamentId)
    : null;
  const activeBooking = activeBookingId
    ? club.bookings.find(b => b.id === activeBookingId)
    : null;

  return (
    <div className="min-h-screen bg-[#08090C] text-[#E6EDF3] flex flex-col selection:bg-[#CEFF00] selection:text-black">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={tab => {
          setActiveTab(tab);
          if (tab === 'tournaments') setActiveTournamentId(null);
          if (tab === 'bookings') setActiveBookingId(null);
          if (tab === 'scoring') setActiveMatchId(null);
        }}
        profile={profile}
        wallet={wallet}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        liveMatchesCount={liveMatchesCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <DashboardView
            club={club}
            profile={profile}
            wallet={wallet}
            onNavigate={(tab, detailId) => {
              setActiveTab(tab);
              if (tab === 'tournaments' && detailId) setActiveTournamentId(detailId);
              if (tab === 'bookings' && detailId) setActiveBookingId(detailId);
              if (tab === 'scoring' && detailId) setActiveMatchId(detailId);
            }}
            onOpenQuickMatch={() => {
              setActiveTab('scoring');
              setActiveMatchId(null);
            }}
            onOpenCreateTournament={() => {
              setActiveTab('tournaments');
              setActiveTournamentId(null);
            }}
            onOpenCreateBooking={() => {
              setActiveTab('bookings');
              setActiveBookingId(null);
            }}
          />
        )}

        {/* TOURNAMENTS TAB */}
        {activeTab === 'tournaments' && (
          activeTournament ? (
            <TournamentDetailView
              tournament={activeTournament}
              profile={profile}
              wallet={wallet}
              playerPhotos={club.playerPhotos}
              onBack={() => setActiveTournamentId(null)}
              onJoin={handleJoinTournament}
              onStartTournament={handleStartTournament}
              onPlayBracketMatch={handlePlayBracketMatch}
              onViewMatch={id => {
                setActiveMatchId(id);
                setActiveTab('scoring');
              }}
              onAdminAddEntry={handleAdminAddEntry}
              onAdminRemoveEntry={handleAdminRemoveEntry}
              onOpenWallet={() => setActiveTab('wallet')}
            />
          ) : (
            <TournamentsView
              tournaments={club.tournaments}
              onSelectTournament={id => setActiveTournamentId(id)}
              onCreateTournament={handleCreateTournament}
            />
          )
        )}

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          activeBooking ? (
            <BookingDetailView
              booking={activeBooking}
              profile={profile}
              wallet={wallet}
              playerPhotos={club.playerPhotos}
              onBack={() => setActiveBookingId(null)}
              onJoin={handleJoinBooking}
              onStartMatch={handleStartCourtMatch}
              onViewMatch={id => {
                setActiveMatchId(id);
                setActiveTab('scoring');
              }}
              onOpenWallet={() => setActiveTab('wallet')}
            />
          ) : (
            <BookingsView
              bookings={club.bookings}
              profile={profile}
              wallet={wallet}
              playerPhotos={club.playerPhotos}
              onSelectBooking={id => setActiveBookingId(id)}
              onCreateBooking={handleCreateBooking}
            />
          )
        )}

        {/* SCORING TAB */}
        {activeTab === 'scoring' && (
          activeMatch ? (
            <LiveScoreView
              match={activeMatch}
              playerPhotos={club.playerPhotos}
              onBack={() => setActiveMatchId(null)}
              onPoint={handlePoint}
              onUndo={handleUndo}
              onNextSet={handleNextSet}
              onReset={handleResetMatch}
              onSwapPositions={handleSwapPositions}
              onChangeBestOf={handleChangeBestOf}
              onUpdatePlayerPhoto={handleUpdatePlayerPhoto}
            />
          ) : (
            <ScoreHubView
              club={club}
              onOpenMatch={id => setActiveMatchId(id)}
              onStartQuickMatch={handleStartQuickMatch}
            />
          )
        )}

        {/* WALLET TAB */}
        {activeTab === 'wallet' && (
          <WalletView wallet={wallet} profile={profile} onAddFunds={addFunds} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-6 px-4 text-center text-xs text-white/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-white tracking-wider">RALLYPOINT</span>
            <span>·</span>
            <span>Premier Badminton Club System</span>
          </div>
          <div>BWF Official Rally Scoring Regulations · Local Persistence Verified</div>
        </div>
      </footer>

      {/* Profile Modal */}
      <ProfileModal
        profile={profile}
        wallet={wallet}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleSaveProfile}
      />

      {/* Initial Onboarding Modal */}
      {showOnboarding && <OnboardingModal onComplete={handleSaveProfile} />}
    </div>
  );
}
