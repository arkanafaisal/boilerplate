// src/hooks/useResetPassword.js
import { useState } from 'react';
import api from '../utils/api';
import { navigate } from '../utils/navigation';
import { VALIDATION, SYSTEM_MESSAGES } from '../utils/constants';
import type { TFunction } from 'i18next';

const validateResetForm = (passwords: { password: string, confirmPassword: string }, t: TFunction<"translation", undefined>) => {
  const { password, confirmPassword } = passwords;
  const errors: Record<string, string> = {};
  if (!password) {
    errors.password = t('auth.errRequired');
  } else if (password.length < VALIDATION.USER.MIN_PASSWORD) {
    errors.password = t('auth.errMin6');
  }
  if (password !== confirmPassword) {
    errors.confirmPassword = t('auth.errMatch');
  }
  return { isValid: Object.keys(errors).length === 0, errors };
};

export function useResetPassword({ token, t }: { token: string, t: TFunction<"translation", undefined> }) {
  const [passwords, setPasswords] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', isSuccess: false });
  const [isSuccessState, setIsSuccessState] = useState(false);

  const isTokenValid = token && token.length === 64;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (feedback.text) {
      setFeedback({ text: '', isSuccess: false });
    }
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback({ text: '', isSuccess: false });
    
    const { isValid, errors: validationErrors } = validateResetForm(passwords, t);
    
    if (isValid) {
      setIsLoading(true);
      try {
        const result = await api.auth.resetPassword({ token, password: passwords.password });
        
        setFeedback({ text: result.message, isSuccess: result.success });

        if (result.success) {
          setIsSuccessState(true);
          setTimeout(() => navigate('/'), 4000); 
        }
      } catch (err) {
        setFeedback({ 
          text: SYSTEM_MESSAGES.NETWORK_ERROR,
          isSuccess: false 
        });
      } finally {
        setIsLoading(false)
      }
    } else {
      setErrors(validationErrors);
    }
  };

  return {
    isTokenValid,
    passwords,
    errors,
    isLoading,
    feedback,
    isSuccessState,
    handleInputChange,
    handleSubmit
  };
}