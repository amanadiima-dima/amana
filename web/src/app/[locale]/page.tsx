import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import TripSearchSection from '@/components/landing/TripSearchSection';
import HowItWorks from '@/components/landing/HowItWorks';
import BecomeTraveler from '@/components/landing/BecomeTraveler';
import Features from '@/components/landing/Features';
import Stats from '@/components/landing/Stats';
import Testimonials from '@/components/landing/Testimonials';
import DownloadCTA from '@/components/landing/DownloadCTA';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <main className="bg-white text-gray-900">
      <Navbar />
      <Hero />
      <TripSearchSection />
      <HowItWorks />
      <BecomeTraveler />
      <Features />
      <Stats />
      <Testimonials />
      <DownloadCTA />
      <Footer />
    </main>
  );
}
