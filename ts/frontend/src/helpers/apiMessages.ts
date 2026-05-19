// src/helpers/apiMessages.js

const handleCommonMessages = async (response: Response) => {
  const status = response.status;
  
  if (status === 0) {
    return "Connection failed. Please check your internet connection.";
  }
  if (status >= 500) {
    return "An internal server error occurred. Please try again later.";
  }
  if (status === 429) {
    return "Too many requests. Please wait a moment and try again.";
  }
  if (status === 403) {
    return "Forbidden: You do not have permission to perform this action.";
  }
  if (status === 400) {
    const data = await response.clone().json().catch(() => null);
    return data?.error || "Invalid data provided (Bad Request).";
  }
  
  return "";
};






type ApiMessagesType2 = Record<'auth' | 'users', Record<string, (response: Response) => Promise<string>>>

const apiMessages: ApiMessagesType2 = {
  auth: {
    login: async (response) => {
      const common = await handleCommonMessages(response);
      if (common) return common;
      
      const status = response.status;
      if (status === 200) return "Login successful.";
      if (status === 401 || status === 404) return "Incorrect username/email or password.";
      
      return `Login failed (Code: ${status}).`;
    },
    
    register: async (response) => {
      const common = await handleCommonMessages(response);
      if (common) return common;
      
      const status = response.status;
      if (status === 201 || status === 200) return "Registration successful.";
      if (status === 409) return "Username is already taken."; 
      
      return `Registration failed (Code: ${status}).`;
    },
    
    forgotPassword: async (response) => {
      const common = await handleCommonMessages(response);
      if (common) return common;
      
      const status = response.status;
      if (status === 200) return "Password reset link sent.";
      if (status === 404) return "Email address not found in our system.";
      
      return `Failed to send reset link (Code: ${status}).`;
    },

    resetPassword: async (response) => {
      const common = await handleCommonMessages(response);
      if (common) return common;

      const status = response.status;
      if (status === 200) return "Password has been reset successfully.";
      if (status === 401 || status === 404) return "The reset link is invalid or has expired.";
      
      return `Failed to reset password (Code: ${status}).`;
    },

    verifyEmail: async (response) => {
      const common = await handleCommonMessages(response);
      if (common) return common;

      const status = response.status;
      if (status === 200) return "Email successfully verified.";
      if (status === 400 || status === 404) return "Verification failed. The link might be expired or invalid.";
      
      return `Verification failed (Code: ${status}).`;
    },

    logout: async (response) => {
      const common = await handleCommonMessages(response);
      if (common) return common;

      if (response.status === 200) return "Logged out successfully.";
      return `Logout failed (Code: ${response.status}).`;
    }
  },
  
  users: {
    getMe: async (response) => {
      const common = await handleCommonMessages(response);
      if (common) {
        return common;
      }
      
      const status = response.status;
      if (status === 200) {
        const data = await response.clone().json().catch(() => null);
        const name = data?.displayName || data?.username || "User";
        return `Welcome back, ${name}!`;
      }
      if (status === 404 || status === 401) {
        return "User profile not found. Please log in again.";
      }
      
      return `Failed to load profile (Code: ${status}).`;
    },

    updateEmail: async (response) => {
      const common = await handleCommonMessages(response);
      if (common) return common;
      
      const status = response.status;
      if (status === 200) return "Verification link sent to your new email.";
      if (status === 409) return "Email is already registered by another user.";
      
      return `Failed to update email (Code: ${status}).`;
    },
  
    deleteMe: async (response) => {
      const common = await handleCommonMessages(response);
      if (common) return common;
      
      const status = response.status;
      if (status === 200 || status === 204) return "Account deleted successfully.";
      if (status === 400) return "Invalid username confirmation.";
      
      return `Failed to delete account (Code: ${status}).`;
    }
  },

  
};

export default apiMessages;