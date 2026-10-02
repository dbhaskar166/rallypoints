export interface CountryCode {
  country: string;
  code: string;
  flag: string;
  format: string;
}

export const POPULAR_COUNTRY_CODES: CountryCode[] = [
  { country: 'India', code: '+91', flag: '🇮🇳', format: '98765 43210' },
  { country: 'United States', code: '+1', flag: '🇺🇸', format: '202 555 0123' },
  { country: 'United Kingdom', code: '+44', flag: '🇬🇧', format: '7911 123456' },
  { country: 'Malaysia', code: '+60', flag: '🇲🇾', format: '12 345 6789' },
  { country: 'Singapore', code: '+65', flag: '🇸🇬', format: '8123 4567' },
  { country: 'Indonesia', code: '+62', flag: '🇮🇩', format: '812 3456 7890' },
  { country: 'United Arab Emirates', code: '+971', flag: '🇦🇪', format: '50 123 4567' },
  { country: 'Australia', code: '+61', flag: '🇦🇺', format: '412 345 678' },
  { country: 'Canada', code: '+1', flag: '🇨🇦', format: '416 555 0123' },
  { country: 'Germany', code: '+49', flag: '🇩🇪', format: '151 12345678' },
  { country: 'Japan', code: '+81', flag: '🇯🇵', format: '90 1234 5678' },
];

export interface OtpSession {
  phoneNumber: string;
  countryCode: string;
  otp: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  verified: boolean;
}

// In-memory active session map (keyed by normalized phone)
const activeSessions: Record<string, OtpSession> = {};

/**
 * Normalizes phone number into international E.164 digits-only format
 */
export function normalizePhoneNumber(countryCode: string, localNumber: string): string {
  const cleanCode = countryCode.replace(/\D/g, '');
  const cleanNumber = localNumber.replace(/\D/g, '');
  return `+${cleanCode}${cleanNumber}`;
}

/**
 * Generates a random 6-digit verification code
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Initiates WhatsApp OTP delivery for a given phone number
 */
export function sendWhatsAppOtp(
  countryCode: string,
  localNumber: string
): {
  session: OtpSession;
  whatsAppUrl: string;
  messageText: string;
} {
  const fullPhone = normalizePhoneNumber(countryCode, localNumber);
  const cleanDigits = fullPhone.replace(/\D/g, '');
  const otp = generateOtp();
  const now = Date.now();
  const expiresAt = now + 5 * 60 * 1000; // 5-minute validity

  const session: OtpSession = {
    phoneNumber: fullPhone,
    countryCode,
    otp,
    createdAt: now,
    expiresAt,
    attempts: 0,
    verified: false,
  };

  activeSessions[fullPhone] = session;

  const messageText = `🏸 *RallyPoint Badminton Club Security Verification*\n\nYour WhatsApp login code is: *${otp}*\n\nValid for 5 minutes. Please do not share this code with anyone. Enjoy your match!`;
  const encodedText = encodeURIComponent(messageText);

  // Direct WhatsApp API deep link (opens WhatsApp Web on desktop or WhatsApp App on mobile)
  const whatsAppUrl = `https://api.whatsapp.com/send?phone=${cleanDigits}&text=${encodedText}`;

  return {
    session,
    whatsAppUrl,
    messageText,
  };
}

/**
 * Validates the user-submitted OTP
 */
export function verifyWhatsAppOtp(
  countryCode: string,
  localNumber: string,
  enteredOtp: string
): { success: boolean; error?: string } {
  const fullPhone = normalizePhoneNumber(countryCode, localNumber);
  const session = activeSessions[fullPhone];

  if (!session) {
    return { success: false, error: 'No active verification session found. Please request a new OTP.' };
  }

  if (Date.now() > session.expiresAt) {
    delete activeSessions[fullPhone];
    return { success: false, error: 'This verification code has expired. Please request a new code.' };
  }

  if (session.attempts >= 5) {
    delete activeSessions[fullPhone];
    return { success: false, error: 'Too many incorrect attempts. Please request a new OTP.' };
  }

  session.attempts++;

  if (session.otp.trim() === enteredOtp.trim()) {
    session.verified = true;
    return { success: true };
  }

  return { success: false, error: 'Incorrect verification code. Please check your WhatsApp and try again.' };
}

/**
 * Returns currently stored active OTP session for testing/preview assistance
 */
export function getActiveSession(countryCode: string, localNumber: string): OtpSession | null {
  const fullPhone = normalizePhoneNumber(countryCode, localNumber);
  return activeSessions[fullPhone] || null;
}
