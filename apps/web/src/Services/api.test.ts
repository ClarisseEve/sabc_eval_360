import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import api, {
  adminApi,
  evaluationsApi,
  profileApi,
  setToken,
  templatesApi,
} from './api';

const fetchMock = vi.fn<typeof fetch>();
const TEMPLATE_ID = '11111111-1111-4111-8111-111111111111';
const PERIODE_ID = '22222222-2222-4222-8222-222222222222';
const EVALUATION_ID = '33333333-3333-4333-8333-333333333333';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function requestAt(index = 0) {
  const [input, init] = fetchMock.mock.calls[index];

  return {
    url: String(input),
    init: init ?? {},
    json: init?.body == null ? undefined : JSON.parse(String(init.body)),
  };
}

beforeEach(() => {
  const values = new Map<string, string>();
  const localStorageMock: Storage = {
    get length() {
      return values.size;
    },
    clear: vi.fn(() => values.clear()),
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    key: vi.fn((index: number) => [...values.keys()][index] ?? null),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
  };

  vi.stubGlobal('localStorage', localStorageMock);
  vi.stubGlobal('window', {
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
    location: { href: '/', pathname: '/' },
    setTimeout: globalThis.setTimeout.bind(globalThis),
  });
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => jsonResponse({ ok: true }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('socle du client API', () => {
  it('utilise /api comme base relative sans doubler le prefixe', async () => {
    await api.get('/status');
    await api.get('/api/health');

    expect(requestAt(0)).toMatchObject({
      url: '/api/status',
      init: { method: 'GET' },
    });
    expect(requestAt(1)).toMatchObject({
      url: '/api/health',
      init: { method: 'GET' },
    });
  });

  it('transmet le jeton stocke dans Authorization', async () => {
    setToken('jwt-test');

    await api.get('/auth/me');

    const headers = new Headers(requestAt().init.headers);
    expect(headers.get('Authorization')).toBe('Bearer jwt-test');
  });

  it('rejette une erreur HTTP avec le payload et le statut du serveur', async () => {
    const payload = {
      message: 'Le mot de passe actuel est incorrect',
      errors: { current_password: ['Valeur incorrecte'] },
    };
    fetchMock.mockResolvedValueOnce(jsonResponse(payload, 422));

    await expect(
      profileApi.changePassword({
        current_password: 'incorrect',
        password: 'NouveauMotDePasse1!',
        password_confirmation: 'NouveauMotDePasse1!',
      }),
    ).rejects.toMatchObject({
      name: 'ApiError',
      message: payload.message,
      response: { data: payload, status: 422 },
    });
  });
});

describe('contrats templates', () => {
  it('assigne un template avec les trois identifiants attendus', async () => {
    const payload = {
      id_role: 'role-cdv',
      id_template: TEMPLATE_ID,
      id_periode: PERIODE_ID,
    };

    await templatesApi.assignTemplate(payload);

    expect(requestAt()).toMatchObject({
      url: '/api/templates/assign',
      init: { method: 'POST' },
      json: payload,
    });
    expect(new Headers(requestAt().init.headers).get('Content-Type')).toBe(
      'application/json',
    );
  });

  it('supprime une assignation par role et periode', async () => {
    await templatesApi.removeAssignation('role-cdv', PERIODE_ID);

    expect(requestAt()).toMatchObject({
      url: `/api/templates/role-cdv/${PERIODE_ID}`,
      init: { method: 'DELETE' },
    });
  });
});

describe('contrats profil et mot de passe', () => {
  it('met a jour le profil avec PATCH sans alterer les preferences', async () => {
    const payload = {
      email: 'collaborateur@sabc.cm',
      telephone: '+237600000000',
      preferences: {
        langue: 'fr',
        notifications_email: false,
        notifications_app: true,
        theme: 'dark',
      },
    };

    await profileApi.update(payload);

    expect(requestAt()).toMatchObject({
      url: '/api/auth/profile',
      init: { method: 'PATCH' },
      json: payload,
    });
  });

  it('envoie le changement de mot de passe au contrat auth', async () => {
    const payload = {
      current_password: 'AncienMotDePasse1!',
      password: 'NouveauMotDePasse1!',
      password_confirmation: 'NouveauMotDePasse1!',
    };

    await profileApi.changePassword(payload);

    expect(requestAt()).toMatchObject({
      url: '/api/auth/change-password',
      init: { method: 'POST' },
      json: payload,
    });
  });
});

describe('payloads de validation d evaluation', () => {
  it('reserve le commentaire de validation a une acceptation', async () => {
    await evaluationsApi.validate(EVALUATION_ID, true, 'Evaluation conforme');

    expect(requestAt()).toMatchObject({
      url: `/api/evaluations/${EVALUATION_ID}/validate`,
      init: { method: 'POST' },
      json: {
        est_validee: true,
        commentaire_validation: 'Evaluation conforme',
      },
    });
  });

  it('reserve le motif de rejet a un refus', async () => {
    await evaluationsApi.validate(
      EVALUATION_ID,
      false,
      'Les notes attribuees sont incoherentes',
    );

    expect(requestAt()).toMatchObject({
      url: `/api/evaluations/${EVALUATION_ID}/validate`,
      init: { method: 'POST' },
      json: {
        est_validee: false,
        motif_rejet: 'Les notes attribuees sont incoherentes',
      },
    });
  });
});

describe('contrats de l historique des evaluations', () => {
  it('transmet pagination et filtres à l historique personnel', async () => {
    await evaluationsApi.historique({
      page: 2,
      limit: 20,
      statut: 'valide',
      type_evaluation: 'pairs',
      id_periode: PERIODE_ID,
    });

    expect(requestAt()).toMatchObject({
      url: `/api/evaluations/historique?page=2&limit=20&statut=valide&type_evaluation=pairs&id_periode=${PERIODE_ID}`,
      init: { method: 'GET' },
    });
  });

  it('transmet le filtre de statut à l historique administrateur', async () => {
    await adminApi.evaluations.history({
      page: 3,
      limit: 30,
      statut: 'rejete',
    });

    expect(requestAt()).toMatchObject({
      url: '/api/admin/evaluations/history?page=3&limit=30&statut=rejete',
      init: { method: 'GET' },
    });
  });
});
