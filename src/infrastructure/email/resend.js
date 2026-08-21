import {
  appUrl,
  resendApiKey,
  resendFromEmail,
} from '@/src/infrastructure/config/env.js';

const RESEND_URL = 'https://api.resend.com/emails';

export async function sendEmail({ to, subject, html, text }) {
  if (!resendApiKey) {
    console.info('Send email fallback (no RESEND_API_KEY):', {
      to,
      subject,
      text,
      html,
    });
    return;
  }

  const response = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to,
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error('Resend email error:', body);
    throw new Error('Unable to send email');
  }
}

export async function sendVerificationEmail({ name, email, token }) {
  const verifyUrl = `${appUrl}/verify-email?token=${encodeURIComponent(token)}`;
  const subject = 'Africhina Connect — Verify your email';
  const text = `Hi ${name || 'there'},\n\nPlease verify your email by opening this link:\n${verifyUrl}\n\nIf you did not register, ignore this message.`;
  const html = `<p>Hi ${name || 'there'},</p><p>Please verify your email by clicking the link below:</p><p><a href="${verifyUrl}">Verify email</a></p><p>If you did not register, ignore this message.</p>`;

  await sendEmail({ to: email, subject, text, html });
}

export async function sendPasswordResetEmail({ name, email, token }) {
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const subject = 'Africhina Connect — Reset your password';
  const text = `Hi ${name || 'there'},\n\nUse this link to reset your password:\n${resetUrl}\n\nIf you did not request a reset, ignore this message.`;
  const html = `<p>Hi ${name || 'there'},</p><p>Use this link to reset your password:</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request a reset, ignore this message.</p>`;

  await sendEmail({ to: email, subject, text, html });
}
