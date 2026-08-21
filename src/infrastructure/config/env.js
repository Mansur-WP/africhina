export const appUrl =
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
export const resendApiKey = process.env.RESEND_API_KEY;
export const resendFromEmail =
  process.env.RESEND_FROM_EMAIL || 'no-reply@africhinaconnect.com';
export const sessionCookieName = 'sessionToken';
export const sessionDurationSeconds = 60 * 60 * 24 * 30; // 30 days
export const verificationTokenTTL = {
  emailVerification: 60 * 60 * 24,
  passwordReset: 60 * 60,
};
export const isProduction = process.env.NODE_ENV === 'production';

// Public contact channel used by the marketing landing page CTAs.
// NEXT_PUBLIC_WHATSAPP_NUMBER overrides the default; format is international
// digits with no leading "+" (e.g. 2348012345678).
export const whatsappNumber =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '2349038832095';
const whatsappMessage =
  'Hello Africhina Connect, I would like help sourcing a product from China.';
export const whatsappUrl = whatsappNumber
  ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`
  : '';

// Public contact details shown on the marketing landing page.
export const contact = {
  phonePrimary: '+234 903 883 2095',
  phoneSecondary: '+234 812 542 6076',
  email: 'info@africhinaconnect.com',
  address: 'Muhammadu Buhari Way, Along Kabuga, Gwale, Kano State, Nigeria',
};

// Public social profiles.
export const socialLinks = {
  instagram: 'https://instagram.com/africhina_connect_ltd',
  facebook: 'https://facebook.com/africhinaconnectltd',
  tiktok: 'https://tiktok.com/@africhina_connect_ltd',
};
