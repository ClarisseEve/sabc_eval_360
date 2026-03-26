import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ─── Token helpers ───────────────────────────────────────────────────────────
const TOKEN_KEY = 'sabc_access_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ─── Axios instance ──────────────────────────────────────────────────────────
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

// Attach JWT to every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handler → redirect to login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      // Avoid infinite redirect loop on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ access_token: string; user: any }>('/auth/login', { email, password }),

  me: () => api.get('/auth/me'),

  logout: () => api.post('/auth/logout'),
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardApi = {
  getMy: () => api.get('/dashboard'),
  getStats: () => api.get('/dashboard/stats'),
  getAdmin: () => api.get('/dashboard/admin'),
};

// ─── Evaluations ─────────────────────────────────────────────────────────────
export const evaluationsApi = {
  list: () => api.get('/evaluations'),
  create: (data: { evaluateur_matricule: string; evalue_matricule: string; id_periode: string; id_regle: string }) =>
    api.post('/evaluations', data),
  get: (id: string) => api.get(`/evaluations/${id}`),
  update: (id: string, data: { notes: any; commentaire_general?: string }) =>
    api.put(`/evaluations/${id}`, data),
  submit: (id: string) => api.post(`/evaluations/${id}/submit`),
  validate: (id: string, est_validee: boolean) =>
    api.post(`/evaluations/${id}/validate`, { est_validee }),
  periodesActives: () => api.get('/evaluations/periodes-actives'),
  eligibles: () => api.get('/evaluations/eligibles'),
  historique: () => api.get('/evaluations/historique'),
  rapport: (idPeriode: string) => api.get(`/evaluations/rapport/${idPeriode}`),
  rappels: (idPeriode: string) => api.post(`/evaluations/rappels/${idPeriode}`),
};

// ─── Periodes ────────────────────────────────────────────────────────────────
export const periodesApi = {
  list: () => api.get('/periodes'),
  get: (id: string) => api.get(`/periodes/${id}`),
  create: (data: any) => api.post('/periodes', data),
  update: (id: string, data: any) => api.put(`/periodes/${id}`, data),
  delete: (id: string) => api.delete(`/periodes/${id}`),
  toggle: (id: string) => api.post(`/periodes/${id}/toggle`),
};

// ─── Hierarchy ───────────────────────────────────────────────────────────────
export const hierarchyApi = {
  getRegion: (idRegion: string) => api.get(`/hierarchy/region/${idRegion}`),
  getRegionStats: (idRegion: string) => api.get(`/hierarchy/region/${idRegion}/stats`),
  getSubordonnes: () => api.get('/hierarchy/subordonnes'),
  getTousSubordonnes: () => api.get('/hierarchy/tous-subordonnes'),
  getChaine: () => api.get('/hierarchy/chaine'),
  getManagersEligibles: (matricule: string) => api.get(`/hierarchy/managers-eligibles/${matricule}`),
  verifierSupervision: (superviseur: string, subordonne: string) =>
    api.post('/hierarchy/verifier-supervision', { superviseur_matricule: superviseur, subordonne_matricule: subordonne }),
  validerAssignation: (matricule: string, manager: string) =>
    api.post('/hierarchy/valider-assignation', { matricule, manager_matricule: manager }),
  assignerManager: (matricule: string, manager: string) =>
    api.post('/hierarchy/assigner-manager', { matricule, manager_matricule: manager }),
};

// ─── Remplacements ──────────────────────────────────────────────────────────
export const remplacementsApi = {
  actifs: () => api.get('/remplacements/actifs'),
  aVenir: () => api.get('/remplacements/a-venir'),
  historique: () => api.get('/remplacements/historique'),
  parUtilisateur: () => api.get('/remplacements/par-utilisateur'),
  create: (data: any) => api.post('/remplacements', data),
  terminer: (id: string) => api.post(`/remplacements/${id}/terminer`),
};

// ─── Templates ───────────────────────────────────────────────────────────────
export const templatesApi = {
  list: () => api.get('/templates'),
  get: (id: string) => api.get(`/templates/${id}`),
  create: (data: any) => api.post('/templates', data),
  update: (id: string, data: any) => api.put(`/templates/${id}`, data),
  delete: (id: string) => api.delete(`/templates/${id}`),
  publish: (id: string) => api.post(`/templates/${id}/publish`),
  unpublish: (id: string) => api.post(`/templates/${id}/unpublish`),
};

// ─── Regles ──────────────────────────────────────────────────────────────────
export const reglesApi = {
  list: () => api.get('/regles'),
  get: (id: string) => api.get(`/regles/${id}`),
  create: (data: any) => api.post('/regles', data),
  update: (id: string, data: any) => api.put(`/regles/${id}`, data),
  delete: (id: string) => api.delete(`/regles/${id}`),
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminApi = {
  // Users
  users: {
    list: (params?: any) => api.get('/admin/users', { params }),
    get: (matricule: string) => api.get(`/admin/users/${matricule}`),
    create: (data: any) => api.post('/admin/users', data),
    update: (matricule: string, data: any) => api.put(`/admin/users/${matricule}`, data),
    delete: (matricule: string) => api.delete(`/admin/users/${matricule}`),
  },
  // Roles
  roles: {
    list: () => api.get('/admin/roles'),
    get: (id: string) => api.get(`/admin/roles/${id}`),
    create: (data: any) => api.post('/admin/roles', data),
    update: (id: string, data: any) => api.put(`/admin/roles/${id}`, data),
    delete: (id: string) => api.delete(`/admin/roles/${id}`),
  },
  // Structure
  structure: {
    regions: () => api.get('/admin/structure/regions'),
    services: () => api.get('/admin/structure/services'),
    districts: () => api.get('/admin/structure/districts'),
    secteurs: () => api.get('/admin/structure/secteurs'),
  },
};

// ─── Analytics ───────────────────────────────────────────────────────────────
export const analyticsApi = {
  dashboard: () => api.get('/analytics/dashboard'),
  evaluations: () => api.get('/analytics/evaluations'),
  performances: () => api.get('/analytics/performances'),
  region: (idRegion: string) => api.get(`/analytics/region/${idRegion}`),
};

// ─── Utilisateurs ────────────────────────────────────────────────────────────
export const utilisateursApi = {
  list: (params?: any) => api.get('/utilisateurs', { params }),
  get: (matricule: string) => api.get(`/utilisateurs/${matricule}`),
  getSubordonnes: (matricule: string) => api.get(`/utilisateurs/${matricule}/subordonnes`),
  remplacantsDisponibles: (data: any) => api.post('/utilisateurs/remplacants-disponibles', data),
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const notificationsApi = {
  list: () => api.get('/notifications'),
  markRead: (id: string) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};
