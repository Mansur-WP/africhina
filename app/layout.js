import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'Africhina Connect',
    template: '%s · Africhina Connect',
  },
  description:
    'China-to-Nigeria sourcing and import management. Source products, receive quotations, pay securely, and track shipments end to end.',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased`}
    >
      {/*
        suppressHydrationWarning: browser extensions (e.g. Bitdefender
        TrafficLight, Grammarly) inject attributes such as bis_register,
        __processed_<uuid>__, bis_skin_checked, and cz-shortcut-listen onto
        <html>, <body>, and DOM elements before React hydrates. These are not produced
        by the app, so we silence shallow attribute mismatches.
      */}
      <body suppressHydrationWarning className="flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}
