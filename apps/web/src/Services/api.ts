// Chemin relatif par défaut: le proxy Vite en dev et nginx en production
// routent /api vers l'API, ce qui évite d'embarquer une URL absolue au build.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const TOKEN_KEY = 'sabc_access_token';

export type ApiRequestConfig = {
  params?: Record<string, string | number | boolean | null | undefined>;
  headers?: Record<string, string>;
  timeout?: number;
};

export type ApiResponse<T = any> = {
  data: T;
  status: number;
  headers: Headers;
};

class ApiError extends Error {
  response: {
    status: number;
    data: any;
    headers: Headers;
  };

  constructor(message: string, response: { status: number; data: any; headers: Headers }) {
    super(message);
    this.name = 'ApiError';
    this.response = response;
  }
}

function normalizeUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/api/')) return `${API_BASE_URL}${path.slice(4)}`;
  if (path.startsWith('/')) return `${API_BASE_URL}${path}`;
  return `${API_BASE_URL}/${path}`;
}

function withQueryString(url: string, params?: ApiRequestConfig['params']) {
  if (!params) return url;

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value == null) return;
    searchParams.append(key, String(value));
  });

  const query = searchParams.toString();
  if (!query) return url;
  return `${url}${url.includes('?') ? '&' : '?'}${query}`;
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  const text = await response.text();
  return text;
}

