import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import { isCognitoConfigured } from '../services/awsConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check and restore authentication session on initial mount / refresh
  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      const activeUser = await authService.getCurrentAuthenticatedUser();
      setUser(activeUser);
      setAuthError(null);
    } catch (err) {
      console.warn('[AuthContext] Session restore notice:', err.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Log in user using Amazon Cognito credentials
   */
  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const authenticatedUser = await authService.login(email, password);
      setUser(authenticatedUser);
      // In local mock mode, sync with mock storage
      if (!isCognitoConfigured) {
        localStorage.setItem('cloudedu_current_user', JSON.stringify(authenticatedUser));
      }
      return authenticatedUser;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register student account in Amazon Cognito
   */
  const register = async (studentData) => {
    setLoading(true);
    setAuthError(null);
    try {
      const result = await authService.register(studentData);
      return result;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Confirm student registration via verification code sent to email
   */
  const confirmRegistration = async (email, code) => {
    setLoading(true);
    setAuthError(null);
    try {
      const result = await authService.confirmRegistration(email, code);
      return result;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resend verification code
   */
  const resendCode = async (email) => {
    try {
      return await authService.resendConfirmationCode(email);
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  /**
   * Secure sign out through Amplify Auth
   */
  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setAuthError(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        groups: user?.groups || [],
        isAuthenticated: !!user,
        loading,
        authError,
        isCognitoConfigured,
        login,
        register,
        confirmRegistration,
        resendCode,
        logout,
        refreshSession: checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
