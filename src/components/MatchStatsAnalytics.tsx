import React, { useState, useMemo, useEffect } from 'react';
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
  Shield,
  ChevronDown,
  Filter,
  ArrowLeftRight,
  Sparkles,
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

  // Verify selectedMatchId exists in current matches
  const activeSelectedMatchId = useMemo(() => {
    if (selectedMatchId === 'ALL') return 'ALL';
    const exists = matches.some(m => m.id === selectedMatchId);
    return exists ? selectedMatchId : 'ALL';
  }, [matches, selectedMatchId]);

  // Compute analytics
  const analytics = useMemo(() => {
    return generateClubMatchAnalytics(matches, activeSelectedMatchId, playerPhotos);
  }, [matches, activeSelectedMatchId, playerPhotos]);

  // Head-to-head custom comparator state
  const competitors = useMemo(() => {
    if (analytics.allCompetitors && analytics.allCompetitors.length > 0) {
      return analytics.allCompetitors;
    }
    return ['Alex & Marcus', 'Vikram & Daniel', 'Elena Rostova', 'Sophia Zhang'];
  }, [analytics.allCompetitors]);

  const [compareA, setCompareA] = useState<string>(() => competitors[0] || 'Alex & Marcus');
  const [compareB, setCompareB] = useState<string>(() => competitors[1] || competitors[0] || 'Vikram & Daniel');

  // Keep compareA and compareB synchronized with competitors list to prevent broken dropdown values
  useEffect(() => {
    if (competitors.length === 0) return;

    if (!compareA || !competitors.includes(compareA)) {
      setCompareA(competitors[0]);
    }

    if (!compareB || !competitors.includes(compareB)) {
      const alt = competitors.find(c => c !== (compareA || competitors[0])) || competitors[0];
      setCompareB(alt);
    }
  }, [competitors, compareA, compareB]);

  // Handle swap competitors
  const handleSwapCompetitors = () => {
    const temp = compareA;
    setCompareA(compareB);
    setCompareB(temp);
  };

  // Helper to check if a team involves a competitor
  const teamInvolves = (team: Match['teamA'], comp: string): boolean => {
    if (!comp) return false;
    const cLower = comp.trim().toLowerCase();
    const tName = team.name.trim().toLowerCase();
    const rName = (team.rightPlayer || '').trim().toLowerCase();
    const lName = (team.leftPlayer || '').trim().toLowerCase();

    return (
      tName === cLower ||
      rName === cLower ||
      lName === cLower ||
      tName.includes(cLower)
    );
  };

  // Active custom matchup calculation (handles direct matches, doubles components & self-comparison)
  const customMatchup = useMemo<HeadToHeadMatchup>(() => {
    const defaultPhotoA = playerPhotos[compareA.trim().toLowerCase()];
    const defaultPhotoB = playerPhotos[compareB.trim().toLowerCase()];

    // Self comparison safeguard
    if (compareA === compareB) {
      return {
        key: `${compareA}::${compareB}`,
        nameA: compareA,
        nameB: compareB,
        photoA: defaultPhotoA,
        photoB: defaultPhotoB,
        matchesPlayed: 0,
        winsA: 0,
        winsB: 0,
        pctA: 50,
        pctB: 50,
        setsA: 0,
        setsB: 0,
        recentWinner: 'Same Competitor',
        recentScore: '—',
        matches: [],
      };
    }

    // 1. Check if direct rivalry already exists
    const directRivalry = analytics.rivalries.find(
      r =>
        (r.nameA.toLowerCase() === compareA.toLowerCase() &&
          r.nameB.toLowerCase() === compareB.toLowerCase()) ||
        (r.nameA.toLowerCase() === compareB.toLowerCase() &&
          r.nameB.toLowerCase() === compareA.toLowerCase())
    );

    if (directRivalry) {
      if (directRivalry.nameA.toLowerCase() === compareA.toLowerCase()) {
        return directRivalry;
      }
      return {
        ...directRivalry,
        nameA: directRivalry.nameB,
        nameB: directRivalry.nameA,
        photoA: directRivalry.photoB,
        photoB: directRivalry.photoA,
        winsA: directRivalry.winsB,
        winsB: directRivalry.winsA,
        pctA: directRivalry.pctB,
        pctB: directRivalry.pctA,
        setsA: directRivalry.setsB,
        setsB: directRivalry.setsA,
      };
    }

    // 2. Search matches where compareA was on one side and compareB was on the opposing side
    const crossMatches = matches.filter(m => {
      const aInTeamA = teamInvolves(m.teamA, compareA);
      const bInTeamB = teamInvolves(m.teamB, compareB);
      const bInTeamA = teamInvolves(m.teamA, compareB);
      const aInTeamB = teamInvolves(m.teamB, compareA);

      return (aInTeamA && bInTeamB) || (bInTeamA && aInTeamB);
    });

    let winsA = 0;
    let winsB = 0;
    let setsA = 0;
    let setsB = 0;
    const historyItems: HeadToHeadMatchup['matches'] = [];

    crossMatches.forEach(m => {
      const aIsTeamA = teamInvolves(m.teamA, compareA);
      const mSetsA = aIsTeamA ? m.setsA : m.setsB;
      const mSetsB = aIsTeamA ? m.setsB : m.setsA;
      setsA += mSetsA;
      setsB += mSetsB;

      let winner = '';
      if (m.winnerId) {
        const teamAWon = m.winnerId === m.teamA.id;
        if ((aIsTeamA && teamAWon) || (!aIsTeamA && !teamAWon)) {
          winsA++;
          winner = compareA;
        } else {
          winsB++;
          winner = compareB;
        }
      } else if (m.status === 'completed' || m.setsA >= 2 || m.setsB >= 2) {
        if (mSetsA > mSetsB) {
          winsA++;
          winner = compareA;
        } else {
          winsB++;
          winner = compareB;
        }
      }

      const scoreLabel =
        m.setHistory.length > 0
          ? m.setHistory.map(s => (aIsTeamA ? `${s.a}-${s.b}` : `${s.b}-${s.a}`)).join(', ')
          : aIsTeamA
          ? `${m.scoreA}-${m.scoreB}`
          : `${m.scoreB}-${m.scoreA}`;

      const dateStr = new Date(m.startTime || Date.now()).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });

      historyItems.push({
        id: m.id,
        title: m.title || 'Club Match',
        winner: winner || 'In Progress',
        score: scoreLabel,
        date: dateStr,
      });
    });

    const totalMatches = crossMatches.length;
    const totalDecisions = winsA + winsB;
    const pctA = totalDecisions > 0 ? Math.round((winsA / totalDecisions) * 100) : 50;
    const pctB = totalDecisions > 0 ? 100 - pctA : 50;
    const lastItem = historyItems[historyItems.length - 1];

    return {
      key: `${compareA}::${compareB}`,
      nameA: compareA,
      nameB: compareB,
      photoA: defaultPhotoA,
      photoB: defaultPhotoB,
      matchesPlayed: totalMatches,
      winsA,
      winsB,
      pctA,
      pctB,
      setsA,
      setsB,
      recentWinner: lastItem ? lastItem.winner : 'No encounters yet',
      recentScore: lastItem ? lastItem.score : '—',
      matches: historyItems.reverse(),
    };
  }, [compareA, compareB, analytics.rivalries, playerPhotos, matches]);

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
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#CEFF00]/10 border border-[#CEFF00]/30 flex items-center justify-center text-[#CEFF00] shadow-[0_0_15px_rgba(206,255,0,0.15)] shrink-0">
            <Activity size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-display font-bold text-white tracking-tight truncate">
                Match Performance & Head-to-Head Radar
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#CEFF00]/10 text-[#CEFF00] border border-[#CEFF00]/20 text-[10px] font-mono uppercase tracking-wider font-bold shrink-0">
                BWF Analytics
              </span>
            </div>
            <p className="text-xs text-white/50 mt-0.5 truncate">
              Rally duration analysis, server vs receiver point conversion & repeat player win ratios
            </p>
          </div>
        </div>

        {/* Robust Match Scope Filter Dropdown */}
        <div className="w-full md:w-auto relative flex items-center shrink-0">
          <Filter size={14} className="text-white/40 absolute left-3 pointer-events-none z-10" />
          <select
            value={activeSelectedMatchId}
            onChange={e => setSelectedMatchId(e.target.value)}
            className="w-full md:w-80 appearance-none pl-8 pr-9 py-2.5 rounded-xl bg-[#141824] border border-white/[0.12] hover:border-white/[0.25] text-xs font-semibold text-white focus:outline-none focus:border-[#CEFF00] transition-colors cursor-pointer truncate shadow-sm"
            title="Filter analytics by match scope"
          >
            <option value="ALL" className="bg-[#141824] text-white py-1.5 font-semibold">
              All Club Matches (Aggregate)
            </option>
            {matches.map(m => (
              <option key={m.id} value={m.id} className="bg-[#141824] text-white py-1.5">
                {m.title} ({m.teamA.name} vs {m.teamB.name})
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="text-white/40 absolute right-3 pointer-events-none z-10" />
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

            <div className="flex flex-wrap items-center justify-between text-xs font-mono gap-2">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
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
                <span className="truncate">{analytics.longestRally.matchTitle}</span>
                <span>·</span>
                <span className="font-mono text-white/70 shrink-0">Point: {analytics.longestRally.pointScore}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Head-to-Head Win Ratios & Rivalry Radar */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#0D1017] border border-white/[0.08] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#CEFF00]/10 flex items-center justify-center text-[#CEFF00] shrink-0">
              <Swords size={18} />
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-white tracking-tight">
                Head-to-Head Win Ratios & Rivalry Radar
              </h3>
              <p className="text-xs text-white/50 mt-0.5">
                Lifetime win rates, direct encounters & set splits between repeat opponents
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-[#CEFF00] bg-[#CEFF00]/10 px-3 py-1 rounded-full border border-[#CEFF00]/20 self-start sm:self-auto shrink-0">
            {analytics.rivalries.length} Rivalries Tracked
          </span>
        </div>

        {/* Interactive Custom Head-to-Head Matchup Selector */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/[0.06]">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80 font-mono flex items-center gap-1.5">
              <Sparkles size={13} className="text-[#CEFF00]" />
              <span>Head-to-Head Radar Comparator</span>
            </span>
            <span className="text-[11px] text-white/40 font-mono">
              Pick any two players or teams to compare head-to-head metrics
            </span>
          </div>

          {/* Competitor Dropdowns Matrix with Quick Swap */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Competitor 1 Select */}
            <div className="w-full flex-1 min-w-0">
              <label className="flex items-center justify-between text-[11px] font-semibold text-white/70 mb-1.5">
                <span>Competitor 1 (Side A)</span>
                <span className="w-2 h-2 rounded-full bg-[#CEFF00]" />
              </label>
              <div className="relative flex items-center">
                <select
                  value={compareA}
                  onChange={e => setCompareA(e.target.value)}
                  className="w-full appearance-none pl-3.5 pr-9 py-2.5 rounded-xl bg-[#141824] border border-[#CEFF00]/30 hover:border-[#CEFF00]/60 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-[#CEFF00] transition-all cursor-pointer truncate shadow-sm"
                >
                  {competitors.map(c => (
                    <option key={c} value={c} className="bg-[#141824] text-white py-1.5">
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="text-white/40 absolute right-3 pointer-events-none" />
              </div>
            </div>

            {/* Quick Swap Button */}
            <div className="self-center sm:pt-5">
              <button
                type="button"
                onClick={handleSwapCompetitors}
                className="w-9 h-9 rounded-xl bg-[#141824] border border-white/[0.12] hover:border-[#CEFF00]/50 text-white/60 hover:text-[#CEFF00] flex items-center justify-center transition-all shadow-sm active:scale-95"
                title="Swap competitors"
              >
                <ArrowLeftRight size={14} />
              </button>
            </div>

            {/* Competitor 2 Select */}
            <div className="w-full flex-1 min-w-0">
              <label className="flex items-center justify-between text-[11px] font-semibold text-white/70 mb-1.5">
                <span>Competitor 2 (Side B)</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
              </label>
              <div className="relative flex items-center">
                <select
                  value={compareB}
                  onChange={e => setCompareB(e.target.value)}
                  className="w-full appearance-none pl-3.5 pr-9 py-2.5 rounded-xl bg-[#141824] border border-cyan-400/30 hover:border-cyan-400/60 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all cursor-pointer truncate shadow-sm"
                >
                  {competitors.map(c => (
                    <option key={c} value={c} className="bg-[#141824] text-white py-1.5">
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="text-white/40 absolute right-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Same Competitor Notice if user chooses the identical name in both dropdowns */}
          {compareA === compareB && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>
                  You have selected <strong>{compareA}</strong> for both sides. Choose a different competitor for Side B to analyze head-to-head clash data.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const alt = competitors.find(c => c !== compareA) || competitors[0];
                  setCompareB(alt);
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-400 text-black font-semibold text-[11px] shrink-0 self-start sm:self-auto hover:bg-amber-300 transition-colors shadow-sm"
              >
                Auto-Select Opponent
              </button>
            </div>
          )}

          {/* Interactive Matchup Result Card */}
          {customMatchup && compareA !== compareB && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#090C12] border border-white/[0.1] space-y-4 shadow-xl animate-fadeIn">
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                {/* Competitor A */}
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  {getAvatar(customMatchup.nameA, customMatchup.photoA, 'w-10 h-10 sm:w-12 sm:h-12')}
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-white block truncate">
                      {customMatchup.nameA}
                    </span>
                    <span className="text-[11px] sm:text-xs font-mono font-bold text-[#CEFF00]">
                      {customMatchup.winsA} {customMatchup.winsA === 1 ? 'Win' : 'Wins'} ({customMatchup.pctA}%)
                    </span>
                  </div>
                </div>

                {/* VS Badge */}
                <div className="px-2.5 sm:px-3 py-1 rounded-xl bg-white/[0.06] border border-white/[0.1] text-[10px] sm:text-xs font-mono font-bold text-white/60 shrink-0">
                  VS
                </div>

                {/* Competitor B */}
                <div className="flex items-center justify-end gap-2.5 sm:gap-3 min-w-0 flex-1 text-right">
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-white block truncate">
                      {customMatchup.nameB}
                    </span>
                    <span className="text-[11px] sm:text-xs font-mono font-bold text-cyan-400">
                      {customMatchup.winsB} {customMatchup.winsB === 1 ? 'Win' : 'Wins'} ({customMatchup.pctB}%)
                    </span>
                  </div>
                  {getAvatar(customMatchup.nameB, customMatchup.photoB, 'w-10 h-10 sm:w-12 sm:h-12')}
                </div>
              </div>

              {/* Head-to-Head Win Ratio Bar */}
              <div className="space-y-1.5">
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
                <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-white/50">
                  <span className="text-[#CEFF00]">Sets Won: {customMatchup.setsA}</span>
                  <span className="text-white/70 font-semibold">Total Encounters: {customMatchup.matchesPlayed}</span>
                  <span className="text-cyan-400">Sets Won: {customMatchup.setsB}</span>
                </div>
              </div>

              {/* 4-Metric Rivalry Radar Comparison Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/[0.06]">
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
                  <span className="text-[10px] text-white/40 uppercase font-mono block">Win Share A</span>
                  <span className="text-sm font-bold font-mono text-[#CEFF00]">{customMatchup.pctA}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
                  <span className="text-[10px] text-white/40 uppercase font-mono block">Win Share B</span>
                  <span className="text-sm font-bold font-mono text-cyan-400">{customMatchup.pctB}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
                  <span className="text-[10px] text-white/40 uppercase font-mono block">Sets Split</span>
                  <span className="text-sm font-bold font-mono text-white">{customMatchup.setsA}–{customMatchup.setsB}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
                  <span className="text-[10px] text-white/40 uppercase font-mono block">Dominant Side</span>
                  <span className={`text-xs font-bold font-mono truncate block ${
                    customMatchup.winsA > customMatchup.winsB
                      ? 'text-[#CEFF00]'
                      : customMatchup.winsB > customMatchup.winsA
                      ? 'text-cyan-400'
                      : 'text-white/60'
                  }`}>
                    {customMatchup.winsA > customMatchup.winsB
                      ? customMatchup.nameA
                      : customMatchup.winsB > customMatchup.winsA
                      ? customMatchup.nameB
                      : 'Evenly Tied'}
                  </span>
                </div>
              </div>

              {/* Past match records list */}
              {customMatchup.matches.length > 0 ? (
                <div className="pt-2 border-t border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-white/50 uppercase">
                    <span>Direct Encounters History ({customMatchup.matches.length})</span>
                    <span className="text-white/30">Latest First</span>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {customMatchup.matches.map((m, idx) => (
                      <div
                        key={idx}
                        onClick={() => onOpenMatch && onOpenMatch(m.id)}
                        className={`p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-xs gap-2 ${
                          onOpenMatch ? 'cursor-pointer hover:bg-white/[0.06] transition-colors' : ''
                        }`}
                        title={onOpenMatch ? 'Click to open match scoreboard' : undefined}
                      >
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <span className="text-white/40 font-mono text-[10px] shrink-0">{m.date}</span>
                          <span className="font-semibold text-white truncate">{m.title}</span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                          <span className="font-mono font-bold text-white/80 text-[11px] sm:text-xs">{m.score}</span>
                          <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold border ${
                            m.winner === customMatchup.nameA
                              ? 'bg-[#CEFF00]/10 text-[#CEFF00] border-[#CEFF00]/20'
                              : m.winner === customMatchup.nameB
                              ? 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20'
                              : 'bg-white/[0.06] text-white/70 border-white/[0.1]'
                          }`}>
                            {m.winner} won
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 text-xs text-white/40 border-t border-white/[0.04]">
                  No recorded matches between <strong>{customMatchup.nameA}</strong> and <strong>{customMatchup.nameB}</strong> yet. Start a quick match to record their first rivalry clash!
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

                    <div className="text-[10px] font-mono text-white/30 px-2 py-0.5 rounded bg-white/[0.04] shrink-0">
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