async function requestBlob(
  path: string,
  config: ApiRequestConfig = {},
): Promise<ApiResponse<Blob>> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), config.timeout ?? 60_000);

  try {
    const token = getToken();
    const headers = new Headers(config.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(withQueryString(normalizeUrl(path), config.params), {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    if (response.status === 401) {
      clearToken();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    if (!response.ok) {
      const data = await parseResponseBody(response);
      throw new ApiError(
        typeof data?.message === 'string' ? data.message : `HTTP ${response.status}`,
        { status: response.status, data, headers: response.headers },
      );
    }

    const blob = await response.blob();
    return { data: blob, status: response.status, headers: response.headers };
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new ApiError('Request timeout', {
        status: 408,
        data: { message: 'Request timeout' },
        headers: new Headers(),
      });
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T = any>(
  method: string,
  path: string,
  body?: any,
  config: ApiRequestConfig = {},
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), config.timeout ?? 30_000);

  try {
    const token = getToken();
    const headers = new Headers(config.headers || {});
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

    if (!isFormData && body != null && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(withQueryString(normalizeUrl(path), config.params), {
      method,
      headers,
      body: body == null ? undefined : isFormData ? body : JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await parseResponseBody(response);

    if (response.status === 401) {
      clearToken();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    if (!response.ok) {
      throw new ApiError(
        typeof data?.message === 'string' ? data.message : `HTTP ${response.status}`,
        { status: response.status, data, headers: response.headers },
      );
    }

    return {
      data: data as T,
      status: response.status,
      headers: response.headers,
    };
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new ApiError('Request timeout', {
        status: 408,
        data: { message: 'Request timeout' },
        headers: new Headers(),
      });
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

const api = {
  get: <T = any>(path: string, config?: ApiRequestConfig) => request<T>('GET', path, undefined, config),
  post: <T = any>(path: string, body?: any, config?: ApiRequestConfig) => request<T>('POST', path, body, config),
  put: <T = any>(path: string, body?: any, config?: ApiRequestConfig) => request<T>('PUT', path, body, config),
  patch: <T = any>(path: string, body?: any, config?: ApiRequestConfig) => request<T>('PATCH', path, body, config),
  delete: <T = any>(path: string, config?: ApiRequestConfig) => request<T>('DELETE', path, undefined, config),
};

export default api;

export const authApi = {
  login: (identifier: string, password: string) =>
    api.post<{ access_token: string; user: any }>('/auth/login', { identifier, password }),

  me: () => api.get('/auth/me'),

  logout: () => api.post('/auth/logout'),
};

export const dashboardApi = {
  getMy: () => api.get('/dashboard'),
  getStats: () => api.get('/dashboard/stats'),
  getAdmin: () => api.get('/dashboard/admin'),
};

export type EvaluationHistoryParams = {
  page?: number;
  limit?: number;
  statut?: 'brouillon' | 'soumis' | 'valide' | 'rejete';
  type_evaluation?: 'auto' | 'descendante' | 'ascendante' | 'pairs' | '360';
  id_periode?: string;
};

export const evaluationsApi = {
  list: () => api.get('/evaluations'),
  create: (data: { evaluateur_matricule: string; evalue_matricule: string; id_periode: string; id_regle: string }) =>
    api.post('/evaluations', data),
  get: (id: string) => api.get(`/evaluations/${id}`),
  update: (id: string, data: { notes: any; commentaire_general?: string }) =>
    api.put(`/evaluations/${id}`, data),
  submit: (id: string) => api.post(`/evaluations/${id}/submit`),
  validate: (id: string, est_validee: boolean, commentaire?: string) =>
    api.post(`/evaluations/${id}/validate`, {
      est_validee,
      commentaire_validation: est_validee ? commentaire : undefined,
      motif_rejet: est_validee ? undefined : commentaire,
    }),
  periodesActives: () => api.get('/evaluations/periodes-actives'),
  eligibles: () => api.get('/evaluations/eligibles'),
  historique: (params?: EvaluationHistoryParams) =>
    api.get('/evaluations/historique', { params }),
  rapport: (idPeriode: string) => api.get(`/evaluations/rapport/${idPeriode}`),
  rappels: (idPeriode: string) => api.post(`/evaluations/rappels/${idPeriode}`),
};

export const periodesApi = {
  list: () => api.get('/periodes'),
  get: (id: string) => api.get(`/periodes/${id}`),
  create: (data: any) => api.post('/periodes', data),
  update: (id: string, data: any) => api.put(`/periodes/${id}`, data),
  delete: (id: string) => api.delete(`/periodes/${id}`),
  toggle: (id: string) => api.post(`/periodes/${id}/toggle`),
};

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

export const remplacementsApi = {
  actifs: () => api.get('/remplacements/actifs'),
  aVenir: () => api.get('/remplacements/a-venir'),
  historique: () => api.get('/remplacements/historique'),
  parUtilisateur: () => api.get('/remplacements/par-utilisateur'),
  get: (id: string) => api.get(`/remplacements/${id}`),
  create: (data: any) => api.post('/remplacements', data),
  update: (id: string, data: any) => api.put(`/remplacements/${id}`, data),
  terminer: (id: string) => api.post(`/remplacements/${id}/terminer`),
};

export const templatesApi = {
  list: () => api.get('/templates'),
  get: (id: string) => api.get(`/templates/${id}`),
  create: (data: any) => api.post('/templates', data),
  update: (id: string, data: any) => api.put(`/templates/${id}`, data),
  delete: (id: string) => api.delete(`/templates/${id}`),
  publish: (id: string) => api.post(`/templates/${id}/publish`),
  unpublish: (id: string) => api.post(`/templates/${id}/unpublish`),
  getMatrice: (idPeriode: string) => api.get(`/templates/matrice/${idPeriode}`),
  assignTemplate: (data: { id_role: string; id_template: string; id_periode: string }) =>
    api.post('/templates/assign', data),
  removeAssignation: (idRole: string, idPeriode: string) =>
    api.delete(`/templates/${idRole}/${idPeriode}`),
};

export const reglesApi = {
  list: () => api.get('/regles'),
  get: (id: string) => api.get(`/regles/${id}`),
  constraints: () => api.get('/regles/constraints'),
  categories: () => api.get('/regles/categories'),
  create: (data: any) => api.post('/regles', data),
  update: (id: string, data: any) => api.put(`/regles/${id}`, data),
  delete: (id: string) => api.delete(`/regles/${id}`),
};

export type AdminUserUpdatePayload = {
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string | null;
  id_role?: string;
  id_region?: string;
  manager_matricule?: string | null;
  id_service?: string | null;
  id_district?: string | null;
  id_secteur?: string | null;
  statut?: 'Actif' | 'Inactif' | 'Suspendu';
};

export const adminApi = {
  users: {
    list: (params?: any) => api.get('/admin/utilisateurs', { params }),
    get: (matricule: string) => api.get(`/admin/utilisateurs/${matricule}`),
    historique: (matricule: string) => api.get(`/admin/utilisateurs/${matricule}/historique`),
    chaine: (matricule: string) => api.get(`/admin/utilisateurs/${matricule}/chaine`),
    create: (data: any) => api.post('/admin/utilisateurs', data),
    update: (matricule: string, data: AdminUserUpdatePayload) =>
      api.put(`/admin/utilisateurs/${matricule}`, data),
    delete: (matricule: string) => api.delete(`/admin/utilisateurs/${matricule}`),
    subordonnes: (matricule: string) => api.get(`/admin/utilisateurs/${matricule}/subordonnes`),
  },
  roles: {
    list: () => api.get('/admin/roles'),
    get: (id: string) => api.get(`/admin/roles/${id}`),
    create: (data: any) => api.post('/admin/roles', data),
    update: (id: string, data: any) => api.put(`/admin/roles/${id}`, data),
    delete: (id: string) => api.delete(`/admin/roles/${id}`),
    regles: () => api.get('/admin/roles/regles/evaluation'),
    getRegle: (id: string) => api.get(`/admin/roles/regles/evaluation/${id}`),
    createRegle: (data: any) => api.post('/admin/roles/regles/evaluation', data),
    updateRegle: (id: string, data: any) => api.put(`/admin/roles/regles/evaluation/${id}`, data),
    toggleRegle: (id: string) => api.patch(`/admin/roles/regles/evaluation/${id}/toggle`),
  },
  structure: {
    overview: () => api.get('/admin/structure'),
    regions: () => api.get('/admin/structure/regions'),
    createRegion: (data: any) => api.post('/admin/structure/regions', data),
    updateRegion: (id: string, data: any) => api.put(`/admin/structure/regions/${id}`, data),
    deleteRegion: (id: string) => api.delete(`/admin/structure/regions/${id}`),
    services: () => api.get('/admin/structure/services'),
    createService: (data: any) => api.post('/admin/structure/services', data),
    deleteService: (id: string) => api.delete(`/admin/structure/services/${id}`),
    districts: () => api.get('/admin/structure/districts'),
    createDistrict: (data: any) => api.post('/admin/structure/districts', data),
    deleteDistrict: (id: string) => api.delete(`/admin/structure/districts/${id}`),
    secteurs: () => api.get('/admin/structure/secteurs'),
    createSecteur: (data: any) => api.post('/admin/structure/secteurs', data),
    deleteSecteur: (id: string) => api.delete(`/admin/structure/secteurs/${id}`),
    branches: () => api.get('/admin/structure/branches'),
  },
  evaluations: {
    history: (params?: EvaluationHistoryParams) =>
      api.get('/admin/evaluations/history', { params }),
    get: (id: string) => api.get(`/admin/evaluations/${id}`),
  },
};

export const analyticsApi = {
  dashboard: () => api.get('/analytics/dashboard'),
  evaluations: () => api.get('/analytics/evaluations'),
  performances: () => api.get('/analytics/performances'),
  adminOverview: (params?: { start_date?: string; end_date?: string }) =>
    api.get('/analytics/admin/overview', { params }),
  adminRoles: (params?: { start_date?: string; end_date?: string }) =>
    api.get('/analytics/admin/roles', { params }),
  adminRegionsOverview: (params?: { start_date?: string; end_date?: string }) =>
    api.get('/analytics/admin/regions', { params }),
  adminRegionDetail: (idRegion: string) => api.get(`/analytics/admin/regions/${idRegion}`),
  region: (idRegion: string) => api.get(`/analytics/region/${idRegion}`),
  classementRegional: (idRegion: string) => api.get(`/analytics/region/${idRegion}/classement`),
  improvementPlans: (params?: { role?: string; id_region?: string; type?: string }) =>
    api.get('/analytics/admin/plans-amelioration', { params }),
  axesAmelioration: (matricule?: string) =>
    api.get(matricule ? `/analytics/axes-amelioration/${matricule}` : '/analytics/axes-amelioration'),
  axesAmeliorationBatch: (matricules: string[]) =>
    api.post('/analytics/axes-amelioration/batch', { matricules }),
  anomalies: (params?: { matricule?: string; id_region?: string }) =>
    api.get('/analytics/anomalies', { params }),
  anomaliesHistory: (params?: { severite?: string; type?: string; resolue?: string; limit?: number }) =>
    api.get('/analytics/anomalies/history', { params }),
  acknowledgeAnomalie: (id: string) =>
    api.patch(`/analytics/anomalies/${id}/acknowledge`),
  runAnomalyDetection: () =>
    api.post('/analytics/anomalies/run-detection'),
  recommandations: (matricule?: string) =>
    api.get(matricule ? `/analytics/recommandations/${matricule}` : '/analytics/recommandations'),
  adminRecommandations: (params?: { statut?: string; type?: string; matricule?: string; limit?: number }) =>
    api.get('/analytics/admin/recommandations', { params }),
  validateRecommandation: (id: string) =>
    api.patch(`/analytics/recommandations/${id}/validate`),
  rejectRecommandation: (id: string, motif: string) =>
    api.patch(`/analytics/recommandations/${id}/reject`, { motif }),
  runRecommandationsGeneration: () =>
    api.post('/analytics/recommandations/run-generation'),
  scores: (matricule?: string) =>
    api.get(matricule ? `/analytics/scores/${matricule}` : '/analytics/scores'),
  scoresBatch: (matricules: string[]) =>
    api.post('/analytics/scores/batch', { matricules }),
  tendances: (params?: { id_region?: string; role?: string; limit?: number }) =>
    api.get('/analytics/tendances', { params }),
};

export const utilisateursApi = {
  list: (params?: any) => api.get('/utilisateurs', { params }),
  get: (matricule: string) => api.get(`/utilisateurs/${matricule}`),
  getSubordonnes: (matricule: string) => api.get(`/utilisateurs/${matricule}/subordonnes`),
  remplacantsDisponibles: (data: any) => api.post('/utilisateurs/remplacants-disponibles', data),
};

export const notificationsApi = {
  list: (params?: { non_lues?: boolean; limit?: number }) => api.get('/notifications', { params }),
  count: () => api.get<{ count: number }>('/notifications/count'),
  markRead: (id: string) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
  sendBulk: (data: {
    titre: string;
    message: string;
    type?: string;
    cible: 'role' | 'region' | 'individu' | 'tous';
    role?: string;
    id_region?: string;
    matricules?: string[];
  }) => api.post('/notifications/send-bulk', data),
};

export const reportsApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get('/reports', { params }),
  create: (titre: string) =>
    api.post('/reports', { titre }),
  get: (id: string) =>
    api.get(`/reports/${id}`),
  update: (id: string, data: { titre?: string; statut?: string }) =>
    api.patch(`/reports/${id}`, data),
  delete: (id: string) =>
    api.delete(`/reports/${id}`),
  addSection: (id: string, section: { type: string; titre: string; contenu?: Record<string, unknown> }) =>
    api.post(`/reports/${id}/sections`, section),
  updateSection: (id: string, sectionId: string, updates: { titre?: string; contenu?: Record<string, unknown> }) =>
    api.patch(`/reports/${id}/sections/${sectionId}`, updates),
  removeSection: (id: string, sectionId: string) =>
    api.delete(`/reports/${id}/sections/${sectionId}`),
  reorderSections: (id: string, orderedIds: string[]) =>
    api.patch(`/reports/${id}/reorder`, { orderedIds }),
  exportPPTX: (id: string) =>
    requestBlob(`/reports/${id}/export/pptx`),
  exportXLSX: (id: string) =>
    requestBlob(`/reports/${id}/export/xlsx`),
  exportHistory: (id: string) =>
    api.get(`/reports/${id}/exports/history`),
};

export const profileApi = {
  update: (data: {
    nom?: string;
    prenom?: string;
    email?: string;
    telephone?: string;
    date_naissance?: string;
    preferences?: {
      langue?: string;
      notifications_email?: boolean;
      notifications_app?: boolean;
      theme?: string;
    };
  }) => api.patch('/auth/profile', data),
  changePassword: (data: { current_password: string; password: string; password_confirmation: string }) =>
    api.post('/auth/change-password', data),
};
