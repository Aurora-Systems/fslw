import Nav from '@/components/site/Nav';
import Hero from '@/components/site/Hero';
import TrustedBy from '@/components/site/TrustedBy';
import HowItWorks from '@/components/site/HowItWorks';
import ForClients from '@/components/site/ForClients';
import ForCouriers from '@/components/site/ForCouriers';
import ForBusiness from '@/components/site/ForBusiness';
import Features from '@/components/site/Features';
import Download from '@/components/site/Download';
import FAQ from '@/components/site/FAQ';
import Footer from '@/components/site/Footer';

export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <TrustedBy />
      <HowItWorks />
      <ForClients />
      <ForCouriers />
      <ForBusiness />
      <Features />
      <Download />
      <FAQ />
      <Footer />
    </>
  );
}
