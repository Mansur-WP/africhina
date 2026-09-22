import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  Package,
  CreditCard,
  Truck,
  FileQuestion,
  Search,
  ExternalLink,
} from 'lucide-react';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import AppShell from '@/components/AppShell.jsx';
import {
  contact,
  whatsappUrl,
  socialLinks,
} from '@/src/infrastructure/config/env.js';

export const metadata = {
  title: 'Customer Support & Help — Africhina Connect',
};

const FAQS = [
  {
    question: 'How do I purchase products on Africhina Connect?',
    answer:
      'Browse our catalogue, select your desired product, choose your quantity within available stock, and click "Add to Cart". Once in your cart, enter your delivery destination and proceed to secure checkout with Paystack.',
  },
  {
    question: 'How long does delivery take?',
    answer:
      'Once payment is confirmed, products are packaged and dispatched. You can track real-time delivery milestones under "Orders". Estimated arrival times range from standard local fulfillment to direct nationwide delivery.',
  },
  {
    question: 'How do I pay for my order?',
    answer:
      'Payments are processed securely through Paystack. You can pay with Nigerian debit cards, bank transfers, or USSD directly during checkout.',
  },
  {
    question: 'How can I track my shipment?',
    answer:
      'Go to Orders and click on your order to view live fulfillment updates, carrier information, and tracking numbers as your package moves to your delivery address.',
  },
  {
    question: 'What should I do if an item is out of stock?',
    answer:
      'Products are restocked regularly. If an item you need is out of stock, please check back soon or message our support team on WhatsApp for restocking updates.',
  },
];

export default async function SupportPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Customer Support & Help
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Have questions about products, orders, payments, or delivery? We are
            here to help you every step of the way.
          </p>
        </div>

        {/* Direct Contact Channels */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* WhatsApp */}
          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition hover:border-primary/40">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <MessageCircle size={20} />
              </div>
              <h2 className="mt-3 text-sm font-bold text-foreground">
                WhatsApp Support
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Fastest response for order updates, product inquiries, and
                delivery assistance.
              </p>
            </div>
            <div className="mt-4 border-t border-border pt-3">
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                >
                  <MessageCircle size={14} />
                  Chat on WhatsApp
                  <ExternalLink size={12} className="opacity-70" />
                </a>
              ) : (
                <p className="font-mono text-xs font-semibold text-foreground">
                  {contact.phonePrimary}
                </p>
              )}
            </div>
          </div>

          {/* Phone Inquiries */}
          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition hover:border-primary/40">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Phone size={20} />
              </div>
              <h2 className="mt-3 text-sm font-bold text-foreground">
                Phone Support
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Speak directly with our trade specialists in Nigeria.
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-1 border-t border-border pt-3 text-xs font-semibold text-foreground">
              <a
                href={`tel:${contact.phonePrimary}`}
                className="transition hover:text-primary"
              >
                {contact.phonePrimary}
              </a>
              {contact.phoneSecondary && (
                <a
                  href={`tel:${contact.phoneSecondary}`}
                  className="text-muted-foreground transition hover:text-primary"
                >
                  {contact.phoneSecondary}
                </a>
              )}
            </div>
          </div>

          {/* Email Support */}
          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition hover:border-primary/40 sm:col-span-2 lg:col-span-1">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <Mail size={20} />
              </div>
              <h2 className="mt-3 text-sm font-bold text-foreground">
                Email Inquiries
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                For formal trade inquiries, quotes, and documentation requests.
              </p>
            </div>
            <div className="mt-4 border-t border-border pt-3">
              <a
                href={`mailto:${contact.email}`}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
              >
                <Mail size={14} />
                {contact.email}
              </a>
            </div>
          </div>
        </div>

        {/* Office & Operating Hours */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3.5 rounded-xl border border-border bg-card p-5">
            <MapPin
              size={20}
              className="mt-0.5 shrink-0 text-muted-foreground"
            />
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Office Address
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {contact.address}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 rounded-xl border border-border bg-card p-5">
            <Clock
              size={20}
              className="mt-0.5 shrink-0 text-muted-foreground"
            />
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Business Hours (WAT)
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Monday – Friday: 8:00 AM – 6:00 PM
              </p>
              <p className="text-xs text-muted-foreground">
                Saturday: 9:00 AM – 4:00 PM
              </p>
            </div>
          </div>
        </div>

        {/* Common Help Topics */}
        <div className="space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-base font-bold text-foreground">
              Help Topics & Guides
            </h2>
            <p className="text-xs text-muted-foreground">
              Everything you need to know about buying products and tracking
              orders with Africhina Connect.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Catalogue */}
            <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
              <Package size={18} className="mt-0.5 shrink-0 text-primary" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Product Catalogue
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Browse directly available products, view stock, and purchase
                  seamlessly with secure online payment.
                </p>
                <Link
                  href="/catalogue"
                  className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
                >
                  Browse Catalogue →
                </Link>
              </div>
            </div>

            {/* Orders & Tracking */}
            <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
              <Package size={18} className="mt-0.5 shrink-0 text-primary" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Orders & Shipment Tracking
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Track every stage of your order: Factory Preparation, China
                  Shipping, Customs Clearance, and Nigerian Destination
                  Delivery.
                </p>
                <Link
                  href="/orders"
                  className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
                >
                  Go to My Orders →
                </Link>
              </div>
            </div>

            {/* Payments */}
            <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
              <CreditCard size={18} className="mt-0.5 shrink-0 text-primary" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Payments & Checkout
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Payments are processed securely through Paystack. Follow the
                  payment instructions shown during checkout. Supported in
                  Nigerian Naira (NGN).
                </p>
              </div>
            </div>

            {/* Logistics */}
            <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
              <Truck size={18} className="mt-0.5 shrink-0 text-primary" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Logistics & Pickup Hubs
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  We handle end-to-end freight from Guangzhou and Yiwu to Lagos
                  ports and Kano distribution centers with nationwide doorstep
                  delivery.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Frequently Asked Questions */}
        <div className="space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-base font-bold text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-muted-foreground">
              Quick answers to common questions about buying and importing.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary/30"
              >
                <div className="flex items-start gap-2.5">
                  <FileQuestion
                    size={16}
                    className="mt-0.5 shrink-0 text-muted-foreground"
                  />
                  <div>
                    <h3 className="text-xs font-bold text-foreground">
                      {faq.question}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
