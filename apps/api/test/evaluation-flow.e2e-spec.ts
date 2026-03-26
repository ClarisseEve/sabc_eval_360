/**
 * E2E Tests: Critical Evaluation 360° Flow
 * Login → Create Evaluation → Update Notes → Submit → Validate
 *
 * Tests the complete lifecycle of an evaluation through the NestJS API.
 * Requires a running database with seeded test data.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Evaluation 360° Flow (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let userProfile: any;

  // Test credentials — must exist in seeded DB
  const TEST_ADMIN = { email: 'admin@sabc.cm', password: 'admin123' };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── 1. Authentication ──────────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    it('should reject invalid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'wrong@sabc.cm', password: 'wrong' });

      expect(res.status).toBe(401);
    });

    it('should return access_token and user on valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(TEST_ADMIN);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('access_token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('email', TEST_ADMIN.email);

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
      expect(res.body).toHaveProperty('email', TEST_ADMIN.email);

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
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/evaluations/historique', () => {
    it('should return evaluation history', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/evaluations/historique')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ─── 4. Full evaluation lifecycle ──────────────────────────────────────────
  //
  // This test group requires seeded periodes & users.
  // If seeded data is not available, these tests will be skipped gracefully.

  describe('Evaluation Lifecycle: create → update → submit → validate', () => {
    let evaluationId: string;
    let periodeId: string;
    let evalueMatricule: string;

    it('should fetch a valid periode and eligible user (setup)', async () => {
      // Get active periods
      const periodesRes = await request(app.getHttpServer())
        .get('/api/evaluations/periodes-actives')
        .set('Authorization', `Bearer ${accessToken}`);

      if (!periodesRes.body.length) {
        console.warn('⚠ No active periodes found — skipping lifecycle tests');
        return;
      }
      periodeId = periodesRes.body[0].id_periode || periodesRes.body[0].id;

      // Get eligible users
      const eligiblesRes = await request(app.getHttpServer())
        .get('/api/evaluations/eligibles')
        .set('Authorization', `Bearer ${accessToken}`);

      if (!eligiblesRes.body.length) {
        console.warn('⚠ No eligible users found — skipping lifecycle tests');
        return;
      }
      evalueMatricule = eligiblesRes.body[0].matricule;
    });

    it('should create an evaluation', async () => {
      if (!periodeId || !evalueMatricule) return;

      const res = await request(app.getHttpServer())
        .post('/api/evaluations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          evaluateur_matricule: userProfile.matricule,
          evalue_matricule: evalueMatricule,
          id_periode: periodeId,
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('id');
      evaluationId = res.body.id;
    });

    it('should fetch the created evaluation', async () => {
      if (!evaluationId) return;

      const res = await request(app.getHttpServer())
        .get(`/api/evaluations/${evaluationId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(evaluationId);
    });

    it('should update evaluation notes', async () => {
      if (!evaluationId) return;

      const res = await request(app.getHttpServer())
        .put(`/api/evaluations/${evaluationId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          notes: [
            { note: 4, commentaire: 'Excellent leadership' },
            { note: 3, commentaire: 'Good communication' },
            { note: 5, commentaire: 'Outstanding results' },
            { note: 4, commentaire: 'Strong teamwork' },
            { note: 3, commentaire: 'Adequate technical skills' },
          ],
          commentaire_general: 'Bonne performance globale.',
        });

      expect(res.status).toBe(200);
    });

    it('should submit the evaluation', async () => {
      if (!evaluationId) return;

      const res = await request(app.getHttpServer())
        .post(`/api/evaluations/${evaluationId}/submit`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect([200, 201]).toContain(res.status);
    });

    it('should validate the evaluation', async () => {
      if (!evaluationId) return;

      const res = await request(app.getHttpServer())
        .post(`/api/evaluations/${evaluationId}/validate`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ est_validee: true });

      expect([200, 201]).toContain(res.status);
    });
  });

  // ─── 5. Hierarchy ──────────────────────────────────────────────────────────

  describe('GET /api/hierarchy', () => {
    it('should return hierarchy data', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/hierarchy/regions')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
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
