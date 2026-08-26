import api from './api';

export interface Ville {
  id: number;
  nom: string;
  pays?: string;
  region?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CompagnieSummary {
  id: number;
  nom: string;
  logo_url?: string | null;
  note_moyenne?: number | null;
  avis_count?: number;
  telephone?: string;
}

export interface VehiculeSummary {
  id: number;
  type?: string | null;
  immatriculation?: string;
  nombre_places?: number;
}

export interface VilleResult {
  id?: number;
  nom: string;
  region?: string | null;
}

export interface TrajetResult {
  id: number;
  compagnie: CompagnieSummary | null;
  vehicule: VehiculeSummary | null;
  chauffeur?: { id: number; nom: string; telephone?: string } | null;
  ville_depart: VilleResult;
  ville_arrivee: VilleResult;
  date_depart: string;
  heure_depart_iso: string;
  heure_depart: string;
  date_arrivee_estimee: string | null;
  duree_minutes: number | null;
  duree_libelle: string | null;
  prix: number;
  devise: string;
  statut: string;
  places_disponibles_total: number;
  places_reservees: number;
  places_restantes: number;
  comporte_plan_sieges: boolean;
}

export interface RechercheFilters {
  depart?: string;
  arrivee?: string;
  date?: string;
  compagnie_id?: number;
  prix_min?: number;
  prix_max?: number;
  heure_debut?: string;
  heure_fin?: string;
  sort_by?: 'heure_depart' | 'prix' | 'duree' | 'compagnie';
  sort_dir?: 'asc' | 'desc';
}

export const villes = {
  async search(q = '', limit = 30): Promise<Ville[]> {
    const { data } = await api.get('/villes', {
      params: { q, limit },
    });
    return (data?.data ?? data ?? []) as Ville[];
  },
  async listAll(limit = 100): Promise<Ville[]> {
    const { data } = await api.get('/villes', { params: { limit } });
    return (data?.data ?? data ?? []) as Ville[];
  },
};

export const trajets = {
  async search(filters: RechercheFilters = {}): Promise<{
    meta: any;
    data: TrajetResult[];
  }> {
    const params: any = {};
    if (filters.depart) params.depart = filters.depart;
    if (filters.arrivee) params.arrivee = filters.arrivee;
    if (filters.date) params.date = filters.date;
    if (filters.compagnie_id) params.compagnie_id = filters.compagnie_id;
    if (filters.prix_min !== undefined) params.prix_min = filters.prix_min;
    if (filters.prix_max !== undefined) params.prix_max = filters.prix_max;
    if (filters.heure_debut) params.heure_debut = filters.heure_debut;
    if (filters.heure_fin) params.heure_fin = filters.heure_fin;
    if (filters.sort_by) params.sort_by = filters.sort_by;
    if (filters.sort_dir) params.sort_dir = filters.sort_dir;

    const { data } = await api.get('/trajets/recherche', { params });
    return {
      meta: data?.meta ?? {},
      data: (data?.data ?? data ?? []) as TrajetResult[],
    };
  },
  async mesTrajets(): Promise<{ success: boolean; data: MonTrajetConduit[]; total: number }> {
    const { data } = await api.get('/trajets/mes-trajets');
    return data;
  },
};

export interface MonTrajetConduit {
  id: number;
  compagnie: { id: number; nom: string; logo_url?: string | null } | null;
  vehicule: { type?: string | null; immatriculation?: string; nombre_places?: number } | null;
  ville_depart: { nom: string };
  ville_arrivee: { nom: string };
  date_depart: string;
  statut: string;
  places_disponibles: number;
  passagers_a_bord: number;
}

export interface PassagerInput {
  nom_complet: string;
  telephone: string;
  numero_siege?: string | null;
}

export interface TrajetDetail extends TrajetResult {
  compagnie: CompagnieSummary | null;
  vehicule: VehiculeSummary | null;
  chauffeur?: { id: number; nom: string; telephone?: string } | null;
  avis?: { id: number; note: number; commentaire?: string | null; utilisateur?: { nom?: string; prenom?: string }; date_avis?: string }[];
  note_moyenne?: number | null;
  avis_count?: number;
  reservations_count?: number;
}

export interface ReservationRecord {
  id: number;
  utilisateur_id: number;
  trajet_id: number;
  nombre_places: number;
  montant_total: number;
  statut: 'en_attente' | 'confirmee' | 'annulee';
  date_reservation: string;
  trajet?: TrajetResult & { compagnie?: CompagnieSummary | null };
  passagers?: PassagerInput[];
  paiements?: { id: number; methode: string; statut: string; reference_transaction?: string | null; montant: number }[];
  billets?: { id: number; numero_billet: string; statut: string; code_qr: string }[];
}

export interface PaiementInitResult {
  success: boolean;
  paiement: {
    id: number;
    reference_transaction: string;
    methode: 'flooz' | 'tmoney' | 'carte' | 'autre';
    montant: number;
    statut: string;
    provider_label: string;
    instructions?: string[] | null;
    mock_webhook_url_reference?: string;
  };
  date_expiration_attente: string;
}

export interface PaiementStatutResult {
  success: boolean;
  reservation: { id: number; statut: string; montant_total: number };
  paiement:
    | { statut: 'aucun'; message: string }
    | {
        id: number;
        methode: string;
        statut: string;
        montant: number;
        reference_transaction?: string | null;
        date_paiement?: string | null;
        peut_annuler?: boolean;
      };
  billets_disponibles: { id: number; numero_billet: string; statut: string; code_qr: string }[];
  trajet_encore_disponible: boolean;
  prochain_poll_ms: number;
}

export interface BilletDetail {
  id: number;
  numero_billet: string;
  statut: 'valide' | 'utilise' | 'annule';
  code_qr: string;
  date_emission: string;
  reservation?: {
    id: number;
    statut: string;
    nombre_places: number;
    passagers?: PassagerInput[];
    trajet?: {
      id: number;
      compagnie?: { id: number; nom: string; logo?: string | null } | null;
      ville_depart: { id?: number; nom: string; region?: string | null };
      ville_arrivee: { id?: number; nom: string; region?: string | null };
      date_depart: string;
      vehicule?: { type?: string | null; immatriculation?: string } | null;
    };
  };
}

export interface ProfileUpdateInput {
  nom?: string;
  prenom?: string;
  email?: string | null;
  telephone?: string;
  notifications_enabled?: boolean;
  mot_de_passe_actuel?: string;
  nouveau_mot_de_passe?: string;
}

export const profile = {
  async update(data: ProfileUpdateInput) {
    const { data: res } = await api.patch('/auth/me', data);
    return res as { success: boolean; user: any };
  },
};

export const auth = {
  async login(login: string, mot_de_passe: string) {
    const payload: any = { mot_de_passe };
    if (login.includes('@')) payload.email = login;
    else payload.telephone = login;
    const { data } = await api.post('/auth/login', payload);
    return {
      user: data?.user ?? data?.data ?? data,
      token: data?.token ?? data?.jwt ?? data?.accessToken ?? null,
    };
  },
  async register(input: { nom: string; prenom: string; telephone: string; email?: string; mot_de_passe: string; compagnie_id?: number | null }) {
    const payload = {
      nom: input.nom,
      prenom: input.prenom,
      telephone: input.telephone,
      email: input.email || undefined,
      mot_de_passe: input.mot_de_passe,
    };
    const { data } = await api.post('/auth/register', payload);
    return {
      user: data?.user ?? data?.data ?? data,
      token: data?.token ?? data?.jwt ?? data?.accessToken ?? null,
    };
  },
  async me() {
    const { data } = await api.get('/auth/me');
    return data?.user ?? data?.data ?? data;
  },
};

export const trajetDetails = {
  async get(id: number | string): Promise<TrajetDetail & any> {
    const { data } = await api.get(`/trajets/${id}`);
    const raw: any = data?.data ?? data;
    const d = raw.date_depart ? new Date(raw.date_depart) : new Date();
    const avisList = raw.avis ?? [];
    const note_moyenne =
      avisList.length > 0
        ? Math.round((avisList.reduce((s: number, a: any) => s + (a.note || 0), 0) / avisList.length) * 10) / 10
        : null;

    const nbPassagersReserves = (raw.reservations || []).reduce(
      (s: number, r: any) => s + (r.passagers?.length ?? r.nombre_places ?? 1),
      0
    );
    const placesDispos =
      raw.places_disponibles ?? raw.vehicule?.nombre_places ?? 30;
    const places_restantes = Math.max(0, placesDispos);

    let duree_minutes: number | null = null;
    if (raw.duree_estimee) {
      const de = new Date(raw.duree_estimee);
      duree_minutes = de.getUTCHours() * 60 + de.getUTCMinutes();
      if (duree_minutes === 0) duree_minutes = null;
    }

    return {
      id: raw.id,
      compagnie: raw.compagnie
        ? {
            id: raw.compagnie.id,
            nom: raw.compagnie.nom,
            logo_url: raw.compagnie.logo,
            telephone: raw.compagnie.telephone,
            note_moyenne,
            avis_count: raw._count?.avis ?? avisList.length,
          }
        : null,
      vehicule: raw.vehicule ?? null,
      chauffeur: raw.driver
        ? {
            id: raw.driver.id,
            nom: `${raw.driver.prenom ?? ''} ${raw.driver.nom ?? ''}`.trim(),
            telephone: raw.driver.telephone,
          }
        : null,
      ville_depart: raw.ville_depart
        ? { id: raw.ville_depart.id, nom: raw.ville_depart.nom, region: raw.ville_depart.region, pays: 'Togo' }
        : { nom: '' },
      ville_arrivee: raw.ville_arrivee
        ? { id: raw.ville_arrivee.id, nom: raw.ville_arrivee.nom, region: raw.ville_arrivee.region, pays: 'Togo' }
        : { nom: '' },
      date_depart: raw.date_depart,
      heure_depart_iso: d.toISOString(),
      heure_depart: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
      date_arrivee_estimee: duree_minutes
        ? new Date(d.getTime() + duree_minutes * 60000).toISOString()
        : null,
      duree_minutes,
      duree_libelle: duree_minutes
        ? `${Math.floor(duree_minutes / 60)}h${String(duree_minutes % 60).padStart(2, '0')}`
        : null,
      prix: raw.prix,
      devise: 'XOF',
      statut: raw.statut,
      places_disponibles_total: placesDispos,
      places_reservees: nbPassagersReserves,
      places_restantes,
      comporte_plan_sieges: false,
      avis: avisList.map((a: any) => ({
        id: a.id,
        note: a.note,
        commentaire: a.commentaire,
        utilisateur: a.utilisateur,
        date_avis: a.date_avis,
      })),
      note_moyenne,
      avis_count: raw._count?.avis ?? avisList.length,
      reservations_count: raw._count?.reservations ?? (raw.reservations?.length ?? 0),
    };
  },
};

export const reservations = {
  async creer(input: { trajet_id: number; passagers: PassagerInput[] }): Promise<{
    success: boolean;
    reservation: ReservationRecord;
    numero_billet?: string;
    montant_attendu: number;
  }> {
    const { data } = await api.post('/reservations', input);
    return data;
  },
  async mesReservations(params?: { statut?: string; limit?: number }): Promise<{
    success: boolean;
    data: ReservationRecord[];
    total: number;
  }> {
    const { data } = await api.get('/reservations/mes-reservations', { params });
    return data;
  },
  async get(id: number | string): Promise<{ success: boolean; data: ReservationRecord }> {
    const { data } = await api.get(`/reservations/${id}`);
    return data;
  },
  async annuler(id: number | string): Promise<{ success: boolean; message?: string }> {
    const { data } = await api.post(`/reservations/${id}/annuler`, {});
    return data;
  },
};

export const paiements = {
  async initier(input: { reservation_id: number; methode: 'flooz' | 'tmoney' | 'carte' | 'autre'; numero_telephone: string }): Promise<PaiementInitResult> {
    const { data } = await api.post('/paiements/initier', input);
    return data;
  },
  async statut(reservation_id: number | string): Promise<PaiementStatutResult> {
    const { data } = await api.get(`/paiements/${reservation_id}/statut`);
    return data;
  },
  async simulerWebhookMock(reference_transaction: string, statut: 'reussi' | 'echoue' = 'reussi'): Promise<any> {
    const { data } = await api.post('/paiements/webhook/mock', {
      reference_transaction,
      statut,
    });
    return data;
  },
};

export const billets = {
  async get(id: number | string): Promise<{ success: boolean; data: BilletDetail }> {
    const { data } = await api.get(`/billets/${id}`);
    return data;
  },
};
