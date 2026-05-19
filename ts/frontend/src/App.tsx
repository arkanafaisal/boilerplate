// src/App.jsx
import { useState, useEffect } from 'react';

import LandingPage from './pages/LandingPage';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';

import Dashboard from './pages/Dashboard';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const renderPage = () => {
    if (currentPath === '/dashboard') {
      return <Dashboard/>;
    }

    if (currentPath.startsWith('/auth/verify-email/')) {
      const token = currentPath.split('/verify-email/')[1];
      return <VerifyEmail token={token} />;
    }

    if (currentPath.startsWith('/auth/reset-password/')) {
      const token = currentPath.split('/reset-password/')[1];
      return <ResetPassword token={token} />;
    }

    // Default route
    return <LandingPage isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
  };

  return (
    <>
      {renderPage()}
    </>
  );
}