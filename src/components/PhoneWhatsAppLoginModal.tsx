import React, { useState, useEffect, useRef } from 'react';
import {
  POPULAR_COUNTRY_CODES,
  sendWhatsAppOtp,
  verifyWhatsAppOtp,
  normalizePhoneNumber,
  CountryCode,
} from '../utils/whatsappAuth';
import {
  Phone,
  ShieldCheck,
  Check,
  X,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  MessageCircle,
  Lock,
  ChevronDown,
} from 'lucide-react';

interface PhoneWhatsAppLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName?: string;
  currentPhotoUrl?: string | null;
  onLoginSuccess: (name: string, phone: string, photoUrl: string | null) => void;
}

export const PhoneWhatsAppLoginModal: React.FC<PhoneWhatsAppLoginModalProps> = ({
  isOpen,
  onClose,
  currentName = '',
  currentPhotoUrl = null,
  onLoginSuccess,
}) => {
  const [step, setStep] = useState<'input' | 'otp' | 'success'>('input');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(POPULAR_COUNTRY_CODES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [playerName, setPlayerName] = useState(currentName || '');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [whatsAppUrl, setWhatsAppUrl] = useState('');
  const [deliveredOtp, setDeliveredOtp] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showSimulatedBanner, setShowSimulatedBanner] = useState(false);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setPhoneNumber('');
      setPlayerName(currentName || '');
      setOtpDigits(['', '', '', '', '', '']);
      setErrorMsg(null);
      setDeliveredOtp(null);
      setShowSimulatedBanner(false);
    }
  }, [isOpen, currentName]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length < 7) {
      setErrorMsg('Please enter a valid mobile phone number.');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      const { session, whatsAppUrl } = sendWhatsAppOtp(selectedCountry.code, cleanNumber);
      setWhatsAppUrl(whatsAppUrl);
      setDeliveredOtp(session.otp);
      setResendCooldown(30);
      setStep('otp');
      setShowSimulatedBanner(true);

      // Auto focus first OTP input
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    } catch {
      setErrorMsg('Failed to dispatch WhatsApp OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Handle paste of complete 6-digit code
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6);
      if (pasted.length > 0) {
        const newDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = pasted[i] || '';
        }
        setOtpDigits(newDigits);
        const focusIdx = Math.min(pasted.length, 5);
        otpInputsRef.current[focusIdx]?.focus();

        if (pasted.length === 6) {
          triggerVerify(pasted);
        }
      }
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);
    setErrorMsg(null);

    // Auto-advance
    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto-verify when 6th digit entered
    if (digit && index === 5) {
      const fullOtp = newDigits.join('');
      if (fullOtp.length === 6) {
        triggerVerify(fullOtp);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const triggerVerify = (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length < 6) {
      setErrorMsg('Please enter all 6 digits of the OTP.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const result = verifyWhatsAppOtp(selectedCountry.code, phoneNumber, code);
    setIsLoading(false);

    if (result.success) {
      setStep('success');
      const verifiedFullPhone = normalizePhoneNumber(selectedCountry.code, phoneNumber);
      const finalName = playerName.trim() || `Player ${phoneNumber.slice(-4)}`;

      setTimeout(() => {
        onLoginSuccess(finalName, verifiedFullPhone, currentPhotoUrl);
        onClose();
      }, 1200);
    } else {
      setErrorMsg(result.error || 'Invalid verification code. Please check your WhatsApp.');
    }
  };

  const handleAutoFillOtp = () => {
    if (!deliveredOtp) return;
    const digits = deliveredOtp.split('');
    setOtpDigits(digits);
    triggerVerify(deliveredOtp);
  };

  const handleResend = () => {
    if (resendCooldown > 0) return;
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const { session, whatsAppUrl } = sendWhatsAppOtp(selectedCountry.code, cleanNumber);
    setWhatsAppUrl(whatsAppUrl);
    setDeliveredOtp(session.otp);
    setResendCooldown(30);
    setOtpDigits(['', '', '', '', '', '']);
    setErrorMsg(null);
    setShowSimulatedBanner(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md rounded-3xl bg-[#0D1017] border border-white/[0.12] p-6 sm:p-7 shadow-2xl relative space-y-5">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/60 hover:text-white flex items-center justify-center transition-colors absolute top-5 right-5 z-20"
        >
          <X size={16} />
        </button>

        {/* WhatsApp Brand Badge & Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#25D366]/15 border border-[#25D366]/40 flex items-center justify-center text-[#25D366] mx-auto shadow-[0_0_25px_rgba(37,211,102,0.2)]">
            <MessageCircle size={28} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 text-[10px] font-mono uppercase tracking-wider font-bold mb-1">
              <span>WhatsApp Official OTP</span>
            </div>
            <h2 className="text-xl font-display font-bold text-white tracking-tight">
              {step === 'input' && 'Sign In with Phone'}
              {step === 'otp' && 'Verify WhatsApp Code'}
              {step === 'success' && 'Verified Successfully!'}
            </h2>
            <p className="text-xs text-white/60 max-w-xs mx-auto mt-1">
              {step === 'input' &&
                'Enter your mobile number to receive a secure 6-digit one-time password on WhatsApp.'}
              {step === 'otp' &&
                `We've sent a 6-digit code via WhatsApp to ${selectedCountry.code} ${phoneNumber}`}
              {step === 'success' && 'Your phone number is verified. Syncing profile...'}
            </p>
          </div>
        </div>

        {/* STEP 1: Enter Phone Number & Name */}
        {step === 'input' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                Player / Member Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Diwakar Bhaskar"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#141824] border border-white/[0.1] text-xs font-medium text-white placeholder:text-white/30 focus:outline-none focus:border-[#25D366]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                WhatsApp Mobile Number
              </label>
              <div className="flex gap-2">
                {/* Country Code Picker */}
                <div className="relative shrink-0 w-32">
                  <select
                    value={selectedCountry.code}
                    onChange={e => {
                      const found = POPULAR_COUNTRY_CODES.find(c => c.code === e.target.value);
                      if (found) setSelectedCountry(found);
                    }}
                    className="w-full appearance-none pl-3 pr-7 py-2.5 rounded-xl bg-[#141824] border border-white/[0.1] text-xs font-semibold text-white focus:outline-none focus:border-[#25D366] cursor-pointer"
                  >
                    {POPULAR_COUNTRY_CODES.map(c => (
                      <option key={`${c.country}-${c.code}`} value={c.code} className="bg-[#141824] text-white">
                        {c.flag} {c.code} ({c.country})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="text-white/40 absolute right-2.5 top-3 pointer-events-none" />
                </div>

                {/* Local Phone Number */}
                <div className="relative flex-1">
                  <Phone size={14} className="text-white/40 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    autoFocus
                    placeholder={selectedCountry.format}
                    value={phoneNumber}
                    onChange={e => {
                      setPhoneNumber(e.target.value);
                      setErrorMsg(null);
                    }}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#141824] border border-white/[0.1] text-xs font-semibold text-white placeholder:text-white/30 focus:outline-none focus:border-[#25D366]"
                  />
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(37,211,102,0.25)]"
            >
              <MessageCircle size={16} />
              <span>{isLoading ? 'Connecting to WhatsApp...' : 'Send OTP on WhatsApp'}</span>
              <ArrowRight size={15} />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/40 font-mono">
              <Lock size={12} className="text-[#25D366]" />
              <span>Instant end-to-end encrypted dispatch</span>
            </div>
          </form>
        )}

        {/* STEP 2: Enter 6-Digit OTP */}
        {step === 'otp' && (
          <div className="space-y-4">
            {/* Interactive WhatsApp Simulated Message Notification Banner */}
            {showSimulatedBanner && deliveredOtp && (
              <div className="p-3 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 text-left space-y-2 animate-fadeIn shadow-lg">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#25D366]">
                  <div className="flex items-center gap-1.5">
                    <MessageCircle size={14} />
                    <span>WhatsApp Delivery Notification</span>
                  </div>
                  <span className="text-[10px] font-mono text-white/50">Just now</span>
                </div>
                <div className="p-2 rounded-xl bg-black/40 text-xs font-mono text-white/90">
                  🏸 RallyPoint Login Code: <strong className="text-[#25D366] text-sm tracking-wider">{deliveredOtp}</strong>
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#25D366] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <ExternalLink size={12} />
                    <span>Open in WhatsApp</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleAutoFillOtp}
                    className="px-2.5 py-1 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-black font-bold text-[11px] transition-colors"
                  >
                    Auto-Fill Code
                  </button>
                </div>
              </div>
            )}

            {/* 6 Digit Input Boxes */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-white/70 text-center">
                Enter 6-Digit Verification Code
              </label>
              <div className="flex justify-between gap-1.5 sm:gap-2">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => {
                      otpInputsRef.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(index, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(index, e)}
                    className="w-11 h-12 sm:w-12 sm:h-14 rounded-2xl bg-[#141824] border-2 border-white/[0.12] focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/30 text-center text-lg sm:text-xl font-bold font-mono text-white focus:outline-none transition-all shadow-inner"
                  />
                ))}
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center">
                {errorMsg}
              </div>
            )}

            <button
              type="button"
              onClick={() => triggerVerify()}
              disabled={isLoading || otpDigits.join('').length < 6}
              className="w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] disabled:opacity-40 disabled:hover:bg-[#25D366] active:scale-[0.98] text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(37,211,102,0.25)]"
            >
              <ShieldCheck size={16} />
              <span>{isLoading ? 'Verifying OTP...' : 'Verify & Continue'}</span>
            </button>

            {/* Actions: Resend / Edit Number */}
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="text-white/50 hover:text-white transition-colors"
              >
                ← Edit Number
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="text-xs font-semibold text-[#25D366] disabled:text-white/30 flex items-center gap-1 transition-colors"
              >
                <RefreshCw size={12} className={resendCooldown > 0 ? '' : 'animate-spin-slow'} />
                <span>
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend WhatsApp OTP'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Success Screen */}
        {step === 'success' && (
          <div className="py-6 text-center space-y-3 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-[#25D366]/20 border-2 border-[#25D366] flex items-center justify-center text-[#25D366] mx-auto shadow-[0_0_30px_rgba(37,211,102,0.3)]">
              <Check size={32} />
            </div>
            <h3 className="text-lg font-display font-bold text-white">Login Confirmed</h3>
            <p className="text-xs text-white/60 font-mono">
              Verified phone: {normalizePhoneNumber(selectedCountry.code, phoneNumber)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
