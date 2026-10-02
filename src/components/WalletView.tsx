import React, { useState } from 'react';
import { UserProfile, UserWallet } from '../types';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  ShieldCheck,
  CreditCard,
  Zap,
} from 'lucide-react';

interface WalletViewProps {
  wallet: UserWallet;
  profile: UserProfile | null;
  onAddFunds: (amount: number, note?: string) => void;
}

export const WalletView: React.FC<WalletViewProps> = ({ wallet, profile, onAddFunds }) => {
  const [customAmount, setCustomAmount] = useState('');
  const [filter, setFilter] = useState<'All' | 'credit' | 'debit'>('All');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const quickAmounts = [100, 250, 500, 1000, 2000];

  const handleTopUp = (amount: number) => {
    if (amount <= 0) return;
    onAddFunds(amount, 'Club Wallet Top-Up');
    setCustomAmount('');
    setSuccessMessage(`Successfully added ₹${amount} to your Club Wallet!`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const filteredTx = wallet.transactions.filter(tx => {
    if (filter === 'All') return true;
    return tx.type === filter;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
          Club Wallet & Passes
        </h1>
        <p className="text-xs text-white/50 mt-1">
          Private player balance for tournament entry fees and arena reservations
        </p>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-[#CEFF00]/10 border border-[#CEFF00]/30 text-[#CEFF00] text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <ShieldCheck size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Digital Member Card & Balance Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Digital Obsidian Membership Card (Fintech vibe) */}
        <div className="md:col-span-2 rounded-3xl bg-gradient-to-br from-[#131824] via-[#0E121B] to-[#080A0F] border border-white/[0.12] p-7 flex flex-col justify-between shadow-2xl relative overflow-hidden min-h-[220px]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#CEFF00]/[0.04] rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-cyan-500/[0.04] rounded-full blur-2xl pointer-events-none" />

          {/* Card Top */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#CEFF00] text-black flex items-center justify-center font-bold text-sm">
                🏸
              </div>
              <span className="font-display font-bold text-sm tracking-wider text-white uppercase">
                RallyPoint Club Pass
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Active Member</span>
            </div>
          </div>

          {/* Balance Display */}
          <div className="my-6 relative z-10">
            <div className="text-[11px] font-mono uppercase tracking-widest text-white/50">
              Available Balance
            </div>
            <div className="font-display text-4xl sm:text-5xl font-bold font-mono-numbers text-white tracking-tight mt-1 flex items-baseline gap-2">
              <span className="text-[#CEFF00]">₹</span>
              <span>{wallet.balance.toFixed(2)}</span>
            </div>
          </div>

          {/* Card Bottom */}
          <div className="flex items-center justify-between text-xs text-white/60 pt-4 border-t border-white/[0.07] relative z-10">
            <div>
              <span className="text-[10px] uppercase font-mono text-white/40 block">Cardholder</span>
              <span className="font-semibold text-white">{profile?.name || 'Club Member'}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-mono text-white/40 block">Secured</span>
              <span className="font-mono text-white/80">Local Vault</span>
            </div>
          </div>
        </div>

        {/* Quick Top-Up Panel */}
        <div className="rounded-3xl bg-[#0D1017] border border-white/[0.08] p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-white mb-2">
              <Plus size={15} className="text-[#CEFF00]" />
              <span>Instant Top-Up</span>
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed mb-4">
              Select an instant reload amount or enter a custom sum.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {quickAmounts.slice(0, 4).map(amt => (
                <button
                  key={amt}
                  onClick={() => handleTopUp(amt)}
                  className="py-2.5 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] active:scale-[0.98] border border-white/[0.08] hover:border-white/[0.18] text-xs font-mono font-semibold text-white transition-all text-center"
                >
                  +₹{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount Form */}
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-white/40">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="10"
                  placeholder="Custom"
                  value={customAmount}
                  onChange={e => setCustomAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 rounded-xl bg-[#141824] border border-white/[0.08] text-white text-xs font-mono focus:outline-none focus:border-[#CEFF00]/50"
                />
              </div>
              <button
                disabled={!customAmount || Number(customAmount) <= 0}
                onClick={() => handleTopUp(Number(customAmount))}
                className="px-4 py-2 rounded-xl bg-[#CEFF00] hover:bg-[#b8e000] disabled:opacity-40 text-black text-xs font-semibold transition-all shadow-[0_0_12px_rgba(206,255,0,0.15)]"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="rounded-3xl bg-[#0D1017] border border-white/[0.08] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-display font-bold text-white tracking-tight">
              Transaction History
            </h2>
            <p className="text-xs text-white/50">Complete audit log of credits and debits</p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl self-start sm:self-auto">
            {(['All', 'credit', 'debit'] as const).map(st => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                  filter === st
                    ? 'bg-white/[0.1] text-white shadow-sm'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {st === 'All' ? 'All Records' : st === 'credit' ? 'Credits' : 'Debits'}
              </button>
            ))}
          </div>
        </div>

        {filteredTx.length === 0 ? (
          <div className="text-center py-8 text-xs text-white/40">
            No transaction records found matching your filter.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {filteredTx.map(tx => {
              const isCredit = tx.type === 'credit';
              const dateObj = new Date(tx.date);
              const formattedDate = dateObj.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isCredit
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {isCredit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{tx.note}</div>
                      <div className="text-[10px] font-mono text-white/40">{formattedDate}</div>
                    </div>
                  </div>

                  <div
                    className={`font-mono font-bold text-sm font-mono-numbers shrink-0 ${
                      isCredit ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isCredit ? '+' : '−'}₹{tx.amount.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transparency Note */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-start gap-3 text-xs text-white/50">
        <ShieldCheck size={16} className="text-[#CEFF00] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Your wallet transactions and balance are stored securely on your device. Tournaments and court bookings are synchronized with all members of the badminton club.
        </p>
      </div>
    </div>
  );
};
