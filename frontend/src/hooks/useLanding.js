// src/hooks/useLanding.js
import { useState, useEffect } from 'react';
import api from '../utils/api';
import { navigate } from '../utils/navigation';

export function useLanding() {
  const [authModal, setAuthModal] = useState({ isOpen: false, type: 'login' });
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const { success } = await api.users.getMe();
        
        if (!isMounted) return;

        if (success) {
          navigate('/dashboard');
          return; 
        } else {
          localStorage.removeItem('accessToken');
        }
      } catch (error) {
        
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const openAuthModal = (type) => {
    setAuthModal({ isOpen: true, type });
  };

  return {
    authModal,
    setAuthModal,
    isCheckingAuth,
    openAuthModal
  };
}