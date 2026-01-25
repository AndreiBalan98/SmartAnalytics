import HeroSection from '@/components/landing/HeroSection';
import KeyCapabilities from '@/components/landing/KeyCapabilities';
import ProductPreview from '@/components/landing/ProductPreview';
import HowItWorks from '@/components/landing/HowItWorks';
import FinalCTA from '@/components/landing/FinalCTA';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <KeyCapabilities />
      <ProductPreview />
      <HowItWorks />
      <FinalCTA />
      <Footer />
    </main>
  );
}
