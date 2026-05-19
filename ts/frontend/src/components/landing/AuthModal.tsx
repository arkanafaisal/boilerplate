// src/components/landing/AuthModal.jsx
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth'; 
import { VALIDATION } from '../../utils/constants';
import type { AuthModalType } from '../../hooks/useLanding';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: AuthModalType;
  setType: (type: AuthModalType) => void;
}

export default function AuthModal({ isOpen, onClose, type, setType }: AuthModalProps) {
  const { t } = useTranslation();
  const { formData, errors, isLoading, feedback, isForgotPasswordSuccess, handleInputChange, handleSubmit } = useAuth({ isOpen, type, onClose, t });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--foreground)]/80 p-4">
      <div className="bg-[var(--background)] text-[var(--foreground)] w-full max-w-sm p-6 border border-[var(--foreground)] relative">
        
        <button onClick={onClose} className="absolute top-3 right-4 font-bold hover:opacity-70">
          ✕
        </button>

        {isForgotPasswordSuccess ? (
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">{t('auth.successTitle')}</h2>
            <p className="text-sm mb-6">{t('auth.successDesc')}</p>
            <button onClick={onClose} className="w-full border border-[var(--foreground)] bg-[var(--background)] text-[var(--foreground)] p-2 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors">
              {t('auth.btnClose')}
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4">
              {type === 'login' ? t('auth.loginTitle') : (type === 'register' ? t('auth.signupTitle') : t('auth.forgotPasswordTitle'))}
            </h2>

            {feedback.text && (
              <div className="mb-4 p-2 border border-[var(--foreground)] text-sm font-bold">
                {feedback.isSuccess ? '[SUCCESS] ' : '[ERROR] '} {feedback.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider">
                  {type === 'login' ? t('auth.labelIdLogin') : (type === 'register' ? t('auth.labelIdSignup') : t('auth.labelEmail'))}
                </label>
                <input 
                  type={type === 'forgot-password' ? 'email' : 'text'} 
                  name="identifier" 
                  value={formData.identifier} 
                  onChange={handleInputChange} 
                  disabled={isLoading} 
                  maxLength={type === 'register' ? VALIDATION.USER.MAX_USERNAME : VALIDATION.USER.MAX_EMAIL} 
                  className="border border-[var(--foreground)] p-2 bg-[var(--background)] text-[var(--foreground)] text-sm outline-none w-full"
                />
                {errors.identifier && <span className="text-[10px] font-bold uppercase">! {errors.identifier}</span>}
              </div>

              {type !== 'forgot-password' && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider">{t('auth.labelPassword')}</label>
                  <input 
                    type="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleInputChange} 
                    disabled={isLoading} 
                    maxLength={VALIDATION.USER.MAX_PASSWORD} 
                    className="border border-[var(--foreground)] p-2 bg-[var(--background)] text-[var(--foreground)] text-sm outline-none w-full"
                  />
                  {errors.password && <span className="text-[10px] font-bold uppercase">! {errors.password}</span>}
                </div>
              )}

              {type === 'register' && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider">{t('auth.labelConfirm')}</label>
                  <input 
                    type="password" 
                    name="confirmPassword" 
                    value={formData.confirmPassword} 
                    onChange={handleInputChange} 
                    disabled={isLoading} 
                    maxLength={VALIDATION.USER.MAX_PASSWORD} 
                    className="border border-[var(--foreground)] p-2 bg-[var(--background)] text-[var(--foreground)] text-sm outline-none w-full"
                  />
                  {errors.confirmPassword && <span className="text-[10px] font-bold uppercase">! {errors.confirmPassword}</span>}
                </div>
              )}

              <button type="submit" disabled={isLoading} className="mt-2 bg-[var(--foreground)] text-[var(--background)] py-2.5 font-bold text-sm hover:opacity-80 transition-opacity">
                {isLoading ? 'Processing...' : (type === 'login' ? t('auth.btnLogin') : (type === 'register' ? t('auth.btnSignup') : t('auth.btnForgotPassword')))}
              </button>
            </form>

            <div className="mt-5 flex flex-col gap-2 text-sm">
              <button onClick={() => setType(type === 'forgot-password' ? 'login' : (type === 'login' ? 'register' : 'login'))} className="text-left hover:underline decoration-[var(--foreground)] underline-offset-4">
                {type === 'login' ? t('auth.linkSignup') : t('auth.linkLogin')}
              </button>
              {type === 'login' && (
                <button onClick={() => setType('forgot-password')} className="text-left hover:underline decoration-[var(--foreground)] underline-offset-4">
                  {t('auth.linkForgotPassword')}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}