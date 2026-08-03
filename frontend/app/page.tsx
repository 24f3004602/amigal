import { LandingHero } from '@/components/features/landing/LandingHero';
import { LandingFeatures } from '@/components/features/landing/LandingFeatures';
import { LandingCTA } from '@/components/features/landing/LandingCTA';

export default function Home() {
  return (
    <main className="min-h-screen">
      <LandingHero />
      <LandingFeatures />
      <LandingCTA />
    </main>
  );
}
