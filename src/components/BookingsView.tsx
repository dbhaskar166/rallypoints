import React, { useState } from 'react';
import { CourtBooking, MatchFormat, UserProfile, UserWallet } from '../types';
import { formatDateLabel } from '../utils/badminton';
import { CalendarDays, Plus, Clock, Users, MapPin, Zap } from 'lucide-react';

interface BookingsViewProps {
  bookings: CourtBooking[];
  profile: UserProfile | null;
  wallet: UserWallet;
  playerPhotos: Record<string, string>;
  onSelectBooking: (id: string) => void;
  onCreateBooking: (data: {
    court: string;
    date: string;
    time: string;
    format: MatchFormat;
    fee: number;
  }) => void;
}

export const BookingsView: React.FC<BookingsViewProps> = ({
  bookings,
  profile,
  playerPhotos,
  onSelectBooking,
  onCreateBooking,
}) => {
  const [filterFormat, setFilterFormat] = useState<'All' | 'Singles' | 'Doubles'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal form states
  const [court, setCourt] = useState('Court 1 · Main Arena');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('18:00');
  const [format, setFormat] = useState<MatchFormat>('Doubles');
  const [fee, setFee] = useState('100');

  const filtered = bookings.filter(b => {
    if (filterFormat !== 'All' && b.format !== filterFormat) return false;
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateBooking({
      court: court.trim() || 'Court 1 · Main Arena',
      date: date || new Date().toISOString().split('T')[0],
      time: time || '18:00',
      format,
      fee: Number(fee) || 0,
    });
    setIsModalOpen(false);
  };

  const getPlayerPhoto = (name: string) => {
    return playerPhotos[name.trim().toLowerCase()] || null;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and Booking CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
            Court Bookings & Open Play
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Reserve club courts, fill doubles rosters, and launch competitive matches
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#CEFF00] text-black font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#b8e000] active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(206,255,0,0.2)] shrink-0"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Reserve Court</span>
        </button>
      </div>

      {/* Format Filter */}
      <div className="flex items-center gap-1 p-1 bg-[#0D1017] border border-white/[0.08] rounded-xl self-start w-fit">
        {(['All', 'Singles', 'Doubles'] as const).map(fmt => (
          <button
            key={fmt}
            onClick={() => setFilterFormat(fmt)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterFormat === fmt
                ? 'bg-white/[0.1] text-white shadow-sm'
                : 'text-white/50 hover:text-white'
            }`}
          >
            {fmt}
          </button>
        ))}
      </div>

      {/* Bookings Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0D1017] border border-white/[0.06] text-white/50 space-y-3">
          <CalendarDays size={32} className="mx-auto text-white/20" />
          <div className="text-sm font-semibold text-white/70">No courts reserved</div>
          <p className="text-xs text-white/40 max-w-sm mx-auto">
            Book an arena for singles or doubles and invite your club partners to fill the game.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(b => {
            const spotsOpen = b.slotsTotal - b.players.length;
            const isUserJoined =
              Boolean(profile) && b.players.includes(profile!.name);

            return (
              <div
                key={b.id}
                onClick={() => onSelectBooking(b.id)}
                className="rounded-2xl bg-[#0D1017] border border-white/[0.08] hover:border-white/[0.2] transition-all p-5 flex flex-col justify-between cursor-pointer group hover:shadow-xl relative overflow-hidden"
              >
                <div>
                  {/* Top status */}
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                      {b.format} Match
                    </span>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold border ${
                        b.status === 'open'
                          ? 'bg-[#CEFF00]/10 text-[#CEFF00] border-[#CEFF00]/30'
                          : b.status === 'full'
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                          : 'bg-white/5 text-white/40 border-white/10'
                      }`}
                    >
                      {b.status === 'open'
                        ? `${spotsOpen} Spot${spotsOpen > 1 ? 's' : ''} Open`
                        : b.status === 'full'
                        ? 'Full · Ready to Play'
                        : 'Completed'}
                    </span>
                  </div>

                  {/* Court Title */}
                  <h3 className="text-lg font-semibold text-white group-hover:text-[#CEFF00] transition-colors leading-snug">
                    {b.court}
                  </h3>

                  {/* Schedule details */}
                  <div className="mt-3 space-y-1.5 text-xs text-white/50">
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-white/40 shrink-0" />
                      <span>
                        {b.time} · {formatDateLabel(b.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={13} className="text-white/40 shrink-0" />
                      <span>
                        Organizer: <strong>{b.createdBy}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Player Slot Visualizer */}
                  <div className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <div className="text-[10px] font-mono uppercase text-white/40 mb-2">
                      Roster ({b.players.length}/{b.slotsTotal})
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {b.players.map((p, pIdx) => {
                        const photo = getPlayerPhoto(p);
                        return (
                          <div
                            key={pIdx}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141824] border border-white/[0.08] text-xs text-white"
                          >
                            <div className="w-4 h-4 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                              {photo ? (
                                <img src={photo} alt="" className="w-full h-full object-cover" />
                              ) : (
                                p.charAt(0)
                              )}
                            </div>
                            <span className="truncate max-w-[80px]">{p}</span>
                          </div>
                        );
                      })}

                      {Array.from({ length: spotsOpen }).map((_, sIdx) => (
                        <div
                          key={`empty-${sIdx}`}
                          className="px-2.5 py-1 rounded-lg border border-dashed border-white/20 text-xs text-white/40 flex items-center gap-1"
                        >
                          <Plus size={11} />
                          <span>Open</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="font-mono text-white/80 font-semibold">
                    {b.fee > 0 ? `₹${b.fee} / player` : 'Free Court'}
                  </span>

                  <span className="font-semibold text-white/90 group-hover:text-[#CEFF00] flex items-center gap-1 transition-colors">
                    {b.status === 'full' && !b.matchId ? (
                      <>
                        <Zap size={13} className="text-[#CEFF00]" />
                        <span>Launch Match →</span>
                      </>
                    ) : isUserJoined ? (
                      <span className="text-emerald-400">You're Playing →</span>
                    ) : (
                      <span>View Court →</span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reserve Court Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-[#0D1017] border border-white/[0.12] p-6 sm:p-7 shadow-2xl relative">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <CalendarDays size={18} className="text-cyan-400" />
                <h2 className="text-lg font-display font-bold text-white">Reserve Badminton Court</h2>
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
                  Select Court
                </label>
                <select
                  value={court}
                  onChange={e => setCourt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141824] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#CEFF00]/50"
                >
                  <option value="Court 1 · Main Glass Arena">Court 1 · Main Glass Arena</option>
                  <option value="Court 2 · Synthetic Volt">Court 2 · Synthetic Volt</option>
                  <option value="Court 3 · Oak Parquet">Court 3 · Oak Parquet</option>
                  <option value="Court 4 · Training Bay">Court 4 · Training Bay</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141824] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#CEFF00]/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">Format</label>
                  <select
                    value={format}
                    onChange={e => setFormat(e.target.value as MatchFormat)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141824] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#CEFF00]/50"
                  >
                    <option value="Doubles">Doubles (4 Players)</option>
                    <option value="Singles">Singles (2 Players)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">
                    Cost / Player (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    placeholder="0"
                    value={fee}
                    onChange={e => setFee(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141824] border border-white/[0.08] text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#CEFF00]/50"
                  />
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
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
