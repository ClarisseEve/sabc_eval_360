import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { EvaluationsConsultationController } from './evaluations-consultation.controller';
import { EvaluationsConsultationService } from './evaluations-consultation.service';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

/**
 * EvaluationsController et EvaluationsConsultationController partagent le
 * préfixe 'evaluations'. Comme Express résout les routes dans leur ordre
 * d'enregistrement, un @Get(':id') déclaré en premier capture les chemins
 * littéraux 'recues' et 'donnees' et renvoie une 404 à l'utilisateur.
 * Ce test vérifie le routage réel, pas seulement l'ordre du tableau.
 */
describe('Routage du préfixe /evaluations', () => {
  let app: INestApplication;
  const consultation = {
    getRecues: jest.fn().mockResolvedValue({ source: 'recues' }),
    getDonnees: jest.fn().mockResolvedValue({ source: 'donnees' }),
    getStatsRecues: jest.fn().mockResolvedValue({ source: 'recues/stats' }),
    getStatsDonnees: jest.fn().mockResolvedValue({ source: 'donnees/stats' }),
  };
  const evaluations = {
    findById: jest.fn().mockImplementation((id: string) => ({ source: 'byId', id })),
    getEnAttente: jest.fn().mockResolvedValue([]),
    getAValider: jest.fn().mockResolvedValue([]),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      // Ordre identique à celui d'EvaluationsModule.
      controllers: [EvaluationsConsultationController, EvaluationsController],
      providers: [
        { provide: EvaluationsConsultationService, useValue: consultation },
        { provide: EvaluationsService, useValue: evaluations },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: any) => {
          ctx.switchToHttp().getRequest().user = { matricule: 'A0001', is_admin: true };
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    ['/evaluations/recues', 'recues'],
    ['/evaluations/donnees', 'donnees'],
    ['/evaluations/recues/stats', 'recues/stats'],
    ['/evaluations/donnees/stats', 'donnees/stats'],
  ])('%s atteint le contrôleur de consultation', async (path, source) => {
    const res = await request(app.getHttpServer()).get(path).expect(200);
    expect(res.body.source).toBe(source);
    expect(evaluations.findById).not.toHaveBeenCalled();
  });

  it('un identifiant réel atteint toujours @Get(":id")', async () => {
    const res = await request(app.getHttpServer())
      .get('/evaluations/145d83ef-0b1d-488d-b7fb-061e6b0e65ec')
      .expect(200);
    expect(res.body.source).toBe('byId');
    expect(res.body.id).toBe('145d83ef-0b1d-488d-b7fb-061e6b0e65ec');
  });
});
