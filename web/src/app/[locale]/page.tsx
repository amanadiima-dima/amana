import { Suspense } from 'react';
import Navbar from '@/components/landing/Navbar';
import LandingSearch from '@/components/landing/LandingSearch';
import TravelerBand from '@/components/landing/TravelerBand';
import Benefits from '@/components/landing/Benefits';
import HowItWorks from '@/components/landing/HowItWorks';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <main className="bg-white text-gray-900">
      <Navbar />
      <Suspense>
        <LandingSearch />
      </Suspense>
      <TravelerBand />
      <Benefits />
      <HowItWorks />
      <Footer />
    </main>
  );
}
