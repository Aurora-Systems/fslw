import Nav from '@/components/site/Nav';
import Footer from '@/components/site/Footer';
import '../legal/legal.css';
import './developers.css';

export default function DevelopersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      {children}
      <Footer />
    </>
  );
}
