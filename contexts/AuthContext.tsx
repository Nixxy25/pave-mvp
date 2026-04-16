'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  signIn,
  signUp,
  signOut,
  confirmSignUp,
  getCurrentUser,
  fetchUserAttributes,
  signInWithRedirect,
  updateUserAttributes,
  resendSignUpCode,
  fetchAuthSession,
} from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { configureAmplify } from '@/lib/amplify-config';

if (typeof window !== 'undefined') {
  configureAmplify();
}

export interface User {
  userId: string;
  email: string;
  fullName: string;
  businessName: string;
  emailVerified: boolean;
  authProvider: 'cognito' | 'google';
}

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  businessName: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsBusinessName: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (data: SignUpData) => Promise<void>;
  confirmAccount: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateBusinessName: (businessName: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsBusinessName, setNeedsBusinessName] = useState(false);

  useEffect(() => {
    checkAuth();

    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signInWithRedirect':
          checkAuth();
          break;
        case 'signInWithRedirect_failure':
          setIsLoading(false);
          break;
        case 'signedIn':
          checkAuth();
          break;
        case 'signedOut':
          setUser(null);
          setNeedsBusinessName(false);
          setIsLoading(false);
          break;
        case 'tokenRefresh_failure':
          setUser(null);
          setNeedsBusinessName(false);
          break;
      }
    });

    return () => unsubscribe();
  }, []);

  async function checkAuth() {
    try {
      const currentUser = await getCurrentUser();
      
      const isGoogleUser = currentUser.username?.startsWith('google_') || false;
      
      let email = '';
      let fullName = '';
      let businessName = '';
      let emailVerified = false;
      
      if (isGoogleUser) {
        try {
          const session = await fetchAuthSession();
          const idToken = session.tokens?.idToken;
          
          if (idToken?.payload) {
            email = (idToken.payload.email as string) || '';
            fullName = (idToken.payload.name as string) || '';
            businessName = (idToken.payload.nickname as string) || '';
            emailVerified = (idToken.payload.email_verified as boolean) || false;
          }
        } catch (tokenError) {
        }
      } else {
        try {
          const attributes = await fetchUserAttributes();
          email = attributes.email || '';
          fullName = attributes.name || '';
          businessName = attributes.nickname || '';
          emailVerified = attributes.email_verified === 'true';
        } catch (attrError) {
        }
      }
      
      const needsBusiness = isGoogleUser && (!businessName || businessName === fullName);
      setNeedsBusinessName(needsBusiness);

      const userData: User = {
        userId: currentUser.userId,
        email: email,
        fullName: fullName,
        businessName: businessName,
        emailVerified: emailVerified,
        authProvider: isGoogleUser ? 'google' : 'cognito',
      };

      setUser(userData);
      
      if (isGoogleUser) {
        localStorage.setItem(`pave_user_${currentUser.userId}`, JSON.stringify(userData));
      }

    } catch (error) {
      setUser(null);
      setNeedsBusinessName(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      try {
        await signOut({ global: false });
      } catch (err) {
      }
      
      const result = await signIn({ username: email, password });
      
      if (result.isSignedIn) {
        await checkAuth();
      } else {
        throw new Error('Sign in requires additional steps');
      }
    } catch (error: any) {
      throw error;
    }
  }

  async function loginWithGoogle() {
    try {
      await signInWithRedirect({ provider: 'Google' });
    } catch (error) {
      throw error;
    }
  }

  async function register(data: SignUpData) {
    await signUp({
      username: data.email,
      password: data.password,
      options: {
        userAttributes: {
          email: data.email,
          name: data.fullName,
          nickname: data.businessName,
        },
      },
    });
  }

  async function confirmAccount(email: string, code: string) {
    await confirmSignUp({ username: email, confirmationCode: code });
  }

  async function resendCode(email: string) {
    await resendSignUpCode({ username: email });
  }

  async function logout() {
    const currentUserId = user?.userId;
    await signOut();
    setUser(null);
    setNeedsBusinessName(false);
    if (currentUserId) {
      localStorage.removeItem(`pave_user_${currentUserId}`);
    }
  }

  async function updateBusinessName(businessName: string) {
    await updateUserAttributes({
      userAttributes: {
        nickname: businessName,
      },
    });
    setNeedsBusinessName(false);
    await checkAuth();
  }

  async function refreshUser() {
    await checkAuth();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        needsBusinessName,
        login,
        loginWithGoogle,
        register,
        confirmAccount,
        resendCode,
        logout,
        updateBusinessName,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}