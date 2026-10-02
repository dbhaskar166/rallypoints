import React from 'react';
import { CourtBooking, UserProfile, UserWallet } from '../types';
import { formatDateLabel } from '../utils/badminton';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Users,
  Zap,
  Plus,
  Crown,
  CheckCircle2,
  LogOut,
  MapPin,
} from 'lucide-react';

interface BookingDetailViewProps {
  booking: CourtBooking;
  profile: UserProfile | null;
  wallet: UserWallet;
  playerPhotos: Record<string, string>;
  onBack: () => void;
  onJoin: () => void;
  onLeave?: () => void;
  onStartMatch: () => void;
  onViewMatch: (matchId: string) => void;
  onOpenWallet: () => void;
}

export const BookingDetailView: React.FC<BookingDetailViewProps> = ({
  booking,
  profile,
  wallet,
  playerPhotos,
  onBack,
  onJoin,
  onLeave,
  onStartMatch,
  onViewMatch,
  onOpenWallet,
}) => {
  const isJoined = Boolean(profile) && booking.players.includes(profile!.name);
  const spotsLeft = booking.slotsTotal - booking.players.length;
  const isFull = spotsLeft <= 0;

  const handleJoinClick = () => {
    onJoin();
  };

  const getPlayerPhoto = (name: string) => {
    return playerPhotos[name.trim().toLowerCase()] || null;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Bar with back button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-[#0D1017] border border-white/[0.08] hover:border-white/[0.2] text-white/70 hover:text-white flex items-center justify-center transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs font-mono text-white/40">
            <span>Court Management</span>
            <span>·</span>
            <span className="uppercase text-cyan-400 font-semibold">{booking.format}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight truncate">
            {booking.court}
          </h1>
        </div>
      </div>

      {/* Hero Court Card */}
      <div className="rounded-3xl bg-[#0D1017] border border-white/[0.08] p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold border ${
                  booking.status === 'open'
                    ? 'bg-[#CEFF00]/10 text-[#CEFF00] border-[#CEFF00]/30'
                    : booking.status === 'full'
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                    : 'bg-white/5 text-white/40 border-white/10'
                }`}
              >
                {booking.status === 'open'
                  ? `${spotsLeft} Slot${spotsLeft > 1 ? 's' : ''} Open`
                  : booking.status === 'full'
                  ? 'All Players Ready'
                  : 'Session Completed'}
              </span>
              <span className="text-xs text-white/40">·</span>
              <span className="text-xs text-white/70">
                Organized by <strong>{booking.createdBy}</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-white/60">
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-[#CEFF00]" />
                <span>{booking.time}</span>
              </div>
              {booking.date && (
                <div className="flex items-center gap-1.5">
                  <CalendarDays size={14} className="text-cyan-400" />
                  <span>{formatDateLabel(booking.date)}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Users size={14} className="text-purple-400" />
                <span>
                  {booking.players.length} / {booking.slotsTotal} Players Joined
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center px-4">
              <div className="text-[10px] font-mono text-white/40 uppercase">Cost / Player</div>
              <div className="text-xl font-bold font-mono-numbers text-white mt-0.5">
                {booking.fee > 0 ? `₹${booking.fee}` : 'Free'}
              </div>
            </div>

            {booking.status === 'open' && !isJoined && (
              <button
                onClick={handleJoinClick}
                className="px-5 py-3 rounded-xl bg-[#CEFF00] text-black font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#b8e000] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(206,255,0,0.2)]"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Join Game ({spotsLeft} left)</span>
              </button>
            )}

            {isJoined && booking.status === 'open' && (
              <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-xs flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>You're Booked</span>
              </div>
            )}
          </div>
        </div>

        {/* Winner Highlight if Finished */}
        {booking.status === 'completed' && booking.winner && (
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Crown size={24} />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                Match Winner
              </div>
              <div className="text-lg font-display font-bold text-white">{booking.winner}</div>
            </div>
          </div>
        )}
      </div>

      {/* Roster & Sides Layout */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-bold text-white tracking-tight">
            Court Lineup & Team Assignment
          </h2>
          <span className="text-xs text-white/40 font-mono">
            {booking.format === 'Doubles' ? '2 vs 2 Pairings' : '1 vs 1 Singles'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Team A Side */}
          <div className="rounded-3xl bg-[#0D1017] border border-white/[0.08] p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-white/50 pb-2 border-b border-white/[0.06]">
              <span className="font-semibold text-white">Side A (Near Court)</span>
              <span className="text-[10px] font-mono text-[#CEFF00]">
                {booking.format === 'Doubles' ? 'Slots 1 & 2' : 'Slot 1'}
              </span>
            </div>

            <div className="space-y-2">
              <PlayerSlotRow
                slotNum={1}
                playerName={booking.players[0]}
                isOrganizer={booking.players[0] === booking.createdBy}
                photo={booking.players[0] ? getPlayerPhoto(booking.players[0]) : null}
              />

              {booking.format === 'Doubles' && (
                <PlayerSlotRow
                  slotNum={2}
                  playerName={booking.players[1]}
                  isOrganizer={booking.players[1] === booking.createdBy}
                  photo={booking.players[1] ? getPlayerPhoto(booking.players[1]) : null}
                />
              )}
            </div>
          </div>

          {/* Team B Side */}
          <div className="rounded-3xl bg-[#0D1017] border border-white/[0.08] p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-white/50 pb-2 border-b border-white/[0.06]">
              <span className="font-semibold text-white">Side B (Far Court)</span>
              <span className="text-[10px] font-mono text-cyan-400">
                {booking.format === 'Doubles' ? 'Slots 3 & 4' : 'Slot 2'}
              </span>
            </div>

            <div className="space-y-2">
              <PlayerSlotRow
                slotNum={booking.format === 'Doubles' ? 3 : 2}
                playerName={booking.format === 'Doubles' ? booking.players[2] : booking.players[1]}
                isOrganizer={
                  (booking.format === 'Doubles' ? booking.players[2] : booking.players[1]) ===
                  booking.createdBy
                }
                photo={
                  (booking.format === 'Doubles' ? booking.players[2] : booking.players[1])
                    ? getPlayerPhoto(
                        booking.format === 'Doubles' ? booking.players[2] : booking.players[1]
                      )
                    : null
                }
              />

              {booking.format === 'Doubles' && (
                <PlayerSlotRow
                  slotNum={4}
                  playerName={booking.players[3]}
                  isOrganizer={booking.players[3] === booking.createdBy}
                  photo={booking.players[3] ? getPlayerPhoto(booking.players[3]) : null}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Match Launch / Progress Actions */}
      <div className="rounded-3xl bg-[#0D1017] border border-white/[0.08] p-6 text-center space-y-4">
        {booking.status === 'full' && !booking.matchId && (
          <div className="space-y-3 max-w-md mx-auto">
            <h3 className="text-base font-semibold text-white">All Slots Filled · Ready for Play!</h3>
            <p className="text-xs text-white/50">
              Start the official match on this court. RallyPoint will automatically assign teams and keep track of live sets and doubles rotation.
            </p>
            <button
              onClick={onStartMatch}
              className="w-full py-3.5 rounded-xl bg-[#CEFF00] hover:bg-[#b8e000] text-black font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(206,255,0,0.2)]"
            >
              <Zap size={16} />
              <span>Launch Match & Open Scoreboard</span>
            </button>
          </div>
        )}

        {booking.matchId && (
          <div className="space-y-3 max-w-md mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#CEFF00]/10 text-[#CEFF00] text-xs font-mono font-semibold border border-[#CEFF00]/30">
              <span className="w-2 h-2 rounded-full bg-[#CEFF00] animate-pulse" />
              <span>Match Underway on Court</span>
            </div>
            <p className="text-xs text-white/50">
              Scoring is active for this session. Tap below to view live sets, scores, and court diagrams.
            </p>
            <button
              onClick={() => onViewMatch(booking.matchId!)}
              className="w-full py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-white/[0.1]"
            >
              <Zap size={15} className="text-[#CEFF00]" />
              <span>
                {booking.status === 'completed' ? 'View Final Match Record' : 'Open Live Scoreboard'}
              </span>
            </button>
          </div>
        )}

        {booking.status === 'open' && (
          <div className="text-xs text-white/40">
            Waiting for {spotsLeft} more player{spotsLeft > 1 ? 's' : ''} to join before match can be launched.
          </div>
        )}
      </div>
    </div>
  );
};

interface PlayerSlotRowProps {
  slotNum: number;
  playerName?: string;
  isOrganizer: boolean;
  photo?: string | null;
}

const PlayerSlotRow: React.FC<PlayerSlotRowProps> = ({
  slotNum,
  playerName,
  isOrganizer,
  photo,
}) => {
  if (!playerName) {
    return (
      <div className="p-3 rounded-2xl border border-dashed border-white/20 bg-white/[0.01] flex items-center justify-between text-xs text-white/40">
        <div className="flex items-center gap-3">
          <span className="w-5 text-center font-mono font-bold">0{slotNum}</span>
          <span>Open Player Slot</span>
        </div>
        <span className="text-[10px] uppercase font-mono tracking-wider text-white/30">Available</span>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-2xl bg-[#141824] border border-white/[0.08] flex items-center justify-between text-xs text-white">
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-5 text-center font-mono font-bold text-white/40">0{slotNum}</span>
        <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm">
          {photo ? (
            <img src={photo} alt={playerName} className="w-full h-full object-cover" />
          ) : (
            playerName.charAt(0).toUpperCase()
          )}
        </div>
        <span className="font-semibold text-sm truncate">{playerName}</span>
      </div>

      {isOrganizer && (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/70">
          Host
        </span>
      )}
    </div>
  );
};
