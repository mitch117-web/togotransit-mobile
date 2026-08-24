import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getDefaultApiUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Auto-detect host IP from Expo bundler (works with Expo Go on real devices)
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:3000/api`;
    }
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }
  return 'http://localhost:3000/api';
};

export const API_BASE_URL = getDefaultApiUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 25000,
});

export const __debugApiConfig = () => ({
  baseURL: API_BASE_URL,
  platform: Platform.OS,
  envUrl: process.env.EXPO_PUBLIC_API_URL ?? null,
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject({
        code: 'NETWORK_ERROR',
        message: 'Aucune connexion réseau. Vérifiez votre connexion et réessayez.',
        original: error,
      });
    }
    const status = error.response.status;
    const data = error.response.data;
    return Promise.reject({
      code: data?.code || (status === 401 ? 'UNAUTHORIZED' : status === 404 ? 'NOT_FOUND' : status >= 500 ? 'SERVER_ERROR' : 'BAD_REQUEST'),
      message: data?.error || data?.message || (status === 401 ? 'Authentification requise' : 'Une erreur est survenue'),
      status,
      data,
      original: error,
    });
  }
);

export default api;
