import React from 'react';
import { ClubData, UserProfile, UserWallet, Match } from '../types';
import { formatDateLabel } from '../utils/badminton';
import { Trophy, CalendarDays, Zap, ArrowRight, Plus, Crown, Users } from 'lucide-react';

interface DashboardViewProps {
  club: ClubData;
  profile: UserProfile | null;
  wallet: UserWallet;
  onNavigate: (tab: 'tournaments' | 'bookings' | 'scoring' | 'wallet', detailId?: string) => void;
  onOpenQuickMatch: () => void;
  onOpenCreateTournament: () => void;
  onOpenCreateBooking: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  club,
  profile,
  wallet,
  onNavigate,
  onOpenQuickMatch,
  onOpenCreateTournament,
  onOpenCreateBooking,
}) => {
  const liveMatches = Object.values(club.matches).filter(m => m.status === 'in-progress');
  const openTournaments = club.tournaments.filter(t => t.status !== 'completed');
  const openBookings = club.bookings.filter(b => b.status === 'open');

  // Compute leaderboard from completed tournaments and booking matches
  const winCounts: Record<string, { wins: number; matches: number; photo?: string | null }> = {};

  club.tournaments.forEach(t => {
    if (t.status === 'completed' && t.championName) {
      const name = t.championName;
      if (!winCounts[name]) winCounts[name] = { wins: 0, matches: 0 };
      winCounts[name].wins += 1;
      winCounts[name].matches += 1;
    }
  });

  club.bookings.forEach(b => {
    if (b.status === 'completed' && b.winner) {
      const name = b.winner;
      if (!winCounts[name]) winCounts[name] = { wins: 0, matches: 0 };
      winCounts[name].wins += 1;
      winCounts[name].matches += 1;
    }
  });

  Object.values(club.matches).forEach(m => {
    if (m.status === 'completed' && m.winnerId) {
      const winnerName = m.winnerId === m.teamA.id ? m.teamA.name : m.teamB.name;
      if (!winCounts[winnerName]) winCounts[winnerName] = { wins: 0, matches: 0 };
      winCounts[winnerName].wins += 1;
      winCounts[winnerName].matches += 1;
    }
  });

  const sortedLeaderboard = Object.entries(winCounts)
    .sort((a, b) => b[1].wins - a[1].wins)
    .slice(0, 5);

  const getPlayerPhoto = (name: string) => {
    return club.playerPhotos[name.trim().toLowerCase()] || null;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Welcome Banner with Dark Minimalist Vibe */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#0F141F] via-[#0B0D13] to-[#07080B] border border-white/[0.08] p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#CEFF00]/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-cyan-500/[0.03] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-mono text-[#CEFF00] tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#CEFF00] animate-ping" />
              <span>Court Systems Online</span>
              <span className="text-white/30">·</span>
              <span className="text-white/60">BWF Rally Scoring Standard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-tight text-balance">
              {profile ? `Welcome back, ${profile.name}` : 'RallyPoint Club Central'}
            </h1>
            <p className="text-sm text-white/60 leading-relaxed max-w-lg">
              Coordinate single-elimination tournament brackets, reserve synthetic match courts, track doubles positioning, and compete for the club title.
            </p>
          </div>

          {/* Quick Action Matrix */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <button
              onClick={onOpenQuickMatch}
              className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-[#CEFF00] text-black font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#b8e000] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(206,255,0,0.2)]"
            >
              <Zap size={15} />
              <span>Quick Match</span>
            </button>
            <button
              onClick={onOpenCreateTournament}
              className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-[#141924] border border-white/[0.1] text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-white/[0.08] active:scale-[0.98] transition-all"
            >
              <Trophy size={15} className="text-[#CEFF00]" />
              <span>New Tournament</span>
            </button>
            <button
              onClick={onOpenCreateBooking}
              className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-[#141924] border border-white/[0.1] text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-white/[0.08] active:scale-[0.98] transition-all"
            >
              <CalendarDays size={15} className="text-cyan-400" />
              <span>Book Court</span>
            </button>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/[0.07]">
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="text-[11px] font-medium text-white/50 flex items-center justify-between">
              <span>Live Matches</span>
              <Zap size={13} className="text-[#CEFF00]" />
            </div>
            <div className="text-2xl font-bold font-mono-numbers text-white mt-1">
              {liveMatches.length}
            </div>
            <div className="text-[10px] text-white/40 mt-0.5">In active play right now</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="text-[11px] font-medium text-white/50 flex items-center justify-between">
              <span>Tournaments</span>
              <Trophy size={13} className="text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono-numbers text-white mt-1">
              {openTournaments.length}
            </div>
            <div className="text-[10px] text-white/40 mt-0.5">Open & ongoing events</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="text-[11px] font-medium text-white/50 flex items-center justify-between">
              <span>Open Courts</span>
              <CalendarDays size={13} className="text-cyan-400" />
            </div>
            <div className="text-2xl font-bold font-mono-numbers text-white mt-1">
              {openBookings.length}
            </div>
            <div className="text-[10px] text-white/40 mt-0.5">Slots waiting for players</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="text-[11px] font-medium text-white/50 flex items-center justify-between">
              <span>Your Balance</span>
              <span className="text-[10px] font-mono text-[#CEFF00]">WAL</span>
            </div>
            <div className="text-2xl font-bold font-mono-numbers text-white mt-1">
              ₹{wallet.balance.toFixed(0)}
            </div>
            <div className="text-[10px] text-white/40 mt-0.5">Ready for court & tournament entry</div>
          </div>
        </div>
      </div>

      {/* Live In-Play Radar */}
      {liveMatches.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#CEFF00] animate-pulse" />
              <h2 className="text-base font-display font-bold text-white tracking-wide uppercase">
                Active Matches On Court
              </h2>
            </div>
            <button
              onClick={() => onNavigate('scoring')}
              className="text-xs font-semibold text-[#CEFF00] hover:underline flex items-center gap-1"
            >
              <span>View scoreboard</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveMatches.map(match => (
              <LiveMatchCard
                key={match.id}
                match={match}
                onClick={() => onNavigate('scoring', match.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Main Grid: Tournaments + Courts + Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Tournaments Spotlight & Open Courts (2 cols on lg) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Tournaments */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-display font-bold text-white tracking-tight">
                  Club Tournaments
                </h2>
                <p className="text-xs text-white/50">Single-elimination brackets & official entries</p>
              </div>
              <button
                onClick={() => onNavigate('tournaments')}
                className="text-xs font-semibold text-white/70 hover:text-white flex items-center gap-1 group"
              >
                <span>All Tournaments</span>
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {club.tournaments.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#0D1017] border border-white/[0.06] text-white/50 text-xs">
                No tournaments scheduled yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {club.tournaments.slice(0, 2).map(tourney => (
                  <div
                    key={tourney.id}
                    onClick={() => onNavigate('tournaments', tourney.id)}
                    className="p-5 rounded-2xl bg-[#0D1017] border border-white/[0.08] hover:border-white/[0.18] transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-[#CEFF00]">
                          {tourney.format}
                        </span>
                        <span className="text-xs text-white/50">
                          {tourney.entries.length} / {tourney.maxTeams} Entries
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-white group-hover:text-[#CEFF00] transition-colors leading-snug">
                        {tourney.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-white/40 mt-2">
                        <span>{tourney.venue}</span>
                        {tourney.date && (
                          <>
                            <span>·</span>
                            <span>{formatDateLabel(tourney.date)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">
                        {tourney.fee > 0 ? `₹${tourney.fee} entry` : 'Free entry'}
                      </span>
                      <span className="font-semibold text-cyan-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        Bracket Details →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Open Court Slots */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-display font-bold text-white tracking-tight">
                  Open Court Bookings
                </h2>
                <p className="text-xs text-white/50">Join open slots or reserve an arena</p>
              </div>
              <button
                onClick={() => onNavigate('bookings')}
                className="text-xs font-semibold text-white/70 hover:text-white flex items-center gap-1 group"
              >
                <span>Court Schedule</span>
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {club.bookings.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#0D1017] border border-white/[0.06] text-white/50 text-xs">
                No courts booked for upcoming sessions.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {club.bookings.slice(0, 2).map(booking => {
                  const spotsLeft = booking.slotsTotal - booking.players.length;
                  return (
                    <div
                      key={booking.id}
                      onClick={() => onNavigate('bookings', booking.id)}
                      className="p-5 rounded-2xl bg-[#0D1017] border border-white/[0.08] hover:border-white/[0.18] transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-mono text-cyan-400">
                            {booking.time || 'Flexible'} · {formatDateLabel(booking.date)}
                          </span>
                          <span
                            className={`text-xs font-medium ${
                              spotsLeft > 0 ? 'text-[#CEFF00]' : 'text-white/40'
                            }`}
                          >
                            {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft > 1 ? 's' : ''} open` : 'Full'}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors">
                          {booking.court}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-white/50 mt-1">
                          <Users size={13} />
                          <span>{booking.players.join(', ') || 'No players yet'}</span>
                        </div>
                      </div>

                      <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between text-xs">
                        <span className="text-white/70">
                          {booking.fee > 0 ? `₹${booking.fee} / player` : 'Complimentary'}
                        </span>
                        <span className="font-semibold text-white group-hover:text-[#CEFF00] transition-colors">
                          Join Game →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Club Leaderboard & Player Radar */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#0D1017] border border-white/[0.08] relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Crown size={16} className="text-amber-400" />
                <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white">
                  Club Leaderboard
                </h3>
              </div>
              <span className="text-[10px] font-mono text-white/40">Hall of Fame</span>
            </div>

            {sortedLeaderboard.length === 0 ? (
              <div className="py-8 text-center text-xs text-white/40">
                Play tournament finals or booking matches to earn podium points.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {sortedLeaderboard.map(([name, data], idx) => {
                  const photo = getPlayerPhoto(name);
                  return (
                    <div key={name} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-5 text-center text-xs font-mono font-bold ${
                            idx === 0
                              ? 'text-amber-400'
                              : idx === 1
                              ? 'text-slate-300'
                              : idx === 2
                              ? 'text-amber-600'
                              : 'text-white/40'
                          }`}
                        >
                          0{idx + 1}
                        </span>

                        <div className="w-11 h-11 rounded-2xl bg-[#181F2C] border-2 border-white/[0.12] overflow-hidden flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm">
                          {photo ? (
                            <img src={photo} alt={name} className="w-full h-full object-cover" />
                          ) : (
                            name.charAt(0).toUpperCase()
                          )}
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-white truncate max-w-[110px] sm:max-w-[140px]">
                            {name}
                          </div>
                          <div className="text-[10px] text-white/40 font-mono-numbers">
                            {data.matches} matches played
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold font-mono-numbers text-[#CEFF00]">
                          {data.wins}
                        </span>
                        <span className="text-[10px] text-white/40 ml-1">wins</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Rules Snapshot Card */}
          <div className="p-5 rounded-2xl bg-[#090C12] border border-white/[0.06] text-xs space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-400 font-semibold block">
              BWF Doubles Position Rule
            </span>
            <p className="text-white/60 text-[11px] leading-relaxed">
              When serving side wins a rally, server retains service and swaps right/left court. When receiving side wins, they score a point, become new server (determined by their score: even=right, odd=left), without swapping courts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface LiveMatchCardProps {
  match: Match;
  onClick: () => void;
}

const LiveMatchCard: React.FC<LiveMatchCardProps> = ({ match, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="p-5 rounded-2xl bg-[#0F131C] border border-[#CEFF00]/20 hover:border-[#CEFF00]/50 transition-all cursor-pointer shadow-lg group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#CEFF00]/5 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-center justify-between text-xs text-white/50 mb-3">
        <span className="truncate max-w-[180px] font-medium">{match.title}</span>
        <span className="px-2 py-0.5 rounded-full bg-[#CEFF00]/10 text-[#CEFF00] font-mono text-[10px] font-semibold border border-[#CEFF00]/30 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#CEFF00] animate-pulse" />
          Set {match.currentSet} · LIVE
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Team A */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-semibold truncate ${
                match.servingTeam === 'A' ? 'text-[#CEFF00]' : 'text-white'
              }`}
            >
              {match.teamA.name}
            </span>
            {match.servingTeam === 'A' && <span className="text-xs">🏸</span>}
          </div>
          <div className="text-[11px] text-white/40">Sets: {match.setsA}</div>
        </div>

        {/* Score Display */}
        <div className="flex items-center gap-2 font-display text-2xl sm:text-3xl font-bold tracking-tight px-3 py-1 rounded-xl bg-black/40 border border-white/[0.08] font-mono-numbers">
          <span className={match.servingTeam === 'A' ? 'text-[#CEFF00]' : 'text-white'}>
            {match.scoreA}
          </span>
          <span className="text-white/30 text-lg">:</span>
          <span className={match.servingTeam === 'B' ? 'text-[#CEFF00]' : 'text-white'}>
            {match.scoreB}
          </span>
        </div>

        {/* Team B */}
        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center justify-end gap-2">
            {match.servingTeam === 'B' && <span className="text-xs">🏸</span>}
            <span
              className={`text-sm font-semibold truncate ${
                match.servingTeam === 'B' ? 'text-[#CEFF00]' : 'text-white'
              }`}
            >
              {match.teamB.name}
            </span>
          </div>
          <div className="text-[11px] text-white/40">Sets: {match.setsB}</div>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-white/[0.06] text-[11px] text-white/60 truncate flex items-center justify-between">
        <span className="truncate">{match.commentary}</span>
        <span className="text-[#CEFF00] font-semibold text-xs shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform">
          Score Rally →
        </span>
      </div>
    </div>
  );
};
