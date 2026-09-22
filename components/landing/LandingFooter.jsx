import Link from 'next/link';
import Logo from './Logo.jsx';

export default function LandingFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Logo & Contact details from Flyer */}
          <div className="col-span-2 md:col-span-1">
            <Logo size={42} />
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              <strong>Kano Address:</strong> Kano, Nigeria
              <br />
              <strong>Global:</strong> Africa — China — Global
              <br />
              <strong>Hotlines:</strong>
              <br />
              09038832095 / 08125426076
              <br />
              <strong>Email:</strong> info@africhinaconnect.com
            </p>
          </div>

          {/* Platform */}
          <div>
            <span className="mb-3 block text-xs font-semibold tracking-wider text-foreground uppercase">
              Platform
            </span>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/register"
                  className="transition hover:text-foreground"
                >
                  Create Account
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="transition hover:text-foreground"
                >
                  Log In
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="transition hover:text-foreground"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="transition hover:text-foreground"
                >
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <span className="mb-3 block text-xs font-semibold tracking-wider text-foreground uppercase">
              Services
            </span>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="#services"
                  className="transition hover:text-foreground"
                >
                  Export & Import
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  className="transition hover:text-foreground"
                >
                  Procurement & Sourcing
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  className="transition hover:text-foreground"
                >
                  General Trading
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  className="transition hover:text-foreground"
                >
                  Educational Consultancy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <span className="mb-3 block text-xs font-semibold tracking-wider text-foreground uppercase">
              Support
            </span>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://wa.me/2349038832095"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-foreground"
                >
                  WhatsApp Support
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@africhinaconnect.com"
                  className="transition hover:text-foreground"
                >
                  Email Inquiry
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>© 2026 Africhina Connect Ltd. All rights reserved.</span>
          <span>
            Kano, Nigeria — Your Trusted Trade &amp; Education Partner
          </span>
        </div>
      </div>
    </footer>
  );
}
