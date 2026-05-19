// src/components/landing/Navbar.jsx
import AuthModal from './AuthModal';
import { useTranslation } from 'react-i18next';
import { PROJECT_NAME } from '../../utils/constants.js';

import type { SetState } from '../../types/util.js';
import type { AuthModalState, AuthModalType } from '../../hooks/useLanding.js';

interface NavbarProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  authModal: AuthModalState;
  setAuthModal: SetState<AuthModalState>;
}

export default function Navbar({ isDarkMode, toggleTheme, authModal, setAuthModal }: NavbarProps) {
  const { t } = useTranslation();
  
  const openModal = (type: AuthModalType) => setAuthModal({ isOpen: true, type });
  const closeModal = () => setAuthModal(prev => ({ ...prev, isOpen: false }));
  const setModalType = (type: AuthModalType) => setAuthModal(prev => ({ ...prev, type }));

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
            <button onClick={() => openModal('register')} className="border border-[var(--foreground)] bg-[var(--background)] text-[var(--foreground)] px-4 py-1.5 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors">
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