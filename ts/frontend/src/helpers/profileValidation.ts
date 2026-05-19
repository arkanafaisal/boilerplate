// src/helpers/profileValidation.js
import { VALIDATION } from '../utils/constants';

export type ProfileSettingsField = 'username' | 'email' | 'password';
 
export const validateProfileField = ({ field, value }: { field: ProfileSettingsField, value: string | { oldPassword: string, newPassword: string } }) => {
  const errors: Record<string, string> = {};

  if (field === 'username') {
    const cleanValue = typeof value === 'string'? value.trim() : '';
    if (!cleanValue) {
      errors[field] = 'Username is required.';
    } else if (cleanValue.length > VALIDATION.USER.MAX_USERNAME) {
      errors[field] = `Max ${VALIDATION.USER.MAX_USERNAME} characters.`;
    }
  }

  if (field === 'email') {
    const cleanValue = typeof value === 'string'? value.trim() : '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (cleanValue && !emailRegex.test(cleanValue)) {
      errors[field] = 'Invalid email format.';
    }
  }

  if (field === 'password' && typeof value === 'object') {
    if (!value.oldPassword) {
      errors.oldPassword = 'Old password is required.';
    }
    
    if (!value.newPassword) {
      errors.newPassword = 'New password is required.';
    } else if (value.newPassword.length < VALIDATION.USER.MIN_PASSWORD) {
      errors.newPassword = `Min ${VALIDATION.USER.MIN_PASSWORD} characters.`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};