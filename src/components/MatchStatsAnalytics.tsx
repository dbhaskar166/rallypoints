import React, { useState, useMemo } from 'react';
import { Match } from '../types';
import {
  generateClubMatchAnalytics,
  HeadToHeadMatchup,
} from '../utils/analytics';
import {
  Timer,
  Activity,
  Flame,
  Zap,
  TrendingUp,
  Swords,
  Award,
  Users,
  Shield,
  Clock,
  CheckCircle2,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface MatchStatsAnalyticsProps {
  matches: Match[];
  playerPhotos: Record<string, string>;
  onOpenMatch?: (matchId: string) => void;
}

export const MatchStatsAnalytics: React.FC<MatchStatsAnalyticsProps> = ({
  matches,
  playerPhotos,
  onOpenMatch,
}) => {
  const [selectedMatchId, setSelectedMatchId] = useState<string>('ALL');

  // Compute analytics
  const analytics = useMemo(() => {
    return generateClubMatchAnalytics(matches, selectedMatchId, playerPhotos);
  }, [matches, selectedMatchId, playerPhotos]);

  // Head-to-head custom comparator state
  const competitors = analytics.allCompetitors;
  const defaultPlayerA = competitors[0] || 'Alex & Marcus';
  const defaultPlayerB =
    competitors.find(c => c !== defaultPlayerA) || competitors[1] || 'Vikram & Daniel';

  const [compareA, setCompareA] = useState<string>(defaultPlayerA);
  const [compareB, setCompareB] = useState<string>(defaultPlayerB);

  // Active custom matchup calculation
  const customMatchup = useMemo<HeadToHeadMatchup | null>(() => {
    if (!compareA || !compareB || compareA === compareB) return null;
    const found = analytics.rivalries.find(
      r =>
        (r.nameA.toLowerCase() === compareA.toLowerCase() &&
          r.nameB.toLowerCase() === compareB.toLowerCase()) ||
        (r.nameA.toLowerCase() === compareB.toLowerCase() &&
          r.nameB.toLowerCase() === compareA.toLowerCase())
    );

    if (found) {
      // Re-align so nameA matches compareA
      if (found.nameA.toLowerCase() === compareA.toLowerCase()) {
        return found;
      }
      return {
        ...found,
        nameA: found.nameB,
        nameB: found.nameA,
        photoA: found.photoB,
        photoB: found.photoA,
        winsA: found.winsB,
        winsB: found.winsA,
        pctA: found.pctB,
        pctB: found.pctA,
        setsA: found.setsB,
        setsB: found.setsA,
      };
    }

    // If no past match recorded yet between this pair
    return {
      key: `${compareA}::${compareB}`,
      nameA: compareA,
      nameB: compareB,
      photoA: playerPhotos[compareA.trim().toLowerCase()],
      photoB: playerPhotos[compareB.trim().toLowerCase()],
      matchesPlayed: 0,
      winsA: 0,
      winsB: 0,
      pctA: 50,
      pctB: 50,
      setsA: 0,
      setsB: 0,
      recentWinner: 'No encounters yet',
      recentScore: '—',
      matches: [],
    };
  }, [compareA, compareB, analytics.rivalries, playerPhotos]);

  const getAvatar = (name: string, photo?: string, sizeClass = 'w-10 h-10') => {
    const finalPhoto = photo || playerPhotos[name.trim().toLowerCase()];
    if (finalPhoto) {
      return (
        <img
          src={finalPhoto}
          alt={name}
          className={`${sizeClass} rounded-2xl object-cover border-2 border-white/20 shadow-md shrink-0`}
        />
      );
    }
    return (
      <div
        className={`${sizeClass} rounded-2xl bg-[#141824] border-2 border-white/10 flex items-center justify-center font-bold text-sm text-[#CEFF00] shrink-0 shadow-md`}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Controls & Scope Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#0D1017] border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#CEFF00]/10 border border-[#CEFF00]/30 flex items-center justify-center text-[#CEFF00] shadow-[0_0_15px_rgba(206,255,0,0.15)]">
            <Activity size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-display font-bold text-white tracking-tight">
                Match Performance & Head-to-Head Radar
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#CEFF00]/10 text-[#CEFF00] border border-[#CEFF00]/20 text-[10px] font-mono uppercase tracking-wider font-bold">
                BWF Analytics
              </span>
            </div>
            <p className="text-xs text-white/50 mt-0.5">
              Rally duration analysis, server vs receiver point conversion & repeat player win ratios
            </p>
          </div>
        </div>

        {/* Match Selector Dropdown */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <Filter size={14} className="text-white/40 shrink-0" />
          <select
            value={selectedMatchId}
            onChange={e => setSelectedMatchId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#141824] border border-white/[0.1] text-xs font-semibold text-white focus:outline-none focus:border-[#CEFF00]/50"
          >
            <option value="ALL">All Club Matches (Aggregate)</option>
            {matches.map(m => (
              <option key={m.id} value={m.id}>
                {m.title} ({m.teamA.name} vs {m.teamB.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 Core Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Rally Duration */}
        <div className="p-5 rounded-3xl bg-[#0D1017] border border-white/[0.08] relative overflow-hidden group hover:border-[#CEFF00]/30 transition-colors">
          <div className="flex items-center justify-between text-white/50 text-xs mb-3">
            <span className="font-semibold uppercase tracking-wider text-[11px] font-display">
              Avg Rally Duration
            </span>
            <div className="w-7 h-7 rounded-xl bg-white/[0.04] flex items-center justify-center text-[#CEFF00]">
              <Timer size={15} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold text-white font-mono-numbers">
              {analytics.avgRallySeconds}s
            </span>
            <span className="text-xs font-mono text-[#CEFF00]">per point</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
            <span className="text-white/40">Longest rally:</span>
            <span className="font-semibold font-mono text-amber-400 flex items-center gap-1">
              <Flame size={12} />
              <span>{analytics.longestRally.durationSeconds}s</span>
            </span>
          </div>
        </div>

        {/* Card 2: Server Hold Points */}
        <div className="p-5 rounded-3xl bg-[#0D1017] border border-white/[0.08] relative overflow-hidden group hover:border-[#CEFF00]/30 transition-colors">
          <div className="flex items-center justify-between text-white/50 text-xs mb-3">
            <span className="font-semibold uppercase tracking-wider text-[11px] font-display">
              Points Won on Serve
            </span>
            <div className="w-7 h-7 rounded-xl bg-[#CEFF00]/10 flex items-center justify-center text-[#CEFF00]">
              <Zap size={15} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold text-[#CEFF00] font-mono-numbers">
              {analytics.servePct}%
            </span>
            <span className="text-xs font-mono text-white/40">Hold rate</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
            <span className="text-white/40">Total server points:</span>
            <span className="font-semibold font-mono text-white/90">
              {analytics.servePoints} points
            </span>
          </div>
        </div>

        {/* Card 3: Receiver Break Points */}
        <div className="p-5 rounded-3xl bg-[#0D1017] border border-white/[0.08] relative overflow-hidden group hover:border-cyan-400/30 transition-colors">
          <div className="flex items-center justify-between text-white/50 text-xs mb-3">
            <span className="font-semibold uppercase tracking-wider text-[11px] font-display">
              Points Won on Return
            </span>
            <div className="w-7 h-7 rounded-xl bg-cyan-400/10 flex items-center justify-center text-cyan-400">
              <Shield size={15} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold text-cyan-400 font-mono-numbers">
              {analytics.receiverPct}%
            </span>
            <span className="text-xs font-mono text-white/40">Break rate</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
            <span className="text-white/40">Net Serve Margin:</span>
            <span className="font-semibold font-mono text-[#CEFF00]">
              +{analytics.serveAdvantagePct}%
            </span>
          </div>
        </div>

        {/* Card 4: Repeat Rivalries */}
        <div className="p-5 rounded-3xl bg-[#0D1017] border border-white/[0.08] relative overflow-hidden group hover:border-purple-400/30 transition-colors">
          <div className="flex items-center justify-between text-white/50 text-xs mb-3">
            <span className="font-semibold uppercase tracking-wider text-[11px] font-display">
              Repeat Rivalries
            </span>
            <div className="w-7 h-7 rounded-xl bg-purple-400/10 flex items-center justify-center text-purple-300">
              <Swords size={15} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold text-white font-mono-numbers">
              {analytics.rivalries.length}
            </span>
            <span className="text-xs font-mono text-white/40">Pairings tracked</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
            <span className="text-white/40">Total rallies analyzed:</span>
            <span className="font-semibold font-mono text-white/90">
              {analytics.totalRallies} rallies
            </span>
          </div>
        </div>
      </div>

      {/* Section 1 & 2: Server vs Receiver Conversion & Rally Duration Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANEL 1: Server vs Receiver Win Conversion */}
        <div className="p-6 rounded-3xl bg-[#0D1017] border border-white/[0.08] space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#CEFF00] animate-pulse" />
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white">
                Server vs Receiver Win Conversion
              </h3>
            </div>
            <span className="text-[11px] font-mono text-white/40">Rally Point Model</span>
          </div>

          <p className="text-xs text-white/50 leading-relaxed">
            In badminton rally point scoring, every rally yields a point. This metric calculates how frequently the server holds serve vs when the receiver forces a turnover break.
          </p>

          {/* Visual Dual-Tone Segmented Progress Bar */}
          <div className="space-y-2">
            <div className="h-5 rounded-xl bg-black/60 border border-white/[0.08] overflow-hidden flex p-0.5">
              <div
                style={{ width: `${analytics.servePct}%` }}
                className="h-full rounded-lg bg-gradient-to-r from-[#CEFF00] to-[#b3e000] shadow-[0_0_12px_rgba(206,255,0,0.3)] transition-all duration-700"
              />
              <div
                style={{ width: `${analytics.receiverPct}%` }}
                className="h-full rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.3)] transition-all duration-700"
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-1.5 text-[#CEFF00]">
                <span className="w-2 h-2 rounded-full bg-[#CEFF00]" />
                <span className="font-bold">Serving Side: {analytics.servePct}%</span>
                <span className="text-white/40">({analytics.servePoints} pts)</span>
              </div>
              <div className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="font-bold">Receiving Side: {analytics.receiverPct}%</span>
                <span className="text-white/40">({analytics.receiverPoints} pts)</span>
              </div>
            </div>
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-[#CEFF00]/20 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#CEFF00]">
                <Zap size={13} />
                <span>Service Hold Dominance</span>
              </div>
              <div className="text-xl font-bold font-mono-numbers text-white">
                {analytics.servePct}%
              </div>
              <p className="text-[10px] text-white/40 leading-snug">
                Points won while holding the shuttlecock serve. Front-court control dictates rallies.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-cyan-400/20 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-400">
                <Shield size={13} />
                <span>Return Break Efficiency</span>
              </div>
              <div className="text-xl font-bold font-mono-numbers text-white">
                {analytics.receiverPct}%
              </div>
              <p className="text-[10px] text-white/40 leading-snug">
                Break point turnover rate. Fast drives & angled returns overturn serving advantage.
              </p>
            </div>
          </div>

          {/* Top Servers Hold leaderboard */}
          {analytics.topServers.length > 0 && (
            <div className="pt-2 border-t border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white/70">Top Service Hold Leaders</span>
                <span className="text-[10px] font-mono text-white/40">Hold %</span>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {analytics.topServers.map((srv, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-white/30 font-mono text-[11px] w-4">{idx + 1}</span>
                      <span className="font-semibold text-white">{srv.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-white/40 text-[11px]">
                        {srv.pointsWonOnServe} pts won
                      </span>
                      <span className="font-bold text-[#CEFF00]">{srv.serveHoldPct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* PANEL 2: Rally Duration & Pace Matrix */}
        <div className="p-6 rounded-3xl bg-[#0D1017] border border-white/[0.08] space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer size={16} className="text-[#CEFF00]" />
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white">
                Rally Duration & Pace Matrix
              </h3>
            </div>
            <span className="text-[11px] font-mono text-white/40">
              Avg: {analytics.avgRallySeconds}s
            </span>
          </div>

          <p className="text-xs text-white/50 leading-relaxed">
            Distribution of exchange lengths between service and shuttle drop. Highlights whether matches are dominated by rapid smashes or endurance defense.
          </p>

          {/* Duration Buckets */}
          <div className="space-y-3">
            {Object.entries(analytics.rallyBuckets).map(([key, bucket]) => (
              <div
                key={key}
                className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white block">{bucket.label}</span>
                    <span className="text-[10px] text-white/40">{bucket.sublabel}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold font-mono text-sm" style={{ color: bucket.color }}>
                      {bucket.pct}%
                    </span>
                    <span className="text-[10px] text-white/40 font-mono block">
                      {bucket.count} rallies
                    </span>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
                  <div
                    style={{ width: `${bucket.pct}%`, backgroundColor: bucket.color }}
                    className="h-full rounded-full transition-all duration-700"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Longest Rally Highlight Spotlight */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <Flame size={20} />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-300 uppercase tracking-wide font-mono">
                  Longest Rally Spotlight
                </span>
                <span className="text-sm font-bold font-mono text-amber-400">
                  {analytics.longestRally.durationSeconds}s
                </span>
              </div>
              <div className="text-xs font-semibold text-white truncate">
                {analytics.longestRally.teams}
              </div>
              <div className="text-[11px] text-white/50 flex items-center gap-2">
                <span>{analytics.longestRally.matchTitle}</span>
                <span>·</span>
                <span className="font-mono text-white/70">Point: {analytics.longestRally.pointScore}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Head-to-Head Win Ratios & Rivalry Radar */}
      <div className="p-6 rounded-3xl bg-[#0D1017] border border-white/[0.08] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Swords size={18} className="text-[#CEFF00]" />
            <div>
              <h3 className="text-base font-display font-bold text-white tracking-tight">
                Head-to-Head Win Ratios & Rivalry Radar
              </h3>
              <p className="text-xs text-white/50 mt-0.5">
                Lifetime win rates, direct encounters & set splits between repeat opponents
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-[#CEFF00] bg-[#CEFF00]/10 px-3 py-1 rounded-full border border-[#CEFF00]/20 self-start sm:self-auto">
            {analytics.rivalries.length} Repeat Rivalries
          </span>
        </div>

        {/* Interactive Custom Head-to-Head Matchup Selector */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/[0.06]">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80 font-mono">
              Compare Any Two Competitors
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-white/40">Select opponents to evaluate match history</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-white/60 mb-1.5">
                Competitor 1
              </label>
              <select
                value={compareA}
                onChange={e => setCompareA(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#141824] border border-white/[0.1] text-xs font-semibold text-white focus:outline-none focus:border-[#CEFF00]/50"
              >
                {competitors.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-white/60 mb-1.5">
                Competitor 2
              </label>
              <select
                value={compareB}
                onChange={e => setCompareB(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#141824] border border-white/[0.1] text-xs font-semibold text-white focus:outline-none focus:border-[#CEFF00]/50"
              >
                {competitors.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Matchup Result Card */}
          {customMatchup && (
            <div className="p-5 rounded-2xl bg-[#090C12] border border-white/[0.1] space-y-4 shadow-xl">
              <div className="flex items-center justify-between gap-4">
                {/* Competitor A */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {getAvatar(customMatchup.nameA, customMatchup.photoA, 'w-12 h-12')}
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-white block truncate">
                      {customMatchup.nameA}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#CEFF00]">
                      {customMatchup.winsA} {customMatchup.winsA === 1 ? 'Win' : 'Wins'} ({customMatchup.pctA}%)
                    </span>
                  </div>
                </div>

                {/* VS Badge */}
                <div className="px-3 py-1 rounded-xl bg-white/[0.06] border border-white/[0.1] text-xs font-mono font-bold text-white/60 shrink-0">
                  VS
                </div>

                {/* Competitor B */}
                <div className="flex items-center justify-end gap-3 min-w-0 flex-1 text-right">
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-white block truncate">
                      {customMatchup.nameB}
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {customMatchup.winsB} {customMatchup.winsB === 1 ? 'Win' : 'Wins'} ({customMatchup.pctB}%)
                    </span>
                  </div>
                  {getAvatar(customMatchup.nameB, customMatchup.photoB, 'w-12 h-12')}
                </div>
              </div>

              {/* Head-to-Head Win Ratio Bar */}
              <div className="space-y-1">
                <div className="h-3 rounded-full bg-black/60 border border-white/[0.08] overflow-hidden flex p-0.5">
                  <div
                    style={{ width: `${customMatchup.pctA}%` }}
                    className="h-full rounded-full bg-[#CEFF00] shadow-[0_0_10px_rgba(206,255,0,0.3)] transition-all duration-500"
                  />
                  <div
                    style={{ width: `${customMatchup.pctB}%` }}
                    className="h-full rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(56,189,248,0.3)] transition-all duration-500"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-white/40">
                  <span>Sets Won: {customMatchup.setsA}</span>
                  <span>Total Clashes: {customMatchup.matchesPlayed}</span>
                  <span>Sets Won: {customMatchup.setsB}</span>
                </div>
              </div>

              {/* Past match records list */}
              {customMatchup.matches.length > 0 ? (
                <div className="pt-2 border-t border-white/[0.06] space-y-2">
                  <span className="text-[11px] font-mono text-white/50 uppercase block">
                    Direct Encounters History
                  </span>
                  <div className="space-y-1.5">
                    {customMatchup.matches.map((m, idx) => (
                      <div
                        key={idx}
                        onClick={() => onOpenMatch && onOpenMatch(m.id)}
                        className={`p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-xs ${
                          onOpenMatch ? 'cursor-pointer hover:bg-white/[0.06]' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-white/40 font-mono text-[10px]">{m.date}</span>
                          <span className="font-semibold text-white truncate">{m.title}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono font-bold text-white/80">{m.score}</span>
                          <span className="px-2 py-0.5 rounded bg-[#CEFF00]/10 text-[#CEFF00] font-mono text-[10px] font-semibold border border-[#CEFF00]/20">
                            {m.winner} won
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 text-xs text-white/40">
                  No recorded matches between these competitors yet. Start a quick match to record their first rivalry clash!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top Active Rivalries Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-white/70 font-mono">
              Top Club Rivalries
            </span>
            <span className="text-white/40 font-mono">By match volume</span>
          </div>

          {analytics.rivalries.length === 0 ? (
            <div className="text-center py-6 text-xs text-white/40">
              Play tournament or quick matches to build club rivalry histories.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics.rivalries.slice(0, 6).map(r => (
                <div
                  key={r.key}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.2] transition-all space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Team A */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {getAvatar(r.nameA, r.photoA, 'w-9 h-9')}
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">
                          {r.nameA}
                        </span>
                        <span className="text-[11px] font-mono font-semibold text-[#CEFF00]">
                          {r.winsA}W ({r.pctA}%)
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] font-mono text-white/30 px-2 py-0.5 rounded bg-white/[0.04]">
                      {r.matchesPlayed} {r.matchesPlayed === 1 ? 'match' : 'matches'}
                    </div>

                    {/* Team B */}
                    <div className="flex items-center justify-end gap-2.5 min-w-0 flex-1 text-right">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">
                          {r.nameB}
                        </span>
                        <span className="text-[11px] font-mono font-semibold text-cyan-400">
                          {r.winsB}W ({r.pctB}%)
                        </span>
                      </div>
                      {getAvatar(r.nameB, r.photoB, 'w-9 h-9')}
                    </div>
                  </div>

                  {/* Ratio visual bar */}
                  <div className="h-2 rounded-full bg-black/40 overflow-hidden flex">
                    <div
                      style={{ width: `${r.pctA}%` }}
                      className="h-full bg-[#CEFF00] transition-all"
                    />
                    <div
                      style={{ width: `${r.pctB}%` }}
                      className="h-full bg-cyan-400 transition-all"
                    />
                  </div>

                  {/* Footer note */}
                  <div className="flex items-center justify-between text-[11px] text-white/40 pt-1 border-t border-white/[0.04]">
                    <span>Sets: {r.setsA}–{r.setsB}</span>
                    <span className="truncate max-w-[170px] text-white/60">
                      Recent: {r.recentWinner} ({r.recentScore})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
