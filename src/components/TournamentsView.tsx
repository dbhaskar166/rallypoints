import React, { useState } from 'react';
import { MatchFormat, Tournament } from '../types';
import { formatDateLabel } from '../utils/badminton';
import { Trophy, Plus, Search, Calendar, MapPin, Users, Crown, Zap } from 'lucide-react';

interface TournamentsViewProps {
  tournaments: Tournament[];
  onSelectTournament: (id: string) => void;
  onCreateTournament: (data: {
    name: string;
    format: MatchFormat;
    date: string;
    venue: string;
    maxTeams: number;
    fee: number;
  }) => void;
}

export const TournamentsView: React.FC<TournamentsViewProps> = ({
  tournaments,
  onSelectTournament,
  onCreateTournament,
}) => {
  const [filterFormat, setFilterFormat] = useState<'All' | 'Singles' | 'Doubles'>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'open' | 'live' | 'completed'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [format, setFormat] = useState<MatchFormat>('Doubles');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('Court 1 · Main Arena');
  const [maxTeams, setMaxTeams] = useState('8');
  const [fee, setFee] = useState('150');

  const filtered = tournaments.filter(t => {
    if (filterFormat !== 'All' && t.format !== filterFormat) return false;
    if (filterStatus !== 'All' && t.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.venue.toLowerCase().includes(q) ||
        (t.championName && t.championName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateTournament({
      name: name.trim(),
      format,
      date: date || new Date().toISOString().split('T')[0],
      venue: venue.trim() || 'Court 1 · Main Arena',
      maxTeams: Number(maxTeams) || 8,
      fee: Number(fee) || 0,
    });
    setName('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
            Club Tournaments
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Official BWF elimination brackets, seeding, and live court matches
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#CEFF00] text-black font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#b8e000] active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(206,255,0,0.2)] shrink-0"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Host Tournament</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search tournaments, venues, or champions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0D1017] border border-white/[0.08] text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#CEFF00]/50 transition-colors"
          />
        </div>

        {/* Segmented Filter: Format */}
        <div className="flex items-center gap-1 p-1 bg-[#0D1017] border border-white/[0.08] rounded-xl self-start sm:self-auto shrink-0">
          {(['All', 'Singles', 'Doubles'] as const).map(fmt => (
            <button
              key={fmt}
              onClick={() => setFilterFormat(fmt)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filterFormat === fmt
                  ? 'bg-white/[0.1] text-white shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 p-1 bg-[#0D1017] border border-white/[0.08] rounded-xl self-start sm:self-auto shrink-0">
          {(['All', 'open', 'live', 'completed'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                filterStatus === st
                  ? 'bg-[#CEFF00]/15 text-[#CEFF00] border border-[#CEFF00]/30'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Tournaments Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0D1017] border border-white/[0.06] text-white/50 space-y-3">
          <Trophy size={32} className="mx-auto text-white/20" />
          <div className="text-sm font-semibold text-white/70">No tournaments found</div>
          <p className="text-xs text-white/40 max-w-sm mx-auto">
            Try adjusting your search criteria or create a new tournament to start competition.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(t => {
            const isFull = t.entries.length >= t.maxTeams;
            return (
              <div
                key={t.id}
                onClick={() => onSelectTournament(t.id)}
                className="rounded-2xl bg-[#0D1017] border border-white/[0.08] hover:border-white/[0.2] transition-all p-5 flex flex-col justify-between cursor-pointer group hover:shadow-xl relative overflow-hidden"
              >
                {/* Accent glow on live */}
                {t.status === 'live' && (
                  <div className="absolute top-0 right-0 w-28 h-28 bg-[#CEFF00]/5 rounded-full blur-xl pointer-events-none" />
                )}

                <div>
                  {/* Category / Status strip */}
                  <div className="flex items-center justify-between text-xs mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${
                          t.format === 'Doubles' ? 'text-cyan-400' : 'text-emerald-400'
                        }`}
                      >
                        {t.format}
                      </span>
                      <span className="text-white/30">·</span>
                      <span className="text-white/50 text-[11px]">
                        {t.entries.length}/{t.maxTeams} Teams
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider text-[10px] font-bold border ${
                        t.status === 'live'
                          ? 'bg-[#CEFF00]/10 text-[#CEFF00] border-[#CEFF00]/30 animate-pulse'
                          : t.status === 'completed'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : isFull
                          ? 'bg-white/5 text-white/50 border-white/10'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {t.status === 'live' ? 'Live Play' : t.status === 'completed' ? 'Finished' : isFull ? 'Entries Full' : 'Open'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-white group-hover:text-[#CEFF00] transition-colors leading-snug line-clamp-1">
                    {t.name}
                  </h3>

                  {/* Metadata */}
                  <div className="mt-3 space-y-1.5 text-xs text-white/50">
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-white/40 shrink-0" />
                      <span className="truncate">{t.venue}</span>
                    </div>
                    {t.date && (
                      <div className="flex items-center gap-2">
                        <Calendar size={13} className="text-white/40 shrink-0" />
                        <span>{formatDateLabel(t.date)}</span>
                      </div>
                    )}
                  </div>

                  {/* Champion callout if completed */}
                  {t.status === 'completed' && t.championName && (
                    <div className="mt-3 p-2 rounded-xl bg-amber-500/[0.08] border border-amber-500/20 flex items-center gap-2 text-xs text-amber-300">
                      <Crown size={14} className="text-amber-400 shrink-0" />
                      <span className="truncate font-semibold">Champion: {t.championName}</span>
                    </div>
                  )}
                </div>

                {/* Footer with fee and action */}
                <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <div className="font-mono font-semibold text-white">
                    {t.fee > 0 ? `₹${t.fee} Entry` : 'Free Entry'}
                  </div>
                  <span className="font-semibold text-white/80 group-hover:text-[#CEFF00] flex items-center gap-1 transition-colors">
                    {t.status === 'live' ? (
                      <>
                        <Zap size={13} className="text-[#CEFF00]" />
                        <span>View Bracket</span>
                      </>
                    ) : (
                      <span>Bracket & Details →</span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Host Tournament Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-[#0D1017] border border-white/[0.12] p-6 sm:p-7 shadow-2xl relative">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-[#CEFF00]" />
                <h2 className="text-lg font-display font-bold text-white">Host New Tournament</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/60 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">
                  Tournament Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Smash Championship"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141824] border border-white/[0.08] text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#CEFF00]/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">Format</label>
                  <select
                    value={format}
                    onChange={e => setFormat(e.target.value as MatchFormat)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141824] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#CEFF00]/50"
                  >
                    <option value="Doubles">Doubles (Pairs)</option>
                    <option value="Singles">Singles</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">
                    Bracket Size
                  </label>
                  <select
                    value={maxTeams}
                    onChange={e => setMaxTeams(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141824] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#CEFF00]/50"
                  >
                    <option value="4">4 Teams (Semifinals)</option>
                    <option value="8">8 Teams (Quarterfinals)</option>
                    <option value="16">16 Teams (Round of 16)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141824] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#CEFF00]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">
                  Court Venue
                </label>
                <input
                  type="text"
                  placeholder="e.g. Court 1 · Main Arena"
                  value={venue}
                  onChange={e => setVenue(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141824] border border-white/[0.08] text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#CEFF00]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">
                  Entry Fee (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  placeholder="0 for free"
                  value={fee}
                  onChange={e => setFee(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141824] border border-white/[0.08] text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#CEFF00]/50"
                />
                <span className="text-[10px] text-white/40 mt-1 block">
                  Deducted automatically from player wallet when joining.
                </span>
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
                  Create Tournament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
