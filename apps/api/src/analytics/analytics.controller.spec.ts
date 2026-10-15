import { ForbiddenException } from '@nestjs/common';
import { validate } from 'class-validator';
import { AnalyticsController } from './analytics.controller';
import { DateRangeQueryDto } from './dto/date-range-query.dto';

describe('AnalyticsController — contrôle d\'accès objet (anti-IDOR)', () => {
  let controller: AnalyticsController;
  let mockService: any;
  let mockHierarchy: any;

  const reqFor = (user: any) => ({ user }) as any;
  const MANAGER = { matricule: 'M001', role: 'CDS', is_admin: false, id_region: 'R1' };
  const ADMIN = { matricule: 'A001', role: 'ADMIN', is_admin: true, id_region: 'R1' };

  beforeEach(() => {
    mockService = {
      getScoresUtilisateur: jest.fn().mockResolvedValue({ score_global: 4 }),
      getScoresBatch: jest.fn().mockResolvedValue({}),
      getAxesAmelioration: jest.fn().mockResolvedValue({ axes: [] }),
      getRecommandations: jest.fn().mockResolvedValue({ recommandations: [] }),
      getBenchmarks: jest.fn().mockResolvedValue({ criteres: [] }),
      getTeamHeatmap: jest.fn().mockResolvedValue({ membres: [], criteres: [] }),
      getEvolutionCriteres: jest.fn().mockResolvedValue({ periodes: [], criteres: [] }),
      getRegionAnalytics: jest.fn().mockResolvedValue([]),
      getClassementRegional: jest.fn().mockResolvedValue([]),
    };
    // M001 encadre M002 et M003 (hiérarchie complète)
    mockHierarchy = {
      getTousSubordonnes: jest.fn().mockResolvedValue([{ matricule: 'M002' }, { matricule: 'M003' }]),
    };
    controller = new AnalyticsController(mockService, mockHierarchy);
  });

  it('autorise un utilisateur à consulter ses propres scores', async () => {
    await controller.scoresUtilisateur('M001', reqFor(MANAGER));
    expect(mockService.getScoresUtilisateur).toHaveBeenCalledWith('M001', 'evaluated');
  });

  it('autorise un manager à consulter les scores d\'un subordonné', async () => {
    await controller.scoresUtilisateur('M002', reqFor(MANAGER));
    expect(mockService.getScoresUtilisateur).toHaveBeenCalledWith('M002', 'evaluated');
  });

  it('refuse un utilisateur consultant les scores d\'un tiers non subordonné (IDOR)', async () => {
    await expect(controller.scoresUtilisateur('X999', reqFor(MANAGER))).rejects.toThrow(ForbiddenException);
    expect(mockService.getScoresUtilisateur).not.toHaveBeenCalled();
  });

  it('refuse l\'accès aux axes d\'un tiers non subordonné (IDOR)', async () => {
    await expect(controller.axesAmelioration('X999', reqFor(MANAGER))).rejects.toThrow(ForbiddenException);
    expect(mockService.getAxesAmelioration).not.toHaveBeenCalled();
  });

  it('refuse l\'accès aux recommandations d\'un tiers non subordonné (IDOR)', async () => {
    await expect(controller.recommandations('X999', reqFor(MANAGER))).rejects.toThrow(ForbiddenException);
    expect(mockService.getRecommandations).not.toHaveBeenCalled();
  });

  it('autorise un utilisateur à consulter ses propres benchmarks', async () => {
    await controller.benchmarks('M001', reqFor(MANAGER));
    expect(mockService.getBenchmarks).toHaveBeenCalledWith('M001');
  });

  it('refuse les benchmarks d\'un tiers non subordonné (IDOR)', async () => {
    await expect(controller.benchmarks('X999', reqFor(MANAGER))).rejects.toThrow(ForbiddenException);
    expect(mockService.getBenchmarks).not.toHaveBeenCalled();
  });

  it('heatmap : autorise un manager sur ses subordonnés', async () => {
    await controller.teamHeatmap({ matricules: ['M002', 'M003'] }, reqFor(MANAGER));
    expect(mockService.getTeamHeatmap).toHaveBeenCalledWith(['M002', 'M003']);
  });

  it('heatmap : refuse si un seul matricule échappe au périmètre (IDOR de masse)', async () => {
    await expect(
      controller.teamHeatmap({ matricules: ['M002', 'X999'] }, reqFor(MANAGER)),
    ).rejects.toThrow(ForbiddenException);
    expect(mockService.getTeamHeatmap).not.toHaveBeenCalled();
  });

  it('autorise un utilisateur à consulter sa propre évolution', async () => {
    await controller.evolutionCriteres('M001', reqFor(MANAGER));
    expect(mockService.getEvolutionCriteres).toHaveBeenCalledWith('M001');
  });

  it('refuse l\'évolution d\'un tiers non subordonné (IDOR)', async () => {
    await expect(controller.evolutionCriteres('X999', reqFor(MANAGER))).rejects.toThrow(ForbiddenException);
    expect(mockService.getEvolutionCriteres).not.toHaveBeenCalled();
  });

  it('autorise un admin à consulter n\'importe quel matricule sans appel hiérarchie', async () => {
    await controller.scoresUtilisateur('X999', reqFor(ADMIN));
    expect(mockService.getScoresUtilisateur).toHaveBeenCalledWith('X999', 'admin');
    expect(mockHierarchy.getTousSubordonnes).not.toHaveBeenCalled();
  });

  it('batch : autorise self + subordonnés', async () => {
    await controller.scoresBatch({ matricules: ['M001', 'M002', 'M003'] } as any, reqFor(MANAGER));
    expect(mockService.getScoresBatch).toHaveBeenCalledWith(['M001', 'M002', 'M003']);
  });

  it('batch : refuse si un seul matricule est non autorisé (IDOR de masse)', async () => {
    await expect(
      controller.scoresBatch({ matricules: ['M002', 'X999'] } as any, reqFor(MANAGER)),
    ).rejects.toThrow(ForbiddenException);
    expect(mockService.getScoresBatch).not.toHaveBeenCalled();
  });

  // Sans contrôle de périmètre, tout porteur d'un JWT — y compris un simple
  // opérationnel — pouvait lire les agrégats et le classement nominatif de
  // n'importe quelle région.
  it('autorise la consultation de sa propre région', async () => {
    await controller.region('R1', reqFor(MANAGER));
    expect(mockService.getRegionAnalytics).toHaveBeenCalledWith('R1');
  });

  it('refuse les analytics d\'une autre région', async () => {
    await expect(controller.region('R2', reqFor(MANAGER))).rejects.toThrow(ForbiddenException);
    expect(mockService.getRegionAnalytics).not.toHaveBeenCalled();
  });

  it('refuse le classement nominatif d\'une autre région', async () => {
    await expect(controller.classementRegional('R2', reqFor(MANAGER))).rejects.toThrow(
      ForbiddenException,
    );
    expect(mockService.getClassementRegional).not.toHaveBeenCalled();
  });

  it('autorise un admin sur n\'importe quelle région', async () => {
    await controller.classementRegional('R2', reqFor(ADMIN));
    expect(mockService.getClassementRegional).toHaveBeenCalledWith('R2');
  });

  it('refuse quand la région de l\'utilisateur est inconnue', async () => {
    const sansRegion = { matricule: 'M009', role: 'CDS', is_admin: false };
    await expect(controller.region('R1', reqFor(sansRegion))).rejects.toThrow(ForbiddenException);
  });

  it('refuse en l\'absence d\'utilisateur authentifié', async () => {
    await expect(controller.scoresUtilisateur('M001', reqFor(undefined))).rejects.toThrow(ForbiddenException);
  });
});

describe('DateRangeQueryDto', () => {
  it('accepte des dates ISO valides', async () => {
    const dto = Object.assign(new DateRangeQueryDto(), {
      start_date: '2026-01-01',
      end_date: '2026-06-30',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejette une charge SQL dans un filtre de date', async () => {
    const dto = Object.assign(new DateRangeQueryDto(), {
      start_date: "2026-01-01' OR 1=1 --",
      end_date: '2026-06-30',
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'start_date')).toBe(true);
  });
});
