import React from 'react';
import { Team } from '../types';
import { getCurrentReceiver, getCurrentServer } from '../utils/badminton';

interface CourtDiagramProps {
  teamA: Team;
  teamB: Team;
  scoreA: number;
  scoreB: number;
  servingTeam: 'A' | 'B';
  onSwapPositions?: (teamKey: 'A' | 'B') => void;
  canSwap?: boolean;
  playerPhotos?: Record<string, string>;
  onEditPlayerPhoto?: (playerName: string) => void;
}

export const CourtDiagram: React.FC<CourtDiagramProps> = ({
  teamA,
  teamB,
  scoreA,
  scoreB,
  servingTeam,
  onSwapPositions,
  canSwap = false,
  playerPhotos = {},
  onEditPlayerPhoto,
}) => {
  const isDoubles = Boolean(teamA.leftPlayer || teamB.leftPlayer);
  const server = servingTeam === 'A' ? getCurrentServer(teamA, scoreA) : getCurrentServer(teamB, scoreB);
  const receivingTeam = servingTeam === 'A' ? teamB : teamA;
  const receiverName = getCurrentReceiver(server.court, receivingTeam);

  const getPhoto = (name?: string | null) => {
    if (!name) return null;
    return playerPhotos[name.trim().toLowerCase()] || null;
  };

  return (
    <div className="w-full bg-[#0B0D13] border border-white/[0.08] rounded-2xl p-3 sm:p-4 relative overflow-hidden shadow-2xl">
      {/* Court Header & Quick Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#CEFF00] animate-pulse shrink-0" />
          <span className="font-semibold text-white tracking-wide uppercase text-[10px] sm:text-[11px] font-display truncate">
            BWF Court Positioner
          </span>
          <span className="text-white/40 hidden xs:inline">·</span>
          <span className="text-white/60 text-[10px] sm:text-[11px] hidden xs:inline">
            {isDoubles ? 'Doubles Arena' : 'Singles Arena'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] shrink-0">
          <span className="text-white/50">
            Server:{' '}
            <strong className="text-[#CEFF00] font-semibold">{server.name}</strong> ({server.court})
          </span>
        </div>
      </div>

      {/* Pre-set Lineup Swap Actions Banner (shown cleanly above court when score is 0-0) */}
      {canSwap && isDoubles && onSwapPositions && (
        <div className="mb-2.5 p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[10px] sm:text-[11px] text-white/50 font-mono">
            Initial Lineup Adjustment:
          </span>
          <div className="flex items-center gap-1.5">
            {teamB.leftPlayer && (
              <button
                type="button"
                onClick={() => onSwapPositions('B')}
                className="px-2 py-1 text-[10px] font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 rounded-lg hover:bg-cyan-900/80 transition-colors"
                title={`Swap starting court positions for ${teamB.name}`}
              >
                ⇄ Swap {teamB.name}
              </button>
            )}
            {teamA.leftPlayer && (
              <button
                type="button"
                onClick={() => onSwapPositions('A')}
                className="px-2 py-1 text-[10px] font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 rounded-lg hover:bg-emerald-900/80 transition-colors"
                title={`Swap starting court positions for ${teamA.name}`}
              >
                ⇄ Swap {teamA.name}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Badminton Court Container */}
      <div className="w-full max-w-lg mx-auto aspect-[16/13] xs:aspect-[16/12] sm:aspect-[16/10] min-h-[250px] sm:min-h-[280px] bg-[#0E1520] border-2 border-[#1E293B] rounded-xl relative p-1.5 flex flex-col justify-between select-none">
        {/* Synthetic court lines texture */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38BDF8_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* TEAM B HALF (Top) */}
        <div className="flex-1 border border-white/20 relative flex flex-col rounded-t-lg bg-[#0A1017]/80 overflow-hidden">
          {/* Team B Header Tag Bar */}
          <div className="px-2 py-1 bg-black/40 border-b border-white/10 flex items-center justify-between text-[9px] sm:text-[10px] font-medium text-white/60">
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              <span className="truncate">{teamB.name}</span>
            </div>
            {servingTeam === 'B' ? (
              <span className="text-[#CEFF00] font-bold tracking-wider shrink-0 flex items-center gap-1 font-mono">
                <span>🏸</span>
                <span>SERVING</span>
              </span>
            ) : (
              <span className="text-white/40 shrink-0 font-mono">RECEIVING</span>
            )}
          </div>

          {/* Service boxes grid */}
          <div className="flex-1 grid grid-cols-2 divide-x divide-white/20">
            {/* Left Court (Odd) */}
            <div
              className={`p-1 sm:p-2 flex flex-col items-center justify-center transition-all ${
                servingTeam === 'B' && server.court === 'Left'
                  ? 'bg-[#CEFF00]/10 ring-1 ring-[#CEFF00] ring-inset'
                  : servingTeam === 'A' && server.court === 'Right'
                  ? 'bg-cyan-500/10 ring-1 ring-cyan-400 ring-inset'
                  : ''
              }`}
            >
              <CourtPlayerPill
                name={teamB.leftPlayer || teamB.name}
                photo={getPhoto(teamB.leftPlayer || teamB.name)}
                isServer={servingTeam === 'B' && server.court === 'Left'}
                isReceiver={servingTeam === 'A' && server.court === 'Right'}
                courtLabel="Left Court (Odd)"
                onEditPhoto={onEditPlayerPhoto}
              />
            </div>

            {/* Right Court (Even) */}
            <div
              className={`p-1 sm:p-2 flex flex-col items-center justify-center transition-all ${
                servingTeam === 'B' && server.court === 'Right'
                  ? 'bg-[#CEFF00]/10 ring-1 ring-[#CEFF00] ring-inset'
                  : servingTeam === 'A' && server.court === 'Left'
                  ? 'bg-cyan-500/10 ring-1 ring-cyan-400 ring-inset'
                  : ''
              }`}
            >
              <CourtPlayerPill
                name={teamB.rightPlayer}
                photo={getPhoto(teamB.rightPlayer)}
                isServer={servingTeam === 'B' && server.court === 'Right'}
                isReceiver={servingTeam === 'A' && server.court === 'Left'}
                courtLabel="Right Court (Even)"
                onEditPhoto={onEditPlayerPhoto}
              />
            </div>
          </div>
        </div>

        {/* NET DIVIDER */}
        <div className="h-4 my-0.5 relative flex items-center justify-center z-10 shrink-0">
          <div className="w-full border-t border-dashed border-white/60 relative">
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 text-[8px] sm:text-[9px] font-bold text-white/70 bg-[#0E1520] tracking-widest border border-white/20 rounded">
              NET
            </span>
          </div>
        </div>

        {/* TEAM A HALF (Bottom) */}
        <div className="flex-1 border border-white/20 relative flex flex-col rounded-b-lg bg-[#0A1017]/80 overflow-hidden">
          {/* Service boxes grid */}
          <div className="flex-1 grid grid-cols-2 divide-x divide-white/20">
            {/* Left Court (Odd) */}
            <div
              className={`p-1 sm:p-2 flex flex-col items-center justify-center transition-all ${
                servingTeam === 'A' && server.court === 'Left'
                  ? 'bg-[#CEFF00]/10 ring-1 ring-[#CEFF00] ring-inset'
                  : servingTeam === 'B' && server.court === 'Right'
                  ? 'bg-cyan-500/10 ring-1 ring-cyan-400 ring-inset'
                  : ''
              }`}
            >
              <CourtPlayerPill
                name={teamA.leftPlayer || teamA.name}
                photo={getPhoto(teamA.leftPlayer || teamA.name)}
                isServer={servingTeam === 'A' && server.court === 'Left'}
                isReceiver={servingTeam === 'B' && server.court === 'Right'}
                courtLabel="Left Court (Odd)"
                onEditPhoto={onEditPlayerPhoto}
              />
            </div>

            {/* Right Court (Even) */}
            <div
              className={`p-1 sm:p-2 flex flex-col items-center justify-center transition-all ${
                servingTeam === 'A' && server.court === 'Right'
                  ? 'bg-[#CEFF00]/10 ring-1 ring-[#CEFF00] ring-inset'
                  : servingTeam === 'B' && server.court === 'Left'
                  ? 'bg-cyan-500/10 ring-1 ring-cyan-400 ring-inset'
                  : ''
              }`}
            >
              <CourtPlayerPill
                name={teamA.rightPlayer}
                photo={getPhoto(teamA.rightPlayer)}
                isServer={servingTeam === 'A' && server.court === 'Right'}
                isReceiver={servingTeam === 'B' && server.court === 'Left'}
                courtLabel="Right Court (Even)"
                onEditPhoto={onEditPlayerPhoto}
              />
            </div>
          </div>

          {/* Team A Footer Tag Bar */}
          <div className="px-2 py-1 bg-black/40 border-t border-white/10 flex items-center justify-between text-[9px] sm:text-[10px] font-medium text-white/60">
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="truncate">{teamA.name}</span>
            </div>
            {servingTeam === 'A' ? (
              <span className="text-[#CEFF00] font-bold tracking-wider shrink-0 flex items-center gap-1 font-mono">
                <span>🏸</span>
                <span>SERVING</span>
              </span>
            ) : (
              <span className="text-white/40 shrink-0 font-mono">RECEIVING</span>
            )}
          </div>
        </div>
      </div>

      {/* Trajectory / Rule Explanation Footer */}
      <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[10px] sm:text-[11px] text-white/60">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#CEFF00]" /> Server
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> Receiver ({receiverName})
          </span>
        </div>
        <span className="text-white/40 italic text-[9px] sm:text-[10px]">
          Even Score: Right Court · Odd Score: Left Court
        </span>
      </div>
    </div>
  );
};

interface CourtPlayerPillProps {
  name?: string | null;
  photo?: string | null;
  isServer: boolean;
  isReceiver: boolean;
  courtLabel: string;
  onEditPhoto?: (name: string) => void;
}

const CourtPlayerPill: React.FC<CourtPlayerPillProps> = ({
  name,
  photo,
  isServer,
  isReceiver,
  courtLabel,
  onEditPhoto,
}) => {
  if (!name) return null;
  const initial = name.charAt(0).toUpperCase();

  return (
    <div
      onClick={onEditPhoto ? () => onEditPhoto(name) : undefined}
      className={`flex flex-col items-center text-center group max-w-full ${
        onEditPhoto ? 'cursor-pointer hover:opacity-90' : ''
      }`}
      title={onEditPhoto ? `Tap to edit photo for ${name}` : undefined}
    >
      <div className="relative mb-0.5 sm:mb-1">
        {photo ? (
          <img
            src={photo}
            alt={name}
            className={`w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 transition-transform group-hover:scale-105 shadow-md ${
              isServer
                ? 'border-[#CEFF00] ring-2 ring-[#CEFF00]/50'
                : isReceiver
                ? 'border-cyan-400 ring-2 ring-cyan-400/50'
                : 'border-white/20'
            }`}
          />
        ) : (
          <div
            className={`w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xs sm:text-base font-bold transition-transform group-hover:scale-105 shadow-md ${
              isServer
                ? 'bg-[#CEFF00] text-black ring-2 ring-[#CEFF00]/50'
                : isReceiver
                ? 'bg-cyan-400 text-black ring-2 ring-cyan-400/50'
                : 'bg-white/10 text-white border border-white/20'
            }`}
          >
            {initial}
          </div>
        )}

        {isServer && (
          <span
            title="Active Server with Shuttlecock"
            className="absolute -top-1 -right-1 text-[10px] sm:text-xs bg-black/70 rounded-full px-0.5 shadow-sm"
          >
            🏸
          </span>
        )}
      </div>

      <span
        className={`text-[9px] xs:text-[10px] sm:text-[11px] font-semibold tracking-tight truncate max-w-[70px] xs:max-w-[85px] sm:max-w-[110px] ${
          isServer ? 'text-[#CEFF00]' : isReceiver ? 'text-cyan-300' : 'text-white/90'
        }`}
      >
        {name}
      </span>
      <span className="text-[8px] sm:text-[9px] text-white/40 font-mono-numbers truncate max-w-full">
        {courtLabel}
      </span>
    </div>
  );
};
