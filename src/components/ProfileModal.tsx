import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, UserWallet } from '../types';
import { fileToDataUrl } from '../utils/image';
import { User, X, Upload, MessageCircle, ShieldCheck, LogOut } from 'lucide-react';

interface ProfileModalProps {
  profile: UserProfile | null;
  wallet: UserWallet;
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, photoUrl: string | null) => void;
  onOpenPhoneLogin: () => void;
  onLogout?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  wallet,
  isOpen,
  onClose,
  onSave,
  onOpenPhoneLogin,
  onLogout,
}) => {
  const [name, setName] = useState(profile?.name || '');
  const [photoUrl, setPhotoUrl] = useState(profile?.photoUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(profile?.name || '');
      setPhotoUrl(profile?.photoUrl || '');
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const dataUrl = await fileToDataUrl(file);
      setPhotoUrl(dataUrl);
    } catch {
      alert('Could not load image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), photoUrl.trim() || null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0D1017] border border-white/[0.12] p-5 sm:p-7 shadow-2xl relative space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User size={18} className="text-[#CEFF00]" />
            <h2 className="text-lg font-display font-bold text-white">Player Profile</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/60 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* WhatsApp Phone Status Card */}
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white/80">
              <MessageCircle size={15} className="text-[#25D366]" />
              <span>WhatsApp Phone Authentication</span>
            </div>
            {profile?.phoneVerified && (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#25D366] bg-[#25D366]/10 px-2 py-0.5 rounded-full border border-[#25D366]/20">
                <ShieldCheck size={11} />
                <span>Verified</span>
              </span>
            )}
          </div>

          {profile?.phoneVerified && profile.phone ? (
            <div className="flex items-center justify-between text-xs bg-black/40 p-2.5 rounded-xl border border-white/[0.06]">
              <div>
                <span className="text-[10px] text-white/40 block font-mono">Linked Number</span>
                <span className="font-mono font-semibold text-white">{profile.phone}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPhoneLogin();
                }}
                className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white text-[11px] font-semibold transition-colors"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-black/40 p-2.5 rounded-xl border border-white/[0.06]">
              <span className="text-xs text-white/60">
                Link your phone to receive OTP verification codes on WhatsApp.
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPhoneLogin();
                }}
                className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-black text-xs font-bold shrink-0 transition-colors shadow-sm"
              >
                Link WhatsApp
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center gap-2 pb-1">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#141824] border-2 border-white/[0.15] overflow-hidden flex items-center justify-center text-4xl font-bold text-[#CEFF00] relative shadow-xl">
              {photoUrl ? (
                <img src={photoUrl} alt="" className="w-full h-full object-cover" />
              ) : name ? (
                name.charAt(0).toUpperCase()
              ) : (
                <User size={36} />
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/[0.08]"
            >
              <Upload size={13} className="text-[#CEFF00]" />
              <span>{isUploading ? 'Loading...' : 'Upload Photo'}</span>
            </button>

            {/* Quick avatar selection */}
            <div className="flex items-center gap-2 mt-1">
              {sampleAvatars.map((src, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setPhotoUrl(src)}
                  className={`w-9 h-9 rounded-xl overflow-hidden border transition-all ${
                    photoUrl === src
                      ? 'border-[#CEFF00] scale-105 ring-2 ring-[#CEFF00]/30'
                      : 'border-white/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5">
              Player Display Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Vikram Patel"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#141824] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#CEFF00]/50"
            />
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between text-xs">
            <span className="text-white/60">Wallet Pass Balance</span>
            <span className="font-mono font-bold text-[#CEFF00]">₹{wallet.balance.toFixed(2)}</span>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#CEFF00] hover:bg-[#b8e000] text-black text-xs font-semibold transition-all shadow-[0_0_15px_rgba(206,255,0,0.2)]"
            >
              Save Profile
            </button>
          </div>

          {onLogout && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="text-white/40 hover:text-rose-400 text-xs flex items-center justify-center gap-1.5 mx-auto transition-colors"
              >
                <LogOut size={13} />
                <span>Switch Player / Log Out</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
