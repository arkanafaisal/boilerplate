// src/pages/LandingPage.jsx
import { Loader2 } from 'lucide-react';

import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import Footer from '../components/landing/Footer';
import { useLanding } from '../hooks/useLanding';

interface LandingPageProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export default function LandingPage({ isDarkMode, toggleTheme }: LandingPageProps) {
  
  const { 
    authModal, 
    setAuthModal, 
    isCheckingAuth, 
  } = useLanding();

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center">
      <Navbar 
        isDarkMode={isDarkMode} 
        toggleTheme={toggleTheme} 
        authModal={authModal} 
        setAuthModal={setAuthModal} 
      />

      <main className="w-full flex-1 flex flex-col items-center">
        <HeroSection />
      </main>

      <Footer />
    </div>
  );
}