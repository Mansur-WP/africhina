import {
  getCurrentUser,
  getSessionToken,
} from '@/src/infrastructure/auth/sessionManager.js';
import LandingHeader from '@/components/landing/LandingHeader.jsx';
import Hero from '@/components/landing/Hero.jsx';
import AboutSection from '@/components/landing/AboutSection.jsx';
import ProblemSection from '@/components/landing/ProblemSection.jsx';
import ServicesSection from '@/components/landing/ServicesSection.jsx';
import HowItWorks from '@/components/landing/HowItWorks.jsx';
import PlatformCapabilities from '@/components/landing/PlatformCapabilities.jsx';
import JoinSection from '@/components/landing/JoinSection.jsx';
import FinalCta from '@/components/landing/FinalCta.jsx';
import LandingFooter from '@/components/landing/LandingFooter.jsx';

/**
 * Public landing page.
 * Storytelling arc:
 *   Who we are → Problem → Services → How it works
 *   → Platform fit → Join → Final CTA
 */
export default async function Home() {
  const sessionToken = await getSessionToken();
  const user = sessionToken ? await getCurrentUser() : null;

  return (
    <>
      <LandingHeader user={user} />
      <main className="flex-1">
        <Hero />
        <AboutSection />
        <ProblemSection />
        <ServicesSection />
        <HowItWorks />
        <PlatformCapabilities />
        <JoinSection />
        <FinalCta />
      </main>
      <LandingFooter />
    </>
  );
}
