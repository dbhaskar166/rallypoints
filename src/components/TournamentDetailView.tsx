import React, { useState, useRef } from 'react';
import { Tournament, UserProfile, UserWallet, BracketMatch } from '../types';
import { formatDateLabel } from '../utils/badminton';
import { fileToDataUrl } from '../utils/image';
import {
  ArrowLeft,
  Trophy,
  Crown,
  Calendar,
  MapPin,
  Users,
  Zap,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Play,
  Upload,
} from 'lucide-react';

interface TournamentDetailViewProps {
  tournament: Tournament;
  profile: UserProfile | null;
  wallet: UserWallet;
  playerPhotos: Record<string, string>;
  onBack: () => void;
  onJoin: (entryName: string) => void;
  onStartTournament: () => void;
  onPlayBracketMatch: (roundIdx: number, matchIdx: number) => void;
  onViewMatch: (matchId: string) => void;
  onAdminAddEntry: (name: string, photoUrl?: string) => void;
  onAdminRemoveEntry: (entryId: string) => void;
  onOpenWallet: () => void;
}

export const TournamentDetailView: React.FC<TournamentDetailViewProps> = ({
  tournament,
  profile,
  wallet,
  playerPhotos,
  onBack,
  onJoin,
  onStartTournament,
  onPlayBracketMatch,
  onViewMatch,
  onAdminAddEntry,
  onAdminRemoveEntry,
  onOpenWallet,
}) => {
  const [partnerName, setPartnerName] = useState(
    tournament.format === 'Doubles' && profile ? `${profile.name} & Partner` : profile?.name || ''
  );
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhoto, setWalkinPhoto] = useState('');
  const [showAdminTools, setShowAdminTools] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const walkinFileInputRef = useRef<HTMLInputElement>(null);

  const isUserRegistered =
    Boolean(profile) &&
    tournament.entries.some(
      e => e.name.toLowerCase().includes(profile!.name.toLowerCase())
    );

  const isFull = tournament.entries.length >= tournament.maxTeams;
  const canStart = tournament.status === 'open' && tournament.entries.length >= 2;
  const isAdmin = profile?.name === tournament.createdBy || profile?.name === 'Alex Chen';

  const handleJoinClick = () => {
    if (!partnerName.trim()) return;
    onJoin(partnerName.trim());
  };

  const getPlayerPhoto = (name?: string | null) => {
    if (!name) return null;
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
            <span>Tournament Center</span>
            <span>·</span>
            <span className="uppercase text-[#CEFF00] font-semibold">{tournament.format}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight truncate">
            {tournament.name}
          </h1>
        </div>
      </div>

      {/* Hero Overview Card */}
      <div className="rounded-3xl bg-[#0D1017] border border-white/[0.08] p-6 relative overflow-hidden">
        {tournament.status === 'completed' && (
          <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/[0.06] rounded-full blur-3xl pointer-events-none" />
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold border ${
                  tournament.status === 'live'
                    ? 'bg-[#CEFF00]/10 text-[#CEFF00] border-[#CEFF00]/30 animate-pulse'
                    : tournament.status === 'completed'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {tournament.status === 'live'
                  ? 'In Progress (Live)'
                  : tournament.status === 'completed'
                  ? 'Tournament Completed'
                  : 'Registration Open'}
              </span>
              <span className="text-xs text-white/40">·</span>
              <span className="text-xs text-white/70">
                Created by <strong>{tournament.createdBy}</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-white/60">
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-[#CEFF00]" />
                <span>{tournament.venue}</span>
              </div>
              {tournament.date && (
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-cyan-400" />
                  <span>{formatDateLabel(tournament.date)}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Users size={14} className="text-purple-400" />
                <span>
                  {tournament.entries.length} / {tournament.maxTeams} Teams Enrolled
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center px-4">
              <div className="text-[10px] font-mono text-white/40 uppercase">Entry Fee</div>
              <div className="text-xl font-bold font-mono-numbers text-white mt-0.5">
                {tournament.fee > 0 ? `₹${tournament.fee}` : 'Free'}
              </div>
            </div>

            {tournament.status === 'open' && !isUserRegistered && !isFull && (
              <button
                onClick={handleJoinClick}
                className="px-5 py-3 rounded-xl bg-[#CEFF00] text-black font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#b8e000] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(206,255,0,0.2)]"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Register Team</span>
              </button>
            )}

            {isUserRegistered && tournament.status === 'open' && (
              <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-xs flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>You're Enrolled</span>
              </div>
            )}
          </div>
        </div>

        {/* Champion highlight */}
        {tournament.status === 'completed' && tournament.championName && (
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Crown size={24} />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                Tournament Winner & Champion
              </div>
              <div className="text-lg font-display font-bold text-white">
                {tournament.championName}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bracket Tree Section */}
      {tournament.bracket ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-bold text-white tracking-tight">
                Single-Elimination Bracket
              </h2>
              <p className="text-xs text-white/50">
                Click any match to launch the live scoreboard and advance the winner
              </p>
            </div>
            {tournament.status === 'live' && (
              <span className="text-xs font-mono text-[#CEFF00] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#CEFF00] animate-pulse" />
                Live Bracket
              </span>
            )}
          </div>

          {/* Interactive Bracket Tree */}
          <div className="overflow-x-auto pb-4">
            <div className="flex items-start gap-6 min-w-[640px] p-2">
              {tournament.bracket.rounds.map((round, rIdx) => {
                const totalRounds = tournament.bracket!.rounds.length;
                const roundTitle =
                  rIdx === totalRounds - 1
                    ? 'Final'
                    : rIdx === totalRounds - 2
                    ? 'Semifinals'
                    : rIdx === totalRounds - 3
                    ? 'Quarterfinals'
                    : `Round ${rIdx + 1}`;

                return (
                  <div key={rIdx} className="flex-1 space-y-3 min-w-[200px]">
                    <div className="text-center py-1.5 px-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-mono font-bold text-white/70">
                      {roundTitle}
                    </div>

                    <div className="space-y-4">
                      {round.map((bm, mIdx) => (
                        <BracketMatchCard
                          key={bm.id}
                          bracketMatch={bm}
                          onPlayMatch={() => onPlayBracketMatch(rIdx, mIdx)}
                          onViewMatch={() => bm.matchId && onViewMatch(bm.matchId)}
                          playerPhotos={playerPhotos}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : (
        /* Bracket Not Started Yet */
        <div className="p-8 text-center rounded-3xl bg-[#0D1017] border border-white/[0.06] space-y-4">
          <Trophy size={36} className="mx-auto text-white/20" />
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">Bracket Not Generated Yet</h3>
            <p className="text-xs text-white/50 max-w-md mx-auto">
              Once registration has at least 2 entries, the tournament organizer can seed the bracket and initiate match play.
            </p>
          </div>

          {canStart && (
            <button
              onClick={onStartTournament}
              className="px-6 py-3 rounded-xl bg-[#CEFF00] text-black font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#b8e000] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(206,255,0,0.2)] mx-auto"
            >
              <Zap size={16} />
              <span>Generate Bracket & Start Tournament</span>
            </button>
          )}
        </div>
      )}

      {/* Participants & Admin Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Roster List */}
        <div className="rounded-3xl bg-[#0D1017] border border-white/[0.08] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white">
              Enrolled Teams ({tournament.entries.length}/{tournament.maxTeams})
            </h3>
            <span className="text-[11px] font-mono text-white/40">Roster</span>
          </div>

          {tournament.entries.length === 0 ? (
            <div className="text-center py-6 text-xs text-white/40">
              No teams enrolled yet. Be the first to enter!
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {tournament.entries.map((entry, idx) => {
                const photo = getPlayerPhoto(entry.name);
                return (
                  <div key={entry.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-white/40 w-4">
                        {idx + 1}
                      </span>
                      <div className="w-11 h-11 rounded-2xl bg-[#181F2C] border-2 border-white/[0.12] overflow-hidden flex items-center justify-center text-sm font-bold text-[#CEFF00] shrink-0 shadow-sm">
                        {photo ? (
                          <img src={photo} alt={entry.name} className="w-full h-full object-cover" />
                        ) : (
                          entry.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="text-sm font-semibold text-white">{entry.name}</span>
                    </div>

                    {tournament.status === 'open' && isAdmin && (
                      <button
                        onClick={() => onAdminRemoveEntry(entry.id)}
                        className="text-white/30 hover:text-rose-400 p-1 transition-colors"
                        title="Remove Entry"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Registration Input if Open */}
          {tournament.status === 'open' && !isFull && (
            <div className="pt-3 border-t border-white/[0.06] space-y-2">
              <label className="block text-[11px] font-medium text-white/60">
                Register Your Team / Partner
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={
                    tournament.format === 'Doubles' ? 'e.g. Diwakar & Rohan' : 'e.g. Diwakar'
                  }
                  value={partnerName}
                  onChange={e => setPartnerName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#141824] border border-white/[0.08] text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#CEFF00]/50"
                />
                <button
                  onClick={handleJoinClick}
                  className="px-4 py-2 rounded-xl bg-[#CEFF00] text-black font-semibold text-xs hover:bg-[#b8e000] active:scale-[0.98] transition-all whitespace-nowrap"
                >
                  Join
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Organizer / Admin Tools Panel */}
        <div className="rounded-3xl bg-[#0D1017] border border-white/[0.08] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white">
              Organizer Panel
            </h3>
            <span className="text-[10px] font-mono text-[#CEFF00]">Admin</span>
          </div>

          <p className="text-xs text-white/50 leading-relaxed">
            As an organizer, you can manually enroll walk-in players without fee checks or shuffle bracket matchups.
          </p>

          {/* Add walk-in form */}
          {tournament.status === 'open' && (
            <div className="space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-xs font-semibold text-white block">
                Add Walk-in Player/Team
              </span>
              <input
                type="text"
                placeholder={tournament.format === 'Doubles' ? 'Names (e.g. Liam & Noah)' : 'Player name'}
                value={walkinName}
                onChange={e => setWalkinName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#141824] border border-white/[0.08] text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#CEFF00]/50"
              />

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Photo URL (optional)"
                  value={walkinPhoto}
                  onChange={e => setWalkinPhoto(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#141824] border border-white/[0.08] text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#CEFF00]/50"
                />
                <input
                  ref={walkinFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setIsUploadingPhoto(true);
                      const dataUrl = await fileToDataUrl(file);
                      setWalkinPhoto(dataUrl);
                    } finally {
                      setIsUploadingPhoto(false);
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={isUploadingPhoto}
                  onClick={() => walkinFileInputRef.current?.click()}
                  className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white/90 border border-white/[0.08] flex items-center gap-1.5 shrink-0"
                  title="Upload from device"
                >
                  <Upload size={13} className="text-[#CEFF00]" />
                  <span>{isUploadingPhoto ? '...' : 'Upload'}</span>
                </button>
              </div>

              {walkinPhoto && (
                <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white/[0.02]">
                  <img src={walkinPhoto} alt="" className="w-6 h-6 rounded-full object-cover" />
                  <span className="text-[11px] text-white/50 truncate flex-1">Photo attached</span>
                  <button
                    type="button"
                    onClick={() => setWalkinPhoto('')}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}

              <button
                disabled={!walkinName.trim() || isFull}
                onClick={() => {
                  onAdminAddEntry(walkinName.trim(), walkinPhoto.trim());
                  setWalkinName('');
                  setWalkinPhoto('');
                }}
                className="w-full py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] disabled:opacity-40 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Plus size={14} />
                <span>Add Directly to Roster</span>
              </button>
            </div>
          )}

          {canStart && (
            <div className="pt-2">
              <button
                onClick={onStartTournament}
                className="w-full py-3 rounded-xl bg-[#CEFF00] hover:bg-[#b8e000] text-black font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(206,255,0,0.2)]"
              >
                <Zap size={15} />
                <span>Generate Bracket & Start Matches</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface BracketMatchCardProps {
  bracketMatch: BracketMatch;
  onPlayMatch: () => void;
  onViewMatch: () => void;
  playerPhotos: Record<string, string>;
}

const BracketMatchCard: React.FC<BracketMatchCardProps> = ({
  bracketMatch,
  onPlayMatch,
  onViewMatch,
  playerPhotos,
}) => {
  const isPlayable =
    Boolean(bracketMatch.teamA && bracketMatch.teamB) && !bracketMatch.winner;
  const isCompleted = Boolean(bracketMatch.winner);

  const getPhoto = (name?: string | null) => {
    if (!name) return null;
    return playerPhotos[name.trim().toLowerCase()] || null;
  };

  return (
    <div
      onClick={bracketMatch.matchId ? onViewMatch : undefined}
      className={`rounded-2xl bg-[#111520] border p-3.5 space-y-2 transition-all ${
        bracketMatch.matchId
          ? 'cursor-pointer hover:border-white/[0.25]'
          : 'cursor-default'
      } ${
        isCompleted
          ? 'border-white/[0.08]'
          : isPlayable
          ? 'border-[#CEFF00]/40 shadow-[0_0_15px_rgba(206,255,0,0.06)]'
          : 'border-white/[0.05]'
      }`}
    >
      {/* Team A */}
      <div
        className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
          bracketMatch.winner === bracketMatch.teamA?.id
            ? 'bg-[#CEFF00]/10 text-white font-bold'
            : 'text-white/70'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm">
            {bracketMatch.teamA?.name ? (
              getPhoto(bracketMatch.teamA.name) ? (
                <img
                  src={getPhoto(bracketMatch.teamA.name)!}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                bracketMatch.teamA.name.charAt(0)
              )
            ) : (
              '?'
            )}
          </div>
          <span className="text-xs truncate font-medium">
            {bracketMatch.teamA?.name || 'Waiting winner'}
          </span>
        </div>
        {bracketMatch.winner === bracketMatch.teamA?.id && (
          <CheckCircle2 size={13} className="text-[#CEFF00] shrink-0" />
        )}
      </div>

      <div className="h-px bg-white/[0.06] -mx-1" />

      {/* Team B */}
      <div
        className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
          bracketMatch.winner === bracketMatch.teamB?.id
            ? 'bg-[#CEFF00]/10 text-white font-bold'
            : 'text-white/70'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm">
            {bracketMatch.teamB?.name ? (
              getPhoto(bracketMatch.teamB.name) ? (
                <img
                  src={getPhoto(bracketMatch.teamB.name)!}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                bracketMatch.teamB.name.charAt(0)
              )
            ) : (
              '?'
            )}
          </div>
          <span className="text-xs truncate font-medium">
            {bracketMatch.teamB?.name || 'Waiting winner'}
          </span>
        </div>
        {bracketMatch.winner === bracketMatch.teamB?.id && (
          <CheckCircle2 size={13} className="text-[#CEFF00] shrink-0" />
        )}
      </div>

      {/* Action / Status Button */}
      {isPlayable && !bracketMatch.matchId && (
        <button
          onClick={e => {
            e.stopPropagation();
            onPlayMatch();
          }}
          className="w-full mt-2 py-2 rounded-xl bg-[#CEFF00] text-black font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-[#b8e000] active:scale-[0.98] transition-all shadow-[0_0_12px_rgba(206,255,0,0.15)]"
        >
          <Play size={12} fill="currentColor" />
          <span>Launch Match</span>
        </button>
      )}

      {bracketMatch.matchId && !isCompleted && (
        <div className="mt-2 py-1 px-2 rounded-lg bg-[#CEFF00]/10 border border-[#CEFF00]/20 text-[10px] font-mono text-[#CEFF00] text-center font-bold">
          ⚡ Match in progress · Tap to score
        </div>
      )}
    </div>
  );
};
