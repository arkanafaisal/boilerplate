// src/hooks/useVerifyEmail.js
import { useState, useEffect } from 'react';
import api from '../utils/api';
import { SYSTEM_MESSAGES } from '../utils/constants';

export function useVerifyEmail({ token }: { token: string }) {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    let isMounted = true;

    const verifyToken = async () => {
      if (!token || token.length !== 64) {
        setStatus('error');
        setMessage('Invalid or missing verification token.');
        return;
      }

      try {
        const result = await api.auth.verifyEmail({ token });
        
        if (isMounted) {
          setMessage(result.message);
          setStatus(result.success ? 'success' : 'error');
        }
      } catch (error) {
        if (isMounted) {
          setStatus('error');
          setMessage(SYSTEM_MESSAGES.NETWORK_ERROR);
        }
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return {
    status,
    message
  };
}