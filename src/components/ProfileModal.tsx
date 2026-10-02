import React, { useState, useRef } from 'react';
import { UserProfile, UserWallet } from '../types';
import { fileToDataUrl } from '../utils/image';
import { User, Check, X, Shield, Camera, Upload } from 'lucide-react';

interface ProfileModalProps {
  profile: UserProfile | null;
  wallet: UserWallet;
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, photoUrl: string | null) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  wallet,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(profile?.name || '');
  const [photoUrl, setPhotoUrl] = useState(profile?.photoUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      <div className="w-full max-w-md rounded-3xl bg-[#0D1017] border border-white/[0.12] p-6 sm:p-7 shadow-2xl relative">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <User size={18} className="text-[#CEFF00]" />
            <h2 className="text-lg font-display font-bold text-white">Player Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/60 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center gap-2 pb-2">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-[#141824] border-2 border-white/[0.15] overflow-hidden flex items-center justify-center text-4xl font-bold text-[#CEFF00] relative shadow-xl">
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
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/[0.08]"
            >
              <Upload size={14} className="text-[#CEFF00]" />
              <span>{isUploading ? 'Loading...' : 'Upload Photo from Device'}</span>
            </button>

            {/* Quick avatar selection */}
            <div className="flex items-center gap-2.5 mt-2">
              {sampleAvatars.map((src, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setPhotoUrl(src)}
                  className={`w-10 h-10 rounded-2xl overflow-hidden border transition-all ${
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

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5">
              Photo URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={photoUrl}
              onChange={e => setPhotoUrl(e.target.value)}
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
              className="flex-1 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-[#CEFF00] hover:bg-[#b8e000] text-black text-xs font-semibold transition-all shadow-[0_0_15px_rgba(206,255,0,0.2)]"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
