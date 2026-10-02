import React, { useState, useRef } from 'react';
import { fileToDataUrl, PRESET_AVATARS } from '../utils/image';
import { Camera, Upload, Trash2, X, Check, Image as ImageIcon } from 'lucide-react';

interface PlayerPhotoModalProps {
  isOpen: boolean;
  playerName: string;
  currentPhoto: string | null;
  onClose: () => void;
  onSavePhoto: (playerName: string, photoUrl: string | null) => void;
}

export const PlayerPhotoModal: React.FC<PlayerPhotoModalProps> = ({
  isOpen,
  playerName,
  currentPhoto,
  onClose,
  onSavePhoto,
}) => {
  const [photoUrl, setPhotoUrl] = useState<string>(currentPhoto || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const dataUrl = await fileToDataUrl(file, 300, 300);
      setPhotoUrl(dataUrl);
    } catch (err) {
      alert('Could not process image file. Please try another image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    onSavePhoto(playerName, photoUrl.trim() || null);
    onClose();
  };

  const handleRemove = () => {
    setPhotoUrl('');
    onSavePhoto(playerName, null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm rounded-3xl bg-[#0D1017] border border-white/[0.14] p-6 shadow-2xl relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-[#CEFF00]" />
            <h3 className="text-base font-display font-bold text-white">Player Photo</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/60 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Player preview */}
        <div className="flex flex-col items-center gap-2 py-2">
          <div className="relative">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-[#141824] border-2 border-white/[0.15] overflow-hidden flex items-center justify-center text-4xl font-bold text-[#CEFF00] shadow-xl">
              {photoUrl ? (
                <img src={photoUrl} alt={playerName} className="w-full h-full object-cover" />
              ) : (
                playerName.charAt(0).toUpperCase()
              )}
            </div>

            {photoUrl && (
              <button
                type="button"
                onClick={() => setPhotoUrl('')}
                className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md hover:bg-rose-600 transition-colors"
                title="Clear photo"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="text-sm font-semibold text-white">{playerName}</div>
          <span className="text-[11px] text-white/40">Visible across court diagrams and scoreboard</span>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-1">
          {/* Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Upload size={14} className="text-[#CEFF00]" />
            <span>{isProcessing ? 'Processing Image...' : 'Upload from Device'}</span>
          </button>

          {/* Paste URL */}
          <div>
            <label className="block text-[11px] font-medium text-white/60 mb-1">
              Or Paste Image Web URL
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={photoUrl}
              onChange={e => setPhotoUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#141824] border border-white/[0.08] text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#CEFF00]/50"
            />
          </div>

          {/* Presets */}
          <div>
            <span className="block text-[10px] font-mono text-white/40 mb-1.5 uppercase">
              Club Avatar Presets
            </span>
            <div className="flex items-center gap-2.5 justify-center">
              {PRESET_AVATARS.map((src, idx) => (
                <button
                  key={idx}
                  type="button"
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
        </div>

        {/* Footer Buttons */}
        <div className="pt-2 flex items-center gap-2">
          {currentPhoto && (
            <button
              type="button"
              onClick={handleRemove}
              className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-colors flex items-center justify-center"
              title="Remove photo"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-[#CEFF00] hover:bg-[#b8e000] text-black text-xs font-bold transition-all shadow-[0_0_15px_rgba(206,255,0,0.2)]"
          >
            Apply Photo
          </button>
        </div>
      </div>
    </div>
  );
};
