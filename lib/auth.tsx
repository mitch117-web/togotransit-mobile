import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import api from './api';
import { auth as auth_api } from './togotransit-api';

type User = {
  id: number | string;
  email?: string;
  telephone?: string;
  phone?: string;
  role: 'voyageur' | 'gestionnaire' | 'super_admin' | 'CLIENT' | 'DRIVER' | 'AGENT' | 'ADMIN';
  nom?: string;
  prenom?: string;
  name?: string;
  compagnie_id?: number | null;
  date_creation?: string;
  statut?: string;
  token?: string;
  notifications?: any[];
  notifications_enabled?: boolean;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  signIn: (login: string, password: string) => Promise<void>;
  signUp: (data: { nom: string; prenom: string; telephone: string; email?: string; mot_de_passe: string; compagnie_id?: number | null }) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (raw: any) => Promise<void>;
  isLoading: boolean;
  setOnboarded: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasOpenedApp, setHasOpenedApp] = useState<boolean | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    loadUser();
    checkFirstTime();
  }, []);

  useEffect(() => {
    if (isLoading || hasOpenedApp === null) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isOnboarding = segments[0] === 'onboarding';

    if (!user && !inAuthGroup && !isOnboarding) {
      if (!hasOpenedApp) {
        router.replace('/onboarding');
      } else {
        router.replace('/(auth)/login');
      }
    } else if (user && (inAuthGroup || isOnboarding)) {
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading, hasOpenedApp]);

  const checkFirstTime = async () => {
    const value = await AsyncStorage.getItem('hasOpenedApp');
    setHasOpenedApp(value === 'true');
  };

  const loadUser = async () => {
    try {
      const [userData, tokenData] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('token'),
      ])
      if (userData) setUser(JSON.parse(userData));
      if (tokenData) setToken(tokenData);
    } catch (e) {
      console.error('Failed to load user', e);
    } finally {
      setIsLoading(false);
    }
  };

  const setOnboarded = async () => {
    await AsyncStorage.setItem('hasOpenedApp', 'true');
    setHasOpenedApp(true);
  };

  const normalizeUser = (raw: any): User => {
    return {
      id: raw.id ?? raw.utilisateur_id ?? raw.userId,
      email: raw.email,
      telephone: raw.telephone ?? raw.phone ?? raw.telephone,
      phone: raw.telephone ?? raw.phone ?? raw.telephone,
      role: raw.role ?? 'voyageur',
      nom: raw.nom ?? raw.lastName ?? (raw.name ? raw.name.split(' ').slice(-1).join(' ') : undefined),
      prenom: raw.prenom ?? raw.firstName ?? (raw.name ? (raw.name.split(' ').slice(0, -1).join(' ') || raw.name) : undefined),
      name: raw.name ?? (`${raw.prenom ?? ''} ${raw.nom ?? ''}`.trim() || raw.telephone),
      compagnie_id: raw.compagnie_id ?? null,
      date_creation: raw.date_creation ?? raw.createdAt ?? raw.cree_le,
      statut: raw.statut ?? 'actif',
      token: raw.token ?? raw.jwt ?? raw.accessToken,
      notifications: raw.notifications ?? [],
      notifications_enabled: raw.notifications_enabled ?? true,
    }
  }

  const signIn = async (login: string, password: string) => {
    try {
      const result = await auth_api.login(login, password);
      const token = result.token ?? null;
      const data = result.user;

      const u = normalizeUser(data);
      if (token) u.token = token;

      await Promise.all([
        AsyncStorage.setItem('user', JSON.stringify(u)),
        ...(token ? [AsyncStorage.setItem('token', token)] : []),
      ])
      setUser(u);
      setToken(token);
    } catch (error: any) {
      console.error('Sign in failed', error.response?.data || error.message);
      throw error;
    }
  };

  const signUp = async (data: { nom: string; prenom: string; telephone: string; email?: string; mot_de_passe: string; compagnie_id?: number | null }) => {
    try {
      const payload = {
        nom: data.nom,
        prenom: data.prenom,
        telephone: data.telephone,
        email: data.email,
        mot_de_passe: data.mot_de_passe,
        compagnie_id: data.compagnie_id ?? null,
      };
      const result = await auth_api.register(payload);
      const token = result.token ?? null;
      const created = result.user;
      const u = normalizeUser(created);
      if (token) u.token = token;

      await AsyncStorage.setItem('user', JSON.stringify(u));
      if (token) await AsyncStorage.setItem('token', token);
      setUser(u);
      setToken(token);
    } catch (error: any) {
      console.error('Sign up failed', error.response?.data || error.message);
      throw error;
    }
  };

  const signOut = async () => {
    await Promise.all([
      AsyncStorage.removeItem('user'),
      AsyncStorage.removeItem('token'),
    ]);
    setUser(null);
    setToken(null);
  };

  const updateUser = async (raw: any) => {
    const u = normalizeUser(raw);
    if (token) u.token = token;
    await AsyncStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, token, signIn, signUp, signOut, updateUser, isLoading, setOnboarded }}>
      {children}
    </AuthContext.Provider>
  );
}
