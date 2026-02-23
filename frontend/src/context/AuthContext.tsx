// Receiptly Auth Context
// @author Zidane Virani

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { api } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isOnboarded: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isOnboarded: false,
  });

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const [token, userJson, onboarded] = await Promise.all([
        AsyncStorage.getItem('auth_token'),
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('onboarded'),
      ]);

      if (token && userJson) {
        const user = JSON.parse(userJson);
        api.setToken(token);
        setState({
          user,
          token,
          isLoading: false,
          isOnboarded: onboarded === 'true',
        });
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }

  async function signIn(email: string, _password: string) {
    // For now, simulate auth since backend auth isn't wired yet
    // Replace with real Supabase auth call
    const user: User = {
      id: 'demo-user-id',
      email,
      displayName: email.split('@')[0],
    };
    const token = 'demo-token';

    api.setToken(token);
    await AsyncStorage.setItem('auth_token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));

    setState((prev) => ({ ...prev, user, token }));
  }

  async function signUp(email: string, _password: string, displayName: string) {
    const user: User = {
      id: 'demo-user-id',
      email,
      displayName,
    };
    const token = 'demo-token';

    api.setToken(token);
    await AsyncStorage.setItem('auth_token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));

    setState((prev) => ({ ...prev, user, token, isOnboarded: false }));
  }

  async function signOut() {
    api.setToken(null);
    await AsyncStorage.multiRemove(['auth_token', 'user']);
    setState({ user: null, token: null, isLoading: false, isOnboarded: false });
  }

  async function completeOnboarding() {
    await AsyncStorage.setItem('onboarded', 'true');
    setState((prev) => ({ ...prev, isOnboarded: true }));
  }

  return (
    <AuthContext.Provider
      value={{ ...state, signIn, signUp, signOut, completeOnboarding }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
