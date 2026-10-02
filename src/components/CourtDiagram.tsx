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
    <div className="w-full bg-[#0B0D13] border border-white/[0.08] rounded-2xl p-4 relative overflow-hidden shadow-2xl">
      {/* Court Header & Quick Status */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#CEFF00] animate-pulse" />
          <span className="font-semibold text-white tracking-wide uppercase text-[11px] font-display">
            BWF Court Positioner
          </span>
          <span className="text-white/40">·</span>
          <span className="text-white/60">{isDoubles ? 'Doubles Arena' : 'Singles Arena'}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-white/50 text-[11px]">
            Server: <strong className="text-[#CEFF00] font-semibold">{server.name}</strong> ({server.court})
          </span>
        </div>
      </div>

      {/* Badminton Court Container */}
      <div className="w-full max-w-lg mx-auto aspect-[16/11] sm:aspect-[16/10] min-h-[220px] bg-[#0E1520] border-2 border-[#1E293B] rounded-xl relative p-1.5 flex flex-col justify-between select-none">
        {/* Subtle synthetic court lines texture */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38BDF8_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* TEAM B HALF (Top) */}
        <div className="flex-1 border border-white/20 relative flex flex-col rounded-t-lg bg-[#0A1017]/80">
          {/* Team B Tag */}
          <div className="absolute top-1.5 left-2 z-10 text-[10px] font-medium text-white/50 tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80" />
            <span>{teamB.name}</span>
            {servingTeam === 'B' && <span className="text-[#CEFF00] font-bold">· SERVING</span>}
          </div>

          {canSwap && teamB.leftPlayer && onSwapPositions && (
            <button
              onClick={() => onSwapPositions('B')}
              className="absolute top-1 right-2 z-10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 rounded hover:bg-cyan-900/80 transition-colors"
            >
              ⇄ Swap Left/Right
            </button>
          )}

          {/* Service boxes grid */}
          <div className="flex-1 grid grid-cols-2 divide-x divide-white/20">
            {/* Left Court (from Team B perspective looking to net: Left is screen-Right, but let's label explicitly) */}
            <div
              className={`p-2 flex flex-col items-center justify-center transition-all ${
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

            {/* Right Court */}
            <div
              className={`p-2 flex flex-col items-center justify-center transition-all ${
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
        <div className="h-3 my-0.5 relative flex items-center justify-center z-10">
          <div className="w-full border-t border-dashed border-white/60 relative">
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 text-[9px] font-bold text-white/70 bg-[#0E1520] tracking-widest border border-white/20 rounded">
              NET
            </span>
          </div>
        </div>

        {/* TEAM A HALF (Bottom) */}
        <div className="flex-1 border border-white/20 relative flex flex-col rounded-b-lg bg-[#0A1017]/80">
          {/* Service boxes grid */}
          <div className="flex-1 grid grid-cols-2 divide-x divide-white/20">
            {/* Left Court */}
            <div
              className={`p-2 flex flex-col items-center justify-center transition-all ${
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

            {/* Right Court */}
            <div
              className={`p-2 flex flex-col items-center justify-center transition-all ${
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

          {/* Team A Tag */}
          <div className="absolute bottom-1.5 left-2 z-10 text-[10px] font-medium text-white/50 tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
            <span>{teamA.name}</span>
            {servingTeam === 'A' && <span className="text-[#CEFF00] font-bold">· SERVING</span>}
          </div>

          {canSwap && teamA.leftPlayer && onSwapPositions && (
            <button
              onClick={() => onSwapPositions('A')}
              className="absolute bottom-1 right-2 z-10 px-2 py-0.5 text-[10px] font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 rounded hover:bg-emerald-900/80 transition-colors"
            >
              ⇄ Swap Left/Right
            </button>
          )}
        </div>
      </div>

      {/* Trajectory / Rule Explanation Footer */}
      <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-white/60">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#CEFF00]" /> Server
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> Diagonal Receiver ({receiverName})
          </span>
        </div>
        <span className="text-white/40 italic">Even: Right Court · Odd: Left Court</span>
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
      className={`flex flex-col items-center text-center group ${
        onEditPhoto ? 'cursor-pointer hover:opacity-90' : ''
      }`}
      title={onEditPhoto ? `Tap to edit photo for ${name}` : undefined}
    >
      <div className="relative mb-1">
        {photo ? (
          <img
            src={photo}
            alt={name}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border-2 transition-transform group-hover:scale-105 shadow-md ${
              isServer
                ? 'border-[#CEFF00] ring-2 ring-[#CEFF00]/50'
                : isReceiver
                ? 'border-cyan-400 ring-2 ring-cyan-400/50'
                : 'border-white/20'
            }`}
          />
        ) : (
          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm sm:text-base font-bold transition-transform group-hover:scale-105 shadow-md ${
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
            className="absolute -top-1.5 -right-1.5 text-xs bg-black/60 rounded-full px-0.5"
          >
            🏸
          </span>
        )}
      </div>

      <span
        className={`text-[11px] font-semibold tracking-tight truncate max-w-[90px] ${
          isServer ? 'text-[#CEFF00]' : isReceiver ? 'text-cyan-300' : 'text-white/90'
        }`}
      >
        {name}
      </span>
      <span className="text-[9px] text-white/40 font-mono-numbers">{courtLabel}</span>
    </div>
  );
};
