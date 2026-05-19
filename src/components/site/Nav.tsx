'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <Image src="/assets/fastlinq-logo.png" alt="FastLinQ" width={120} height={30} />
          </Link>
          <nav>
            <ul className="nav-links">
              <li><a href="#how-it-works">How it works</a></li>
              <li><a href="#for-clients">For clients</a></li>
              <li><a href="#for-couriers">For couriers</a></li>
              <li><a href="#for-business">For business</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </nav>
          <div className="nav-actions">
            <a
              href="https://cdn.clipond.com/fastlinq/app-debug.apk"
              className="btn btn-primary"
              download
            >
              ↓ Download App
            </a>
            <button
              className="nav-hamburger"
              id="hamburger"
              aria-label="Menu"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>

      <div className={`mobile-menu${menuOpen ? ' open' : ''}`} id="mobile-menu">
        <a href="#how-it-works" onClick={closeMenu}>How it works</a>
        <a href="#for-clients" onClick={closeMenu}>For clients</a>
        <a href="#for-couriers" onClick={closeMenu}>For couriers</a>
        <a href="#for-business" onClick={closeMenu}>For business</a>
        <a href="#faq" onClick={closeMenu}>FAQ</a>
        <a
          href="https://cdn.clipond.com/fastlinq/app-debug.apk"
          download
          onClick={closeMenu}
          style={{ color: 'var(--blue)', fontWeight: 600 }}
        >
          ↓ Download App
        </a>
      </div>
    </>
  );
}
