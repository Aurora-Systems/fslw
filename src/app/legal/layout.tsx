import Nav from '@/components/site/Nav';
import Footer from '@/components/site/Footer';
import './legal.css';

export default function LegalLayout({
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
