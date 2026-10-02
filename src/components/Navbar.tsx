import React from 'react';
import { UserProfile, UserWallet } from '../types';
import { Trophy, CalendarDays, Activity, Wallet, User, Zap } from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'tournaments' | 'bookings' | 'scoring' | 'wallet';
  onSelectTab: (tab: 'dashboard' | 'tournaments' | 'bookings' | 'scoring' | 'wallet') => void;
  profile: UserProfile | null;
  wallet: UserWallet;
  onOpenProfile: () => void;
  liveMatchesCount: number;
}

interface NavItem {
  key: 'dashboard' | 'tournaments' | 'bookings' | 'scoring' | 'wallet';
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  profile,
  wallet,
  onOpenProfile,
  liveMatchesCount,
}) => {
  const navItems: NavItem[] = [
    { key: 'dashboard', label: 'Dashboard', icon: Activity, badge: null },
    { key: 'tournaments', label: 'Tournaments', icon: Trophy, badge: null },
    { key: 'bookings', label: 'Bookings', icon: CalendarDays, badge: null },
    {
      key: 'scoring',
      label: 'Live Scoring',
      icon: Zap,
      badge: liveMatchesCount > 0 ? liveMatchesCount : null,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#08090C]/85 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-[#121620] border border-white/[0.12] flex items-center justify-center text-[#CEFF00] shadow-[0_0_15px_rgba(206,255,0,0.12)] group-hover:border-[#CEFF00]/40 transition-colors">
              <span className="text-lg">🏸</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold tracking-tight text-white group-hover:text-[#CEFF00] transition-colors leading-none">
                RALLYPOINT
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-white/40 mt-1">
                Badminton Pro
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          {navItems.map(item => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onSelectTab(item.key)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 relative whitespace-nowrap ${
                  isActive
                    ? 'text-white bg-white/[0.08] border border-white/[0.12] shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <item.icon
                  size={15}
                  className={isActive ? 'text-[#CEFF00]' : 'text-white/50'}
                />
                <span>{item.label}</span>
                {item.badge !== null && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-mono-numbers font-bold bg-[#CEFF00] text-black rounded-full leading-tight">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Profile Button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:border-white/[0.2] transition-all text-xs text-white group"
            title="Player Profile"
          >
            {profile?.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={profile.name}
                className="w-7 h-7 rounded-lg object-cover border border-white/20"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-[#181F2C] border border-white/[0.1] text-xs font-bold text-[#CEFF00] flex items-center justify-center">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : <User size={13} />}
              </div>
            )}
            <span className="font-medium text-xs text-white/80 group-hover:text-white truncate max-w-[90px] hidden sm:inline">
              {profile?.name || 'Set Name'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Sub-Nav (Pattern 1 from Mobile Reference) */}
      <div className="md:hidden flex items-center justify-around border-t border-white/[0.06] bg-[#0A0C11] py-2 px-2">
        {navItems.map(item => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelectTab(item.key)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors relative min-w-[54px] ${
                isActive ? 'text-[#CEFF00]' : 'text-white/50 hover:text-white'
              }`}
            >
              <item.icon size={17} className={isActive ? 'text-[#CEFF00]' : 'text-white/50'} />
              <span className="mt-1 tracking-tight">{item.label}</span>
              {item.badge !== null && (
                <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-[#CEFF00]" />
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
