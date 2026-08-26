import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend de production — utilisé dès qu'aucun serveur local de dev n'est détecté.
const PRODUCTION_API_URL = 'https://togotransit-antg.vercel.app/api';

const getDefaultApiUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // En dev local via Expo Go : si un serveur `next dev` tourne sur la machine
  // de dev, on le cible via son IP LAN plutôt que la prod.
  if (__DEV__) {
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
  }
  return PRODUCTION_API_URL;
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

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;
export function setUnauthorizedHandler(fn: UnauthorizedHandler | null) {
  unauthorizedHandler = fn;
}

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

    if (status === 401) {
      // Le jeton stocké est absent/expiré/invalide : on déconnecte
      // proprement plutôt que de laisser l'écran appelant afficher un
      // message serveur brut ("Non authentifié") sans reconnecter l'utilisateur.
      unauthorizedHandler?.();
    }

    return Promise.reject({
      code: data?.code || (status === 401 ? 'UNAUTHORIZED' : status === 404 ? 'NOT_FOUND' : status >= 500 ? 'SERVER_ERROR' : 'BAD_REQUEST'),
      message: status === 401 ? 'Votre session a expiré. Veuillez vous reconnecter.' : (data?.error || data?.message || 'Une erreur est survenue'),
      status,
      data,
      original: error,
    });
  }
);

export default api;
