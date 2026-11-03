import { API_BASE_URL } from './api';

/** Adresse du site (celle de l'API, sans « /api ») : la page de vérification d'un billet s'y trouve. */
export const siteUrl = (): string => API_BASE_URL.replace(/\/api\/?$/, '');

/** Contenu du QR code d'un billet : l'adresse de sa page de vérification, lisible par n'importe quel appareil photo. */
export const billetUrl = (numeroBillet: string): string => `${siteUrl()}/billet/${encodeURIComponent(numeroBillet)}`;

const NUMERO_VALIDE = /^[A-Za-z0-9][A-Za-z0-9._-]{3,63}$/;

/**
 * Retrouve le numéro de billet dans ce que lit la caméra : adresse de vérification (billets récents),
 * QR au format JSON (anciens billets) ou numéro seul. Renvoie null quand ce n'est pas un billet.
 */
export function extractNumeroBillet(brut: string): string | null {
  const texte = (brut ?? '').trim();
  if (!texte || texte.length > 500) return null;

  let candidat = texte;
  if (texte.startsWith('{')) {
    try {
      const numero = JSON.parse(texte)?.numero_billet;
      if (typeof numero !== 'string') return null;
      candidat = numero.trim();
    } catch (_) {
      return null;
    }
  } else if (/^https?:\/\//i.test(texte)) {
    const m = texte.match(/\/billet\/([^/?#]+)/i);
    if (!m) return null;
    try {
      candidat = decodeURIComponent(m[1]);
    } catch (_) {
      return null;
    }
  }
  return NUMERO_VALIDE.test(candidat) ? candidat : null;
}

/** Heure de départ lue en UTC comme sur le billet imprimé : « 07h30 ». */
export function formatHeureUtc(iso?: string | null): string {
  const d = iso ? new Date(iso) : null;
  if (!d || isNaN(d.getTime())) return '';
  return `${String(d.getUTCHours()).padStart(2, '0')}h${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

const JOURS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/**
 * Départ d'un billet, lu en UTC comme sur le billet imprimé (le Togo est à UTC+0) :
 * « mer. 4 nov. · 07h30 », avec l'écart en jours par rapport à aujourd'hui pour repérer un billet d'un autre jour.
 */
export function describeDepart(iso?: string | null): { texte: string; ecartJours: number; relatif: string | null } | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const maintenant = new Date();
  const jour = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const aujourdhui = Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), maintenant.getUTCDate());
  const ecartJours = Math.round((jour - aujourdhui) / 86400000);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const relatif = ecartJours === 0 ? "Aujourd'hui" : ecartJours === 1 ? 'Demain' : ecartJours === -1 ? 'Hier' : null;
  return { texte: `${JOURS[d.getUTCDay()]} ${d.getUTCDate()} ${MOIS[d.getUTCMonth()]} · ${hh}h${mm}`, ecartJours, relatif };
}
