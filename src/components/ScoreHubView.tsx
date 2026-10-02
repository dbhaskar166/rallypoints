import React, { useState } from 'react';
import { ClubData, Match, MatchFormat } from '../types';
import { MatchStatsAnalytics } from './MatchStatsAnalytics';
import { generateClubMatchAnalytics } from '../utils/analytics';
import {
  Zap,
  Plus,
  Play,
  Trophy,
  CalendarDays,
  Clock,
  CheckCircle2,
  BarChart3,
  Timer,
  Swords,
  Shield,
  Activity,
} from 'lucide-react';

interface ScoreHubViewProps {
  club: ClubData;
  onOpenMatch: (matchId: string) => void;
  onStartQuickMatch: (data: {
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
  }) => void;
}

export const ScoreHubView: React.FC<ScoreHubViewProps> = ({
  club,
  onOpenMatch,
  onStartQuickMatch,
}) => {
  const [viewMode, setViewMode] = useState<'matches' | 'analytics'>('matches');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'All' | 'in-progress' | 'completed'>('All');

  // Quick match form states
  const [format, setFormat] = useState<MatchFormat>('Doubles');
  const [nameA, setNameA] = useState('Team Alpha');
  const [nameB, setNameB] = useState('Team Omega');
  const [rightA, setRightA] = useState('Alex');
  const [leftA, setLeftA] = useState('Marcus');
  const [rightB, setRightB] = useState('Vikram');
  const [leftB, setLeftB] = useState('Daniel');
  const [pointsToWin, setPointsToWin] = useState('21');
  const [capPoints, setCapPoints] = useState('30');
  const [bestOf, setBestOf] = useState('3');

  const matchesList = Object.values(club.matches).sort((a, b) => {
    // In-progress first, then newest
    if (a.status === 'in-progress' && b.status !== 'in-progress') return -1;
    if (b.status === 'in-progress' && a.status !== 'in-progress') return 1;
    return b.startTime - a.startTime;
  });

  const filteredMatches = matchesList.filter(m => {
    if (filter === 'All') return true;
    return m.status === filter;
  });

  // Summary preview for the top radar banner
  const quickStats = generateClubMatchAnalytics(matchesList, undefined, club.playerPhotos);

  const handleStartQuick = (e: React.FormEvent) => {
    e.preventDefault();
    onStartQuickMatch({
      format,
      nameA: format === 'Singles' ? nameA.trim() || 'Player A' : undefined,
      nameB: format === 'Singles' ? nameB.trim() || 'Player B' : undefined,
      rightA: format === 'Doubles' ? rightA.trim() || 'Player 1' : undefined,
      leftA: format === 'Doubles' ? leftA.trim() || 'Player 2' : undefined,
      rightB: format === 'Doubles' ? rightB.trim() || 'Player 3' : undefined,
      leftB: format === 'Doubles' ? leftB.trim() || 'Player 4' : undefined,
      pointsToWin: Number(pointsToWin) || 21,
      capPoints: Number(capPoints) || 30,
      bestOf: Number(bestOf) || 3,
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Quick Match CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
            Live Match Scoring
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Official BWF scoring system, server rotation, deuce engine & court simulator
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#CEFF00] text-black font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#b8e000] active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(206,255,0,0.2)] shrink-0"
        >
          <Zap size={16} fill="currentColor" />
          <span>Start Quick Match</span>
        </button>
      </div>

      {/* Main Mode Switcher: Matches vs Analytics */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 p-1 bg-[#0D1017] border border-white/[0.08] rounded-2xl w-fit">
          <button
            onClick={() => setViewMode('matches')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all ${
              viewMode === 'matches'
                ? 'bg-[#CEFF00] text-black shadow-[0_0_15px_rgba(206,255,0,0.25)] font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span>🏸 Live & Fixtures</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-black/20">
              {matchesList.length}
            </span>
          </button>

          <button
            onClick={() => setViewMode('analytics')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all ${
              viewMode === 'analytics'
                ? 'bg-[#CEFF00] text-black shadow-[0_0_15px_rgba(206,255,0,0.25)] font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <BarChart3 size={14} />
            <span>Match Statistics & Head-to-Head</span>
            <span className="w-2 h-2 rounded-full bg-[#CEFF00] animate-pulse" />
          </button>
        </div>

        {viewMode === 'matches' && (
          /* Filter Tabs for matches */
          <div className="flex items-center gap-1 p-1 bg-[#0D1017] border border-white/[0.08] rounded-xl self-start sm:self-auto w-fit">
            {(['All', 'in-progress', 'completed'] as const).map(st => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                  filter === st
                    ? 'bg-[#CEFF00]/15 text-[#CEFF00] border border-[#CEFF00]/30 shadow-sm'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {st === 'All' ? 'All' : st === 'in-progress' ? 'Live' : 'Completed'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* VIEW MODE 1: ANALYTICS RADAR VIEW */}
      {viewMode === 'analytics' ? (
        <MatchStatsAnalytics
          matches={matchesList}
          playerPhotos={club.playerPhotos}
          onOpenMatch={onOpenMatch}
        />
      ) : (
        /* VIEW MODE 2: MATCHES LIST WITH QUICK RADAR PREVIEW */
        <div className="space-y-6">
          {/* Quick Radar Snapshot Banner */}
          <div
            onClick={() => setViewMode('analytics')}
            className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#0D1017] via-[#111722] to-[#0D1017] border border-white/[0.08] hover:border-[#CEFF00]/40 transition-all cursor-pointer group shadow-lg"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#CEFF00]/10 border border-[#CEFF00]/30 flex items-center justify-center text-[#CEFF00] shrink-0">
                  <Activity size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white group-hover:text-[#CEFF00] transition-colors">
                      Live Performance Radar & Head-to-Head
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#CEFF00]/10 text-[#CEFF00] border border-[#CEFF00]/20 font-bold">
                      Analytics Active
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-white/50 mt-1 font-mono">
                    <span className="flex items-center gap-1.5">
                      <Timer size={13} className="text-[#CEFF00]" />
                      <span>Avg Rally: <strong className="text-white font-semibold">{quickStats.avgRallySeconds}s</strong></span>
                    </span>
                    <span className="hidden sm:inline text-white/20">·</span>
                    <span className="flex items-center gap-1.5">
                      <Zap size={13} className="text-[#CEFF00]" />
                      <span>Serve Hold: <strong className="text-[#CEFF00] font-semibold">{quickStats.servePct}%</strong></span>
                    </span>
                    <span className="hidden sm:inline text-white/20">·</span>
                    <span className="flex items-center gap-1.5">
                      <Shield size={13} className="text-cyan-400" />
                      <span>Break Rate: <strong className="text-cyan-400 font-semibold">{quickStats.receiverPct}%</strong></span>
                    </span>
                    <span className="hidden sm:inline text-white/20">·</span>
                    <span className="flex items-center gap-1.5">
                      <Swords size={13} className="text-purple-300" />
                      <span>Rivalries: <strong className="text-white font-semibold">{quickStats.rivalries.length} Pairings</strong></span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#CEFF00] group-hover:translate-x-0.5 transition-transform self-end md:self-auto shrink-0">
                <span>Explore Full Statistics</span>
                <span>→</span>
              </div>
            </div>
          </div>

          {/* Match Cards List */}
          {filteredMatches.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#0D1017] border border-white/[0.06] text-white/50 space-y-3">
              <Zap size={32} className="mx-auto text-white/20" />
              <div className="text-sm font-semibold text-white/70">No matches found</div>
              <p className="text-xs text-white/40 max-w-sm mx-auto">
                Start a quick practice match or launch a match from a tournament bracket or booked court.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMatches.map(m => {
                const isLive = m.status === 'in-progress';
                return (
                  <div
                    key={m.id}
                    onClick={() => onOpenMatch(m.id)}
                    className={`p-5 rounded-2xl bg-[#0D1017] border transition-all cursor-pointer group relative overflow-hidden ${
                      isLive
                        ? 'border-[#CEFF00]/30 hover:border-[#CEFF00]/60 shadow-[0_0_20px_rgba(206,255,0,0.05)]'
                        : 'border-white/[0.08] hover:border-white/[0.2]'
                    }`}
                  >
                    {/* Header status */}
                    <div className="flex items-center justify-between text-xs mb-3">
                      <div className="flex items-center gap-2">
                        {m.source.type === 'tournament' ? (
                          <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400">
                            <Trophy size={12} />
                            <span>Tournament</span>
                          </span>
                        ) : m.source.type === 'booking' ? (
                          <span className="flex items-center gap-1 text-[11px] font-mono text-cyan-400">
                            <CalendarDays size={12} />
                            <span>Court Match</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-mono text-[#CEFF00]">
                            <Zap size={12} />
                            <span>Quick Match</span>
                          </span>
                        )}
                        <span className="text-white/30">·</span>
                        <span className="text-white/50 truncate max-w-[130px]">{m.title}</span>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold border ${
                          isLive
                            ? 'bg-[#CEFF00]/10 text-[#CEFF00] border-[#CEFF00]/30 animate-pulse'
                            : 'bg-white/5 text-white/40 border-white/10'
                        }`}
                      >
                        {isLive ? `Set ${m.currentSet} · Live` : 'Completed'}
                      </span>
                    </div>

                    {/* Scoreboard line */}
                    <div className="flex items-center justify-between gap-4 py-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-sm font-semibold truncate ${
                              m.servingTeam === 'A' && isLive ? 'text-[#CEFF00]' : 'text-white'
                            }`}
                          >
                            {m.teamA.name}
                          </span>
                          {m.servingTeam === 'A' && isLive && <span className="text-xs">🏸</span>}
                        </div>
                        <div className="text-[11px] text-white/40 font-mono-numbers">
                          Sets Won: {m.setsA}
                        </div>
                      </div>

                      {/* Big Numerals */}
                      <div className="flex items-center gap-2 font-display text-2xl font-bold px-3 py-1 rounded-xl bg-black/40 border border-white/[0.08] font-mono-numbers">
                        <span className={m.servingTeam === 'A' && isLive ? 'text-[#CEFF00]' : 'text-white'}>
                          {m.scoreA}
                        </span>
                        <span className="text-white/30 text-lg">:</span>
                        <span className={m.servingTeam === 'B' && isLive ? 'text-[#CEFF00]' : 'text-white'}>
                          {m.scoreB}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {m.servingTeam === 'B' && isLive && <span className="text-xs">🏸</span>}
                          <span
                            className={`text-sm font-semibold truncate ${
                              m.servingTeam === 'B' && isLive ? 'text-[#CEFF00]' : 'text-white'
                            }`}
                          >
                            {m.teamB.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-white/40 font-mono-numbers">
                          Sets Won: {m.setsB}
                        </div>
                      </div>
                    </div>

                    {/* Past Sets Strip */}
                    {m.setHistory.length > 0 && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/[0.05] text-[11px] text-white/50 font-mono-numbers">
                        <span>Set History:</span>
                        {m.setHistory.map((s, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded bg-white/[0.04] text-white/70">
                            {s.a}–{s.b}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer commentary */}
                    <div className="mt-3 pt-2.5 border-t border-white/[0.06] text-[11px] text-white/60 truncate flex items-center justify-between">
                      <span className="truncate">{m.commentary}</span>
                      <span className="text-[#CEFF00] font-semibold text-xs shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform">
                        {isLive ? 'Score Rally →' : 'View Stats →'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Start Quick Match Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-[#0D1017] border border-white/[0.12] p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-[#CEFF00]" />
                <h2 className="text-lg font-display font-bold text-white">Start Quick Match</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/60 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStartQuick} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Match Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat('Doubles')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      format === 'Doubles'
                        ? 'bg-[#CEFF00]/15 text-[#CEFF00] border-[#CEFF00]/40'
                        : 'bg-[#141824] text-white/60 border-white/[0.08]'
                    }`}
                  >
                    Doubles (2 vs 2)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('Singles')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      format === 'Singles'
                        ? 'bg-[#CEFF00]/15 text-[#CEFF00] border-[#CEFF00]/40'
                        : 'bg-[#141824] text-white/60 border-white/[0.08]'
                    }`}
                  >
                    Singles (1 vs 1)
                  </button>
                </div>
              </div>

              {format === 'Doubles' ? (
                <>
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                    <span className="text-xs font-semibold text-emerald-400 block font-mono">
                      TEAM A (NEAR COURT)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-white/50 mb-1">
                          Right Court (Even Serve)
                        </label>
                        <input
                          type="text"
                          required
                          value={rightA}
                          onChange={e => setRightA(e.target.value)}
                          placeholder="Player 1"
                          className="w-full px-3 py-2 rounded-xl bg-[#141824] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#CEFF00]/50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-white/50 mb-1">
                          Left Court (Odd Serve)
                        </label>
                        <input
                          type="text"
                          required
                          value={leftA}
                          onChange={e => setLeftA(e.target.value)}
                          placeholder="Player 2"
                          className="w-full px-3 py-2 rounded-xl bg-[#141824] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#CEFF00]/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                    <span className="text-xs font-semibold text-cyan-400 block font-mono">
                      TEAM B (FAR COURT)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-white/50 mb-1">
                          Right Court (Even Serve)
                        </label>
                        <input
                          type="text"
                          required
                          value={rightB}
                          onChange={e => setRightB(e.target.value)}
                          placeholder="Player 3"
                          className="w-full px-3 py-2 rounded-xl bg-[#141824] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#CEFF00]/50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-white/50 mb-1">
                          Left Court (Odd Serve)
                        </label>
                        <input
                          type="text"
                          required
                          value={leftB}
                          onChange={e => setLeftB(e.target.value)}
                          placeholder="Player 4"
                          className="w-full px-3 py-2 rounded-xl bg-[#141824] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#CEFF00]/50"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1.5">
                      Player A
                    </label>
                    <input
                      type="text"
                      required
                      value={nameA}
                      onChange={e => setNameA(e.target.value)}
                      placeholder="e.g. Diwakar"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#141824] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#CEFF00]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1.5">
                      Player B
                    </label>
                    <input
                      type="text"
                      required
                      value={nameB}
                      onChange={e => setNameB(e.target.value)}
                      placeholder="e.g. Rahul"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#141824] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#CEFF00]/50"
                    />
                  </div>
                </div>
              )}

              {/* Match Rules & Point Settings */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-white/60 mb-1">
                    Points to Win
                  </label>
                  <select
                    value={pointsToWin}
                    onChange={e => setPointsToWin(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#141824] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#CEFF00]/50"
                  >
                    <option value="21">21 (BWF)</option>
                    <option value="15">15 (Rapid)</option>
                    <option value="11">11 (Blitz)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-white/60 mb-1">
                    Deuce Cap
                  </label>
                  <select
                    value={capPoints}
                    onChange={e => setCapPoints(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#141824] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#CEFF00]/50"
                  >
                    <option value="30">30 Points</option>
                    <option value="25">25 Points</option>
                    <option value="21">21 (No Deuce)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-white/60 mb-1">
                    Sets (Best of)
                  </label>
                  <select
                    value={bestOf}
                    onChange={e => setBestOf(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#141824] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#CEFF00]/50"
                  >
                    <option value="3">Best of 3</option>
                    <option value="1">1 Set Shootout</option>
                    <option value="5">Best of 5</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#CEFF00] hover:bg-[#b8e000] text-black text-xs font-semibold transition-all shadow-[0_0_15px_rgba(206,255,0,0.2)]"
                >
                  Launch Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
