// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { validateAuthForm } from '../helpers/authValidation';
import api from '../utils/api';
import { navigate } from '../utils/navigation';
import { SYSTEM_MESSAGES } from '../utils/constants';

export function useAuth({ isOpen, type, onClose, t }) {
  const [formData, setFormData] = useState({ identifier: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', isSuccess: false });
  const [isForgotPasswordSuccess, setIsForgotPasswordSuccess] = useState(false);

  useEffect(() => {
    setFormData({ identifier: '', password: '', confirmPassword: '' });
    setErrors({});
    setFeedback({ text: '', isSuccess: false });
    setIsForgotPasswordSuccess(false);
  }, [isOpen, type]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (feedback.text) setFeedback({ text: '', isSuccess: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ text: '', isSuccess: false });
    
    const { isValid, errors: validationErrors } = validateAuthForm(type, formData, t);
    
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      let result;
      if (type === 'login') {
        result = await api.auth.login({ identifier: formData.identifier.trim(), password: formData.password.trim() });
      } else if (type === 'signup') {
        result = await api.auth.register({ username: formData.identifier.trim(), password: formData.password.trim() });
      } else if (type === 'forgot-password') {
        result = await api.auth.forgotPassword({ email: formData.identifier.trim() });
      }

      setFeedback({ text: result.message, isSuccess: result.success });

      if (result.success) {
        if (type === 'forgot-password') {
          setIsForgotPasswordSuccess(true);
        } else {
          const token = result.data?.accessToken || (typeof result.data === 'string' ? result.data : null);
          if (token) localStorage.setItem('accessToken', token);
          setTimeout(() => { onClose(); navigate('/dashboard'); }, 500);
        }
      }
    } catch (err) {
      setFeedback({ 
        text: SYSTEM_MESSAGES.NETWORK_ERROR,
        isSuccess: false 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { formData, errors, isLoading, feedback, isForgotPasswordSuccess, handleInputChange, handleSubmit };
}