// src/helpers/authValidation.js
import type { TFunction } from 'i18next';
import { VALIDATION } from '../utils/constants';
import type { AuthModalType } from '../hooks/useLanding';

type ValidateAuthFormProps = {
  type: AuthModalType;
  formData: {
    identifier: string;
    password: string;
    confirmPassword?: string;
  };
  t: TFunction<"translation", undefined>;
}

export const validateAuthForm = ({ type, formData, t }: ValidateAuthFormProps) => {
  let newErrors: Record<string, string> = {};
  const cleanId = formData.identifier.trim();
  const cleanPw = formData.password.trim();
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (type === 'forgot-password') {
    if (!cleanId) {
      newErrors.identifier = t('auth.errRequired');
    } else if (!emailRegex.test(cleanId)) {
      newErrors.identifier = t('auth.errEmailInvalid');
    } else if (cleanId.length > VALIDATION.USER.MAX_EMAIL) { 
      newErrors.identifier = t('auth.errMax255');
    }
    
    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors
    };
  }

  if (!cleanId) {
    newErrors.identifier = t('auth.errRequired');
  } else if (type === 'register' && cleanId.length > VALIDATION.USER.MAX_USERNAME) {
    newErrors.identifier = t('auth.errMax50');
  } else if (type === 'login' && cleanId.length > VALIDATION.USER.MAX_EMAIL) {
    newErrors.identifier = t('auth.errMax255');
  }

  if (!cleanPw) {
    newErrors.password = t('auth.errRequired');
  } else if (cleanPw.length < VALIDATION.USER.MIN_PASSWORD) { 
    newErrors.password = t('auth.errMin6');
  } else if (cleanPw.length > VALIDATION.USER.MAX_PASSWORD) {
    newErrors.password = t('auth.errMax255');
  }

  if (type === 'register') {
    const cleanCfpw = formData.confirmPassword?.trim();
    if (!cleanCfpw) {
      newErrors.confirmPassword = t('auth.errConfirm');
    } else if (cleanCfpw !== cleanPw) {
      newErrors.confirmPassword = t('auth.errMatch');
    }
  }

  return {
    isValid: Object.keys(newErrors).length === 0,
    errors: newErrors
  };
};