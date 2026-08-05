/**
 * E2E Tests: Critical Evaluation 360° Flow
 * Login → Create Evaluation → Update Notes → Submit → Validate
 *
 * Tests the complete lifecycle of an evaluation through the NestJS API.
 * Requires a running database with seeded test data.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';

// Pas de mot de passe litteral dans le depot: le seed impose deja SEED_PASSWORD.
function requireSeedPassword(): string {
  const value = process.env.SEED_PASSWORD;
  if (!value) throw new Error('SEED_PASSWORD est requis pour executer les tests e2e');
  return value;
}

describe('Evaluation 360° Flow (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let userProfile: any;
  jest.setTimeout(30000);

  // Test credentials — must exist in seeded DB
  const TEST_ADMIN = {
    identifier: 'admin@sabc.local',
    password: requireSeedPassword(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(APP_GUARD)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // ─── 1. Authentication ──────────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    it('should reject invalid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ identifier: 'wrong@sabc.cm', password: 'wrong' });

      expect(res.status).toBe(401);
    });

    it('should return access_token and user on valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(TEST_ADMIN);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('access_token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('email', TEST_ADMIN.identifier);

      accessToken = res.body.access_token;
    });
  });

  describe('GET /api/auth/me', () => {
    it('should reject unauthenticated requests', async () => {
      const res = await request(app.getHttpServer()).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return user profile with valid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('matricule');
      expect(res.body).toHaveProperty('email', TEST_ADMIN.identifier);

      userProfile = res.body;
    });
  });

  // ─── 2. Dashboard ───────────────────────────────────────────────────────────

  describe('GET /api/dashboard', () => {
    it('should return dashboard data for authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
    });
  });

  // ─── 3. Evaluations CRUD ───────────────────────────────────────────────────

  describe('GET /api/evaluations', () => {
    it('should reject unauthenticated access', async () => {
      const res = await request(app.getHttpServer()).get('/api/evaluations');
      expect(res.status).toBe(401);
    });

    it('should return evaluations list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/evaluations')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('en_attente');
      expect(res.body).toHaveProperty('a_valider');
    });
  });

  describe('GET /api/evaluations/periodes-actives', () => {
    it('should return active evaluation periods', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/evaluations/periodes-actives')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/evaluations/eligibles', () => {
    it('should return eligible users for evaluation', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/evaluations/eligibles')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('auto');
      expect(res.body).toHaveProperty('subordonnes');
      expect(Array.isArray(res.body.subordonnes)).toBe(true);
    });
  });

  describe('GET /api/evaluations/historique', () => {
    it('should return evaluation history', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/evaluations/historique')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toEqual(
        expect.objectContaining({
          total: expect.any(Number),
          page: 1,
          limit: 20,
          totalPages: expect.any(Number),
        }),
      );
    });
  });

  // ─── 4. Full evaluation lifecycle ──────────────────────────────────────────
  //
  // This test group requires the canonical demo seed prepared by test:e2e:prepare.

  describe('Evaluation Lifecycle: create → update → submit → validate', () => {
    let evaluationId: string;
    let periodeId: string | number;
    let evalueMatricule: string;
    let regleId: string;
    let criteres: Array<{ id: string }> = [];
    let lifecycleToken: string;
    let lifecycleProfile: any;

    it('should prepare an eligible evaluator, target, rule and period', async () => {
      const evaluatorLogin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          identifier: 'S1110',
          password: requireSeedPassword(),
        });
      expect(evaluatorLogin.status).toBe(201);
      lifecycleToken = evaluatorLogin.body.access_token;

      const profileRes = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${lifecycleToken}`);
      expect(profileRes.status).toBe(200);
      lifecycleProfile = profileRes.body;

      const rolesRes = await request(app.getHttpServer())
        .get('/api/admin/roles')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(rolesRes.status).toBe(200);
      const targetRole = rolesRes.body.find(
        (role: any) => String(role.nom_role).toUpperCase() === 'CSC',
      );
      expect(targetRole?.id_role).toBeTruthy();

      evalueMatricule = `E${String(Date.now() % 10_000).padStart(4, '0')}`;
      const createTargetRes = await request(app.getHttpServer())
        .post('/api/admin/utilisateurs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          matricule: evalueMatricule,
          nom: 'Cible',
          prenom: 'E2E',
          email: `e2e.${evalueMatricule.toLowerCase()}@sabc.local`,
          password: requireSeedPassword(),
          id_role: targetRole.id_role,
          id_region: lifecycleProfile.id_region,
          manager_matricule: lifecycleProfile.matricule,
        });
      expect(createTargetRes.status).toBe(201);

      const reglesRes = await request(app.getHttpServer())
        .get('/api/regles')
        .set('Authorization', `Bearer ${lifecycleToken}`);
      expect(reglesRes.status).toBe(200);
      const regle = reglesRes.body.find(
        (candidate: any) =>
          String(candidate.role_evaluateur).toUpperCase() === 'CDS' &&
          String(candidate.role_evalue).toUpperCase() === 'CSC' &&
          candidate.type_evaluation === 'descendante',
      );
      expect(regle?.id_regle).toBeTruthy();
      expect(Array.isArray(regle?.criteres)).toBe(true);
      expect(regle.criteres.length).toBeGreaterThan(0);
      regleId = String(regle.id_regle);
      criteres = regle.criteres;

      const periodesRes = await request(app.getHttpServer())
        .get('/api/evaluations/periodes-actives')
        .set('Authorization', `Bearer ${lifecycleToken}`);
      expect(periodesRes.status).toBe(200);
      expect(periodesRes.body.length).toBeGreaterThan(0);
      periodeId = periodesRes.body[0].id_periode || periodesRes.body[0].id;
    });

    it('should create an evaluation', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/evaluations')
        .set('Authorization', `Bearer ${lifecycleToken}`)
        .send({
          evaluateur_matricule: lifecycleProfile.matricule,
          evalue_matricule: evalueMatricule,
          id_periode: periodeId,
          id_regle: regleId,
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('id_evaluation');
      evaluationId = res.body.id_evaluation;
    });

    it('should fetch the created evaluation', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/evaluations/${evaluationId}`)
        .set('Authorization', `Bearer ${lifecycleToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id_evaluation).toBe(evaluationId);
    });

    it('should update evaluation notes', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/evaluations/${evaluationId}`)
        .set('Authorization', `Bearer ${lifecycleToken}`)
        .send({
          notes: criteres.map((critere) => ({
            critere_id: String(critere.id),
            note: 4,
            commentaire: 'Observation E2E complète.',
          })),
          commentaire_general: 'Bonne performance globale.',
        });

      expect(res.status).toBe(200);
    });

    it('should submit the evaluation', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/evaluations/${evaluationId}/submit`)
        .set('Authorization', `Bearer ${lifecycleToken}`);

      expect([200, 201]).toContain(res.status);
      expect(res.body).toEqual(
        expect.objectContaining({ success: true }),
      );
    });

    it('should validate the evaluation', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/evaluations/${evaluationId}/validate`)
        .set('Authorization', `Bearer ${lifecycleToken}`)
        .send({ est_validee: true });

      expect([200, 201]).toContain(res.status);
      expect(res.body).toEqual(
        expect.objectContaining({ success: true }),
      );
    });
  });

  // ─── 5. Hierarchy ──────────────────────────────────────────────────────────

  describe('GET /api/hierarchy', () => {
    it('should return direct subordinates', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/hierarchy/subordonnes')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ─── 6. Logout ─────────────────────────────────────────────────────────────

  describe('POST /api/auth/logout', () => {
    it('should confirm logout', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });
  });
});
