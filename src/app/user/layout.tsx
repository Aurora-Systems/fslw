import Nav from '@/components/site/Nav';
import Footer from '@/components/site/Footer';
import '../legal/legal.css';

export default function UserLayout({
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
