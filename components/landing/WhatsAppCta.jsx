import { MessageCircle } from 'lucide-react';
import { whatsappUrl } from '@/src/infrastructure/config/env.js';

export default function WhatsAppCta({
  label = 'Chat on WhatsApp',
  className = '',
}) {
  const link =
    whatsappUrl ||
    'https://wa.me/2348000000000?text=Hello%20Africhina%20Connect,%20I%20want%20to%20enquire%20about%20sourcing%20products%20from%20China.';

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted ${className}`}
    >
      <MessageCircle size={16} className="text-emerald-600" />
      {label}
    </a>
  );
}
