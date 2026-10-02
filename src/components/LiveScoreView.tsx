import React, { useState, useEffect } from 'react';
import { Match, Team } from '../types';
import { CourtDiagram } from './CourtDiagram';
import { PlayerPhotoModal } from './PlayerPhotoModal';
import {
  formatDuration,
  getCurrentServer,
  getCurrentReceiver,
} from '../utils/badminton';
import { triggerFeedback } from '../utils/feedback';
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  Clock,
  Crown,
  ChevronRight,
  ListRestart,
  History,
  Camera,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface LiveScoreViewProps {
  match: Match;
  playerPhotos: Record<string, string>;
  onBack: () => void;
  onPoint: (teamKey: 'A' | 'B') => void;
  onUndo: () => void;
  onNextSet: () => void;
  onReset: () => void;
  onSwapPositions: (teamKey: 'A' | 'B') => void;
  onChangeBestOf: (bestOf: number) => void;
  onUpdatePlayerPhoto: (playerName: string, photoUrl: string | null) => void;
}

export const LiveScoreView: React.FC<LiveScoreViewProps> = ({
  match,
  playerPhotos,
  onBack,
  onPoint,
  onUndo,
  onNextSet,
  onReset,
  onSwapPositions,
  onChangeBestOf,
  onUpdatePlayerPhoto,
}) => {
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showPlayersModal, setShowPlayersModal] = useState(false);
  const [editingPlayerForPhoto, setEditingPlayerForPhoto] = useState<string | null>(null);

  // Stopwatch timer
  useEffect(() => {
    if (match.status !== 'in-progress') return;
    const interval = setInterval(() => {
      setElapsedTime(formatDuration(match.startTime));
    }, 1000);
    setElapsedTime(formatDuration(match.startTime));
    return () => clearInterval(interval);
  }, [match.startTime, match.status]);

  // Keyboard shortcut listener for fast referee / table scoring
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        e.preventDefault();
        handleScorePoint('A');
      } else if (e.key === 'l' || e.key === 'L' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleScorePoint('B');
      } else if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndoPoint();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [match.status, match.setFinished, soundEnabled, match.scoreA, match.scoreB]);

  const handleScorePoint = (team: 'A' | 'B') => {
    if (match.status === 'completed' || match.setFinished) return;

    // Detect if this point will clinch a set or the match
    const currentScore = team === 'A' ? match.scoreA : match.scoreB;
    const opponentScore = team === 'A' ? match.scoreB : match.scoreA;
    const newScore = currentScore + 1;

    const willWinSet =
      (newScore >= match.pointsToWin && newScore - opponentScore >= 2) ||
      newScore === match.capPoints;

    const neededSets = Math.ceil(match.bestOf / 2);
    const setsWon = team === 'A' ? match.setsA : match.setsB;
    const willWinMatch = willWinSet && setsWon + 1 >= neededSets;

    const willBeDeuce =
      !willWinSet &&
      newScore >= match.pointsToWin - 1 &&
      opponentScore >= match.pointsToWin - 1;

    if (willWinMatch) {
      triggerFeedback('match-win', soundEnabled);
    } else if (willWinSet) {
      triggerFeedback('game', soundEnabled);
    } else if (willBeDeuce && !match.isDeuce) {
      triggerFeedback('deuce', soundEnabled);
    } else {
      triggerFeedback('point', soundEnabled);
    }

    onPoint(team);
  };

  const handleUndoPoint = () => {
    if (!match.history || match.history.length === 0) return;
    triggerFeedback('undo', soundEnabled);
    onUndo();
  };

  const canSwapPreSet =
    match.scoreA === 0 &&
    match.scoreB === 0 &&
    match.status !== 'completed' &&
    !match.setFinished;

  const currentServingTeam = match.servingTeam === 'A' ? match.teamA : match.teamB;
  const currentServingScore = match.servingTeam === 'A' ? match.scoreA : match.scoreB;
  const activeServer = getCurrentServer(currentServingTeam, currentServingScore);
  const activeReceiver = getCurrentReceiver(
    activeServer.court,
    match.servingTeam === 'A' ? match.teamB : match.teamA
  );

  const championTeam =
    match.winnerId === match.teamA.id
      ? match.teamA
      : match.winnerId === match.teamB.id
      ? match.teamB
      : null;

  // Collect all distinct players in this match for photo editing
  const matchPlayers: { name: string; team: 'A' | 'B'; role: string }[] = [];
  if (match.teamA.leftPlayer) {
    matchPlayers.push({ name: match.teamA.rightPlayer, team: 'A', role: 'Right Court' });
    matchPlayers.push({ name: match.teamA.leftPlayer, team: 'A', role: 'Left Court' });
  } else {
    matchPlayers.push({ name: match.teamA.rightPlayer || match.teamA.name, team: 'A', role: 'Player' });
  }

  if (match.teamB.leftPlayer) {
    matchPlayers.push({ name: match.teamB.rightPlayer, team: 'B', role: 'Right Court' });
    matchPlayers.push({ name: match.teamB.leftPlayer, team: 'B', role: 'Left Court' });
  } else {
    matchPlayers.push({ name: match.teamB.rightPlayer || match.teamB.name, team: 'B', role: 'Player' });
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn pb-20 sm:pb-16 max-w-5xl mx-auto">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-[#0D1017] border border-white/[0.08] hover:border-white/[0.2] text-white/70 hover:text-white flex items-center justify-center transition-colors shrink-0"
            title="Go back"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-mono text-white/40 truncate">
              <span className="truncate">{match.title}</span>
              <span>·</span>
              <span className="text-white/60 shrink-0">Race to {match.pointsToWin}</span>
            </div>
            <h1 className="text-sm xs:text-base sm:text-xl font-display font-bold text-white tracking-tight truncate">
              {match.teamA.name} <span className="text-white/40 font-normal text-xs sm:text-sm">vs</span>{' '}
              {match.teamB.name}
            </h1>
          </div>
        </div>

        {/* Stopwatch & Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowPlayersModal(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#0D1017] border border-white/[0.08] hover:border-[#CEFF00]/40 text-xs font-semibold text-white/90 hover:text-[#CEFF00] flex items-center gap-1.5 transition-colors"
            title="Add or edit photos of players"
          >
            <Camera size={13} className="text-[#CEFF00] shrink-0" />
            <span className="hidden xs:inline">Photos</span>
          </button>

          <div className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#0D1017] border border-white/[0.08] font-mono-numbers text-[11px] sm:text-xs text-white/80 flex items-center gap-1.5">
            <Clock size={12} className="text-[#CEFF00] shrink-0" />
            <span>{elapsedTime}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) {
                triggerFeedback('point', true);
              }
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all text-xs font-medium ${
              soundEnabled
                ? 'bg-[#CEFF00]/10 border-[#CEFF00]/30 text-[#CEFF00] shadow-[0_0_12px_rgba(206,255,0,0.1)]'
                : 'bg-white/[0.02] border-white/[0.05] text-white/40 hover:text-white'
            }`}
            title={soundEnabled ? 'Haptics & Audio: ON' : 'Haptics & Audio: Muted'}
          >
            {soundEnabled ? <Volume2 size={13} className="shrink-0" /> : <VolumeX size={13} className="shrink-0" />}
            <span className="hidden sm:inline font-mono text-[11px]">
              {soundEnabled ? 'Audio' : 'Muted'}
            </span>
          </button>
        </div>
      </div>

      {/* Set Tracking Bar & Configurable Number of Sets */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-[#0D1017] border border-white/[0.08]">
        {/* Set Pills with responsive touch scroll */}
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 no-scrollbar [&::-webkit-scrollbar]:hidden">
          {Array.from({ length: match.bestOf }).map((_, idx) => {
            const pastSet = match.setHistory[idx];
            const isCurrent = idx === match.currentSet - 1 && match.status === 'in-progress';
            const isDecider = idx === match.bestOf - 1 && match.bestOf > 1;

            return (
              <div
                key={idx}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-mono-numbers font-semibold flex items-center gap-1.5 sm:gap-2 border transition-all whitespace-nowrap shrink-0 ${
                  pastSet
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : isCurrent
                    ? 'bg-[#CEFF00]/15 text-[#CEFF00] border-[#CEFF00]/40 shadow-[0_0_12px_rgba(206,255,0,0.1)]'
                    : 'bg-white/[0.02] text-white/30 border-white/[0.05]'
                }`}
              >
                <span>
                  Set {idx + 1}
                  {isDecider ? ' (Decider)' : ''}
                </span>
                {pastSet && (
                  <span className="font-bold">
                    {pastSet.a}–{pastSet.b}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Configurable Number of Sets */}
        <div className="flex items-center justify-between sm:justify-end gap-2 text-xs shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
          <span className="text-white/40 font-mono text-[10px] sm:text-[11px] flex items-center gap-1">
            <Sliders size={12} className="text-[#CEFF00]" />
            <span>Format:</span>
          </span>

          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-black/40 border border-white/[0.08]">
            {[1, 3, 5].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => onChangeBestOf(num)}
                className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-mono transition-all ${
                  match.bestOf === num
                    ? 'bg-[#CEFF00] text-black font-bold shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                }`}
                title={`Play Best of ${num} set${num > 1 ? 's' : ''}`}
              >
                Best of {num}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Commentary Banner */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-[#0D1017] border border-white/[0.1] flex flex-col xs:flex-row xs:items-center justify-between gap-2 sm:gap-3 shadow-md">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="w-2 h-2 rounded-full bg-[#CEFF00] animate-pulse shrink-0" />
          <p className="text-xs text-white/90 truncate font-medium">{match.commentary}</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/40 shrink-0 self-end xs:self-auto">
          <button
            type="button"
            onClick={() => triggerFeedback('point', true)}
            className="px-2 py-0.5 rounded bg-white/[0.04] hover:bg-[#CEFF00]/10 hover:text-[#CEFF00] text-white/60 transition-colors flex items-center gap-1 active:scale-95 text-[10px]"
            title="Preview racquet hit audio and haptic feedback"
          >
            <span>Shuttle Click</span>
          </button>
          <button
            type="button"
            onClick={() => triggerFeedback('game', true)}
            className="px-2 py-0.5 rounded bg-white/[0.04] hover:bg-[#CEFF00]/10 hover:text-[#CEFF00] text-white/60 transition-colors flex items-center gap-1 active:scale-95 text-[10px]"
            title="Preview stadium victory cheer"
          >
            <Sparkles size={10} className="text-[#CEFF00]" />
            <span>Cheer</span>
          </button>
        </div>
      </div>

      {/* Deuce Indicator */}
      {match.isDeuce && match.status === 'in-progress' && !match.setFinished && (
        <div className="p-2.5 sm:p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-center text-xs font-semibold animate-pulse flex items-center justify-center gap-2">
          <span>🔔</span>
          <span>DEUCE · 2-point lead required to win (Capped at {match.capPoints})</span>
        </div>
      )}

      {/* Set Won Callout */}
      {match.setFinished && match.status !== 'completed' && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-[#0D1017] to-[#0A0C11] border border-emerald-500/40 text-center space-y-2.5 sm:space-y-3 shadow-xl">
          <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center justify-center gap-1.5">
            <Sparkles size={14} className="text-emerald-400 animate-spin" />
            <span>Set {match.currentSet} Concluded</span>
          </div>
          <h2 className="text-lg sm:text-xl font-display font-bold text-white">
            {match.setsA > match.setsB ? match.teamA.name : match.teamB.name} wins Set {match.currentSet}!
          </h2>
          <p className="text-xs text-white/60">
            Set Score: {match.scoreA} – {match.scoreB}
          </p>

          <button
            type="button"
            onClick={() => {
              triggerFeedback('point', soundEnabled);
              onNextSet();
            }}
            className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-[#CEFF00] text-black font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#b8e000] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(206,255,0,0.2)] mx-auto"
          >
            <span>Proceed to Set {match.currentSet + 1}</span>
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* Match Completed Banner */}
      {match.status === 'completed' && championTeam && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/15 via-[#0D1017] to-[#0A0C11] border border-amber-500/40 text-center space-y-2.5 sm:space-y-3 shadow-2xl">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto">
            <Crown size={26} />
          </div>
          <div className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
            Official Match Winner
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-white">{championTeam.name}</h2>
          <div className="text-xs sm:text-sm text-white/70 font-mono-numbers">
            Sets: {match.setsA} – {match.setsB} (Best of {match.bestOf})
          </div>
        </div>
      )}

      {/* Big Score Touch Targets Matrix */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
        {/* Team A Score Target */}
        <ScoreTargetCard
          team={match.teamA}
          score={match.scoreA}
          setsWon={match.setsA}
          isServing={match.servingTeam === 'A'}
          isWinner={match.winnerId === match.teamA.id}
          isReceiver={match.servingTeam === 'B'}
          activeReceiverName={activeReceiver}
          disabled={match.status === 'completed' || match.setFinished}
          onScore={() => handleScorePoint('A')}
          playerPhotos={playerPhotos}
          onEditPlayerPhoto={name => setEditingPlayerForPhoto(name)}
        />

        {/* Team B Score Target */}
        <ScoreTargetCard
          team={match.teamB}
          score={match.scoreB}
          setsWon={match.setsB}
          isServing={match.servingTeam === 'B'}
          isWinner={match.winnerId === match.teamB.id}
          isReceiver={match.servingTeam === 'A'}
          activeReceiverName={activeReceiver}
          disabled={match.status === 'completed' || match.setFinished}
          onScore={() => handleScorePoint('B')}
          playerPhotos={playerPhotos}
          onEditPlayerPhoto={name => setEditingPlayerForPhoto(name)}
        />
      </div>

      {/* Interactive Badminton Court Diagram */}
      <CourtDiagram
        teamA={match.teamA}
        teamB={match.teamB}
        scoreA={match.scoreA}
        scoreB={match.scoreB}
        servingTeam={match.servingTeam}
        onSwapPositions={onSwapPositions}
        canSwap={canSwapPreSet}
        playerPhotos={playerPhotos}
        onEditPlayerPhoto={name => setEditingPlayerForPhoto(name)}
      />

      {/* Bottom Action Strip: Undo / Reset / Manage Photos / Timeline */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-between gap-2 sm:gap-3 pt-3 border-t border-white/[0.08]">
        <button
          type="button"
          onClick={handleUndoPoint}
          disabled={!match.history || match.history.length === 0}
          className="w-full sm:w-auto px-3.5 py-2.5 sm:py-2 rounded-xl bg-[#0D1017] border border-white/[0.08] hover:border-white/[0.18] disabled:opacity-30 text-white/80 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
          title="Revert previous point (Ctrl+Z)"
        >
          <RotateCcw size={14} />
          <span>Undo Point</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset this match to Set 1 (0–0)?')) {
              onReset();
            }
          }}
          className="w-full sm:w-auto px-3.5 py-2.5 sm:py-2 rounded-xl bg-[#0D1017] border border-white/[0.08] hover:border-rose-500/30 text-white/60 hover:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
          title="Reset match back to initial state"
        >
          <ListRestart size={14} />
          <span>Reset</span>
        </button>

        <button
          type="button"
          onClick={() => setShowPlayersModal(true)}
          className="w-full sm:w-auto px-3.5 py-2.5 sm:py-2 rounded-xl bg-[#0D1017] border border-white/[0.08] hover:border-[#CEFF00]/40 text-xs font-semibold text-white/80 hover:text-white flex items-center justify-center gap-1.5 transition-all"
        >
          <Camera size={14} className="text-[#CEFF00]" />
          <span>Manage Photos</span>
        </button>

        <button
          type="button"
          onClick={() => setShowTimeline(v => !v)}
          className={`w-full sm:w-auto px-3.5 py-2.5 sm:py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            showTimeline
              ? 'bg-[#CEFF00]/15 text-[#CEFF00] border-[#CEFF00]/40'
              : 'bg-[#0D1017] text-white/70 border-white/[0.08] hover:border-white/[0.18]'
          }`}
        >
          <History size={14} />
          <span>Timeline ({match.timeline.length})</span>
        </button>
      </div>

      {/* Match Point-by-Point Timeline Drawer */}
      {showTimeline && (
        <div className="p-4 sm:p-5 rounded-3xl bg-[#0D1017] border border-white/[0.08] space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-white">
              Point-By-Point Match Log
            </h3>
            <span className="text-[10px] font-mono text-white/40">Chronological</span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {match.timeline.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-xs gap-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[10px] text-white/40 w-4">
                    {match.timeline.length - idx}
                  </span>
                  <span className="text-white/80 truncate">{item.text}</span>
                </div>
                <div className="font-mono-numbers font-semibold text-[#CEFF00] shrink-0 text-xs">
                  {item.scoreA}–{item.scoreB}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Players & Photos Overview Modal */}
      {showPlayersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl bg-[#0D1017] border border-white/[0.14] p-4 sm:p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-[#CEFF00]" />
                <h3 className="text-base font-display font-bold text-white">
                  Match Players & Photos
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPlayersModal(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/60 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-white/50 shrink-0">
              Upload photos or select avatars for players on the court. Photos will appear across the scoreboard and court positioner.
            </p>

            <div className="divide-y divide-white/[0.06] space-y-2 overflow-y-auto flex-1 pr-1">
              {matchPlayers.map((player, idx) => {
                const photo = playerPhotos[player.name.trim().toLowerCase()] || null;
                return (
                  <div
                    key={idx}
                    className="pt-2 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-[#141824] border-2 border-white/[0.12] overflow-hidden flex items-center justify-center text-base sm:text-lg font-bold text-[#CEFF00] shrink-0 shadow-md">
                        {photo ? (
                          <img src={photo} alt={player.name} className="w-full h-full object-cover" />
                        ) : (
                          player.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-white truncate">
                          {player.name}
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-white/50 font-mono mt-0.5 truncate">
                          Team {player.team} · {player.role}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowPlayersModal(false);
                        setEditingPlayerForPhoto(player.name);
                      }}
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/[0.08] shrink-0"
                    >
                      <Camera size={13} className="text-[#CEFF00]" />
                      <span>{photo ? 'Change' : 'Add Photo'}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-white/[0.06] shrink-0">
              <button
                type="button"
                onClick={() => setShowPlayersModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#CEFF00] hover:bg-[#b8e000] text-black text-xs font-bold transition-all shadow-[0_0_15px_rgba(206,255,0,0.2)]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Player Photo Upload Modal */}
      {editingPlayerForPhoto && (
        <PlayerPhotoModal
          isOpen={Boolean(editingPlayerForPhoto)}
          playerName={editingPlayerForPhoto}
          currentPhoto={playerPhotos[editingPlayerForPhoto.trim().toLowerCase()] || null}
          onClose={() => setEditingPlayerForPhoto(null)}
          onSavePhoto={(name, photo) => onUpdatePlayerPhoto(name, photo)}
        />
      )}
    </div>
  );
};

interface ScoreTargetCardProps {
  team: Team;
  score: number;
  setsWon: number;
  isServing: boolean;
  isWinner: boolean;
  isReceiver: boolean;
  activeReceiverName: string;
  disabled: boolean;
  onScore: () => void;
  playerPhotos: Record<string, string>;
  onEditPlayerPhoto: (playerName: string) => void;
}

const ScoreTargetCard: React.FC<ScoreTargetCardProps> = ({
  team,
  score,
  setsWon,
  isServing,
  isWinner,
  isReceiver,
  activeReceiverName,
  disabled,
  onScore,
  playerPhotos,
  onEditPlayerPhoto,
}) => {
  const getPhoto = (name?: string | null) => {
    if (!name) return null;
    return playerPhotos[name.trim().toLowerCase()] || null;
  };

  return (
    <div
      onClick={disabled ? undefined : onScore}
      className={`rounded-3xl border p-3 xs:p-4 sm:p-7 flex flex-col justify-between text-center select-none transition-all relative overflow-hidden group ${
        disabled
          ? 'cursor-not-allowed opacity-80'
          : 'cursor-pointer active:scale-[0.98]'
      } ${
        isWinner
          ? 'bg-amber-500/10 border-amber-500/40 shadow-xl'
          : isServing
          ? 'bg-[#0E1522] border-[#CEFF00]/50 shadow-[0_0_30px_rgba(206,255,0,0.08)]'
          : 'bg-[#0D1017] border-white/[0.08] hover:border-white/[0.18]'
      }`}
    >
      {/* Background glow on server */}
      {isServing && (
        <div className="absolute inset-0 bg-[#CEFF00]/[0.03] pointer-events-none" />
      )}

      {/* Header Info */}
      <div className="space-y-0.5 sm:space-y-1 relative z-10">
        <div className="flex items-center justify-center gap-1.5">
          {isServing && (
            <span className="px-1.5 xs:px-2 py-0.5 rounded-full bg-[#CEFF00]/15 text-[#CEFF00] font-mono text-[9px] xs:text-[10px] font-bold border border-[#CEFF00]/30 flex items-center gap-1">
              <span>🏸</span>
              <span>Serving</span>
            </span>
          )}
          {isWinner && (
            <span className="px-1.5 xs:px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[9px] xs:text-[10px] font-bold border border-amber-500/40">
              👑 Winner
            </span>
          )}
        </div>

        <h3
          className={`font-semibold text-xs xs:text-sm sm:text-base truncate transition-colors ${
            isServing ? 'text-[#CEFF00]' : 'text-white'
          }`}
        >
          {team.name}
        </h3>

        <div className="text-[10px] sm:text-[11px] font-mono text-white/50">Sets: {setsWon}</div>
      </div>

      {/* Massive Score Number Display */}
      <div className="my-2 xs:my-3 sm:my-6 relative z-10">
        <div
          className={`font-display text-4xl xs:text-5xl sm:text-7xl font-bold font-mono-numbers tracking-tight transition-transform group-hover:scale-105 duration-150 ${
            isServing ? 'text-[#CEFF00]' : 'text-white'
          }`}
        >
          {score}
        </div>
        {!disabled && (
          <div className="text-[9px] sm:text-[10px] text-white/40 mt-0.5 sm:mt-1 uppercase font-mono tracking-widest group-hover:text-white/70 transition-colors">
            Tap to Score +1
          </div>
        )}
      </div>

      {/* Doubles Court Position Preview & Quick Photo Triggers */}
      {team.leftPlayer ? (
        <div className="pt-2 sm:pt-3 border-t border-white/[0.06] flex flex-col gap-1.5 sm:grid sm:grid-cols-2 sm:gap-2 text-left relative z-10">
          {/* Right Court Player */}
          <div
            onClick={e => {
              e.stopPropagation();
              onEditPlayerPhoto(team.rightPlayer);
            }}
            className={`p-1.5 xs:p-2 sm:p-2.5 rounded-xl xs:rounded-2xl text-[10px] sm:text-[11px] border transition-all cursor-pointer group/pill hover:scale-[1.02] ${
              isServing && score % 2 === 0
                ? 'bg-[#CEFF00]/10 border-[#CEFF00]/30 text-[#CEFF00] shadow-[0_0_12px_rgba(206,255,0,0.08)]'
                : isReceiver && activeReceiverName === team.rightPlayer
                ? 'bg-cyan-500/10 border-cyan-400/30 text-cyan-300'
                : 'bg-white/[0.02] border-white/[0.04] text-white/60 hover:bg-white/[0.05]'
            }`}
            title={`Tap to edit photo for ${team.rightPlayer}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/40 uppercase text-[8px] xs:text-[9px] font-mono">Right (Even)</span>
              <Camera size={11} className="opacity-40 group-hover/pill:opacity-100 text-[#CEFF00] transition-opacity shrink-0" />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 border border-white/20 overflow-hidden shrink-0 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white shadow-sm">
                {getPhoto(team.rightPlayer) ? (
                  <img src={getPhoto(team.rightPlayer)!} alt="" className="w-full h-full object-cover" />
                ) : (
                  team.rightPlayer.charAt(0)
                )}
              </div>
              <span className="font-semibold text-[10px] xs:text-[11px] sm:text-xs truncate text-white min-w-0">
                {team.rightPlayer}
              </span>
            </div>
          </div>

          {/* Left Court Player */}
          <div
            onClick={e => {
              e.stopPropagation();
              onEditPlayerPhoto(team.leftPlayer!);
            }}
            className={`p-1.5 xs:p-2 sm:p-2.5 rounded-xl xs:rounded-2xl text-[10px] sm:text-[11px] border transition-all cursor-pointer group/pill hover:scale-[1.02] ${
              isServing && score % 2 !== 0
                ? 'bg-[#CEFF00]/10 border-[#CEFF00]/30 text-[#CEFF00] shadow-[0_0_12px_rgba(206,255,0,0.08)]'
                : isReceiver && activeReceiverName === team.leftPlayer
                ? 'bg-cyan-500/10 border-cyan-400/30 text-cyan-300'
                : 'bg-white/[0.02] border-white/[0.04] text-white/60 hover:bg-white/[0.05]'
            }`}
            title={`Tap to edit photo for ${team.leftPlayer}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/40 uppercase text-[8px] xs:text-[9px] font-mono">Left (Odd)</span>
              <Camera size={11} className="opacity-40 group-hover/pill:opacity-100 text-[#CEFF00] transition-opacity shrink-0" />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 border border-white/20 overflow-hidden shrink-0 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white shadow-sm">
                {getPhoto(team.leftPlayer) ? (
                  <img src={getPhoto(team.leftPlayer)!} alt="" className="w-full h-full object-cover" />
                ) : (
                  team.leftPlayer.charAt(0)
                )}
              </div>
              <span className="font-semibold text-[10px] xs:text-[11px] sm:text-xs truncate text-white min-w-0">
                {team.leftPlayer}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Singles Player Avatar Preview with Edit Photo trigger */
        <div
          onClick={e => {
            e.stopPropagation();
            onEditPlayerPhoto(team.rightPlayer || team.name);
          }}
          className="pt-2 sm:pt-3 border-t border-white/[0.06] flex items-center justify-center gap-2 sm:gap-3 text-xs text-white/80 hover:text-white cursor-pointer group/singles relative z-10"
          title={`Tap to edit photo for ${team.name}`}
        >
          <div className="w-9 h-9 xs:w-11 xs:h-11 sm:w-14 sm:h-14 rounded-2xl bg-white/10 border-2 border-white/20 overflow-hidden flex items-center justify-center text-sm sm:text-base font-bold text-[#CEFF00] shrink-0 shadow-md transition-transform group-hover/singles:scale-105">
            {getPhoto(team.rightPlayer || team.name) ? (
              <img src={getPhoto(team.rightPlayer || team.name)!} alt="" className="w-full h-full object-cover" />
            ) : (
              (team.rightPlayer || team.name).charAt(0)
            )}
          </div>
          <div className="text-left min-w-0">
            <div className="text-xs sm:text-sm font-bold text-white truncate max-w-[90px] xs:max-w-[130px] sm:max-w-none">
              {team.rightPlayer || team.name}
            </div>
            <span className="text-[9px] sm:text-[10px] text-[#CEFF00] flex items-center gap-1 font-mono">
              <Camera size={10} />
              <span className="hidden xs:inline">Change photo</span>
              <span className="xs:hidden">Photo</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
