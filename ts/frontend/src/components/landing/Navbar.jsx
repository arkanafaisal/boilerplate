// src/components/landing/Navbar.jsx
import React from 'react';
import AuthModal from './AuthModal';
import { useTranslation } from 'react-i18next';
import { PROJECT_NAME } from '../../utils/constants.js';

export default function Navbar({ isDarkMode, toggleTheme, authModal, setAuthModal }) {
  const { t } = useTranslation();
  
  const openModal = (type) => setAuthModal({ isOpen: true, type });
  const closeModal = () => setAuthModal(prev => ({ ...prev, isOpen: false }));
  const setModalType = (type) => setAuthModal(prev => ({ ...prev, type }));

  return (
    <>
      <header className="w-full border-b border-[var(--foreground)] bg-[var(--background)] text-[var(--foreground)]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          
          <div className="font-bold text-lg tracking-tight">
            {PROJECT_NAME}
          </div>
          
          <div className="flex items-center gap-4 text-sm font-medium">
            <button onClick={toggleTheme} className="hover:underline underline-offset-4">
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button onClick={() => openModal('login')} className="hover:underline underline-offset-4">
              {t('nav.login')}
            </button>
            <button onClick={() => openModal('signup')} className="border border-[var(--foreground)] bg-[var(--background)] text-[var(--foreground)] px-4 py-1.5 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors">
              {t('nav.signup')}
            </button>
          </div>

        </div>
      </header>

      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={closeModal} 
        type={authModal.type} 
        setType={setModalType} 
      />
    </>
  );
}