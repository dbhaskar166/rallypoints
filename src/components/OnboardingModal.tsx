import React, { useState, useRef } from 'react';
import { fileToDataUrl } from '../utils/image';
import { Sparkles, Upload, Zap, MessageCircle } from 'lucide-react';

interface OnboardingModalProps {
  onComplete: (name: string, photoUrl: string | null) => void;
  onOpenPhoneLogin?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete, onOpenPhoneLogin }) => {
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const dataUrl = await fileToDataUrl(file);
      setPhotoUrl(dataUrl);
    } catch {
      alert('Could not process photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onComplete(name.trim(), photoUrl.trim() || null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0D1017] border border-white/[0.14] p-6 sm:p-7 shadow-2xl relative text-center space-y-4">
        {/* Glow */}
        <div className="w-14 h-14 rounded-2xl bg-[#CEFF00]/10 border border-[#CEFF00]/30 flex items-center justify-center text-3xl mx-auto shadow-[0_0_25px_rgba(206,255,0,0.15)]">
          🏸
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#CEFF00] font-semibold">
            <Sparkles size={13} />
            <span>Welcome to the Club</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
            RallyPoint Badminton
          </h2>
          <p className="text-xs text-white/60 max-w-xs mx-auto">
            Sign in with WhatsApp OTP or set up your player display profile to start playing.
          </p>
        </div>

        {/* WhatsApp Login CTA */}
        {onOpenPhoneLogin && (
          <div className="pt-1">
            <button
              type="button"
              onClick={onOpenPhoneLogin}
              className="w-full py-3 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(37,211,102,0.25)]"
            >
              <MessageCircle size={16} />
              <span>Login with Phone (WhatsApp OTP)</span>
            </button>

            <div className="flex items-center gap-3 my-3 text-[10px] font-mono uppercase text-white/30">
              <div className="flex-1 h-px bg-white/10" />
              <span>or enter player profile</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5">Player Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Vikram Patel"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#141824] border border-white/[0.1] text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#CEFF00]/60"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-white/70">
                Player Photo
              </label>
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
                className="text-xs text-[#CEFF00] hover:underline flex items-center gap-1 font-semibold"
              >
                <Upload size={12} />
                <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5 mb-2">
              {sampleAvatars.map((src, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setPhotoUrl(src)}
                  className={`w-11 h-11 rounded-2xl overflow-hidden border transition-all ${
                    photoUrl === src
                      ? 'border-[#CEFF00] scale-105 ring-2 ring-[#CEFF00]/40'
                      : 'border-white/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}

              {photoUrl && !sampleAvatars.includes(photoUrl) && (
                <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-[#CEFF00] ring-2 ring-[#CEFF00]/40">
                  <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <input
              type="url"
              placeholder="Or paste photo URL: https://..."
              value={photoUrl}
              onChange={e => setPhotoUrl(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#141824] border border-white/[0.08] text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#CEFF00]/50"
            />
          </div>

          {/* Welcome Notice */}
          <div className="p-3 rounded-2xl bg-[#CEFF00]/5 border border-[#CEFF00]/20 flex items-center gap-2 text-xs text-[#CEFF00]">
            <Zap size={14} className="shrink-0" />
            <span>Instant access enabled for all tournaments, court bookings, and live scoring.</span>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 rounded-xl bg-[#CEFF00] hover:bg-[#b8e000] disabled:opacity-40 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(206,255,0,0.25)]"
          >
            <span>Enter RallyPoint Arena</span>
          </button>
        </form>
      </div>
    </div>
  );
};
