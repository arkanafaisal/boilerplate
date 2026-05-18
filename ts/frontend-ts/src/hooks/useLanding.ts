// src/hooks/useLanding.js
import { useState, useEffect } from 'react';
import api from '../utils/api';
import { navigate } from '../utils/navigation';
import { setAccessToken } from '../utils/fetcher';

export type AuthModalType = 'login' | 'register' | 'forgot-password';
export interface AuthModalState { isOpen: boolean, type: AuthModalType }

export function useLanding() {
  const [authModal, setAuthModal] = useState<AuthModalState>({ isOpen: false, type: 'login' });
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

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
          setAccessToken(null)
        }
      } catch (error) {
        console.error("Auth check failed to execute:", error);
        
        if (isMounted) {
           setAccessToken(null);
        }
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

  return {
    authModal,
    setAuthModal,
    isCheckingAuth,
  };
}