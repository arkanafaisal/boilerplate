// src/utils/api.jsx
import { fetcher } from "./fetcher";
import apiMessages from "../helpers/apiMessages";

export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T | null;
  httpCode: number;
}

const api = {
  auth: {
    login: async ({ identifier, password }: { identifier: string, password: string }): Promise<ApiResponse<{ accessToken: string }>> => {
      const response = await fetcher('auth/login', { 
        method: 'POST', 
        body: { identifier, password },
        credentials: 'include' 
      }, false);
      
      const httpCode = response.status;
      const success = response.ok;
      const message = await apiMessages.auth.login(response);
      
      let data = null;
      if (success) data = await response.clone().json().catch(() => null);
      
      return { success, message, data, httpCode };
    },
    
    register: async ({ username, password }: { username: string, password: string }): Promise<ApiResponse<{ accessToken: string }>> => {
      const response = await fetcher('auth/register', { 
        method: 'POST', 
        body: { username, password },
        credentials: 'include' 
      }, false);
      
      const httpCode = response.status;
      const success = response.ok;
      const message = await apiMessages.auth.register(response);
      
      let data = null;
      if (success) data = await response.clone().json().catch(() => null);
      return { success, message, data, httpCode };
    },
    
    logout: async (): Promise<ApiResponse<null>> => {
      const response = await fetcher('auth/logout', { 
        method: 'POST',
        credentials: 'include'
      }, true);
      
      const httpCode = response.status;
      const success = response.ok;
      const message = await apiMessages.auth.logout(response);
      
      return { success, message, data: null, httpCode };
    },
    
    verifyEmail: async ({ token }: { token: string }): Promise<ApiResponse> => {
      const response = await fetcher(`auth/verify-email/${token}`, { method: 'POST' }, false);
      
      const httpCode = response.status;
      const success = response.ok;
      const message = await apiMessages.auth.verifyEmail(response);
      
      return { success, message, data: null, httpCode };
    },
    resetPassword: async ({ token, password }: { token: string, password: string }): Promise<ApiResponse<{ error: string }>> => {
      const response = await fetcher(`auth/reset-password/${token}`, { 
        method: 'POST', 
        body: { password } 
      }, false);
      
      const httpCode = response.status;
      const success = response.ok;
      const message = await apiMessages.auth.resetPassword(response);
      
      let data = null;
      if (success) data = await response.clone().json().catch(() => null);
      
      return { success, message, data, httpCode };
    },
    forgotPassword: async ({ email }: { email: string }): Promise<ApiResponse> => {
      const response = await fetcher('auth/forgot-password', { 
        method: 'POST', 
        body: { email } 
      }, false);
      
      const httpCode = response.status;
      const success = response.ok;
      const message = await apiMessages.auth.forgotPassword(response);
      
      return { success, message, data: null, httpCode };
    },  
  },

  users: {
    getMe: async (): Promise<ApiResponse<{ username: string, email: string | null }>> => {
      const response = await fetcher('users/me', { method: 'GET' });
      
      const httpCode = response.status;
      const success = response.ok;
      const message = await apiMessages.users.getMe(response);
      
      let data = null;
      if (success) data = await response.clone().json().catch(() => null);
      
      return { success, message, data, httpCode };
    },

    updateEmail: async ({ email }: { email: string }): Promise<ApiResponse<{ error: string }>> => {
      const response = await fetcher('users/me/email', { method: 'PATCH', body: { email } });
      const success = response.ok;
      const message = await apiMessages.users.updateEmail(response);
      
      let data = null;
      if (success) data = await response.clone().json().catch(() => null);

      return { success, message, data, httpCode: response.status };
    },
  }
};

export default api;