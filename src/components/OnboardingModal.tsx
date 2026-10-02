import React, { useState, useRef } from 'react';
import { fileToDataUrl } from '../utils/image';
import { User, Zap, Sparkles, Upload } from 'lucide-react';

interface OnboardingModalProps {
  onComplete: (name: string, photoUrl: string | null) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
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
      <div className="w-full max-w-md rounded-3xl bg-[#0D1017] border border-white/[0.14] p-7 shadow-2xl relative text-center space-y-5">
        {/* Glow */}
        <div className="w-16 h-16 rounded-2xl bg-[#CEFF00]/10 border border-[#CEFF00]/30 flex items-center justify-center text-3xl mx-auto shadow-[0_0_30px_rgba(206,255,0,0.15)]">
          🏸
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#CEFF00] font-semibold">
            <Sparkles size={13} />
            <span>Welcome to the Club</span>
          </div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight">
            RallyPoint Dark
          </h2>
          <p className="text-xs text-white/60 max-w-xs mx-auto">
            Set up your player profile to join tournaments, book courts, and track your match history.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5">Your Name</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Priya Sharma"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#141824] border border-white/[0.1] text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#CEFF00]/60"
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
                <span>{isUploading ? 'Uploading...' : 'Upload from Device'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5 mb-2.5">
              {sampleAvatars.map((src, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setPhotoUrl(src)}
                  className={`w-12 h-12 rounded-2xl overflow-hidden border transition-all ${
                    photoUrl === src
                      ? 'border-[#CEFF00] scale-105 ring-2 ring-[#CEFF00]/40'
                      : 'border-white/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}

              {photoUrl && !sampleAvatars.includes(photoUrl) && (
                <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-[#CEFF00] ring-2 ring-[#CEFF00]/40">
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

          {/* Welcome Bonus Notice */}
          <div className="p-3.5 rounded-2xl bg-[#CEFF00]/5 border border-[#CEFF00]/20 flex items-center gap-2.5 text-xs text-[#CEFF00]">
            <Zap size={15} className="shrink-0" />
            <span>Includes <strong>₹500</strong> complimentary welcome wallet credit for tournament entries!</span>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3.5 rounded-xl bg-[#CEFF00] hover:bg-[#b8e000] disabled:opacity-40 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(206,255,0,0.25)]"
          >
            <span>Enter RallyPoint Arena</span>
          </button>
        </form>
      </div>
    </div>
  );
};
