import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RemplacementsService } from './remplacements.service';

const date = (value: string) => new Date(`${value}T00:00:00.000Z`);

const activeUser = (
  matricule: string,
  overrides: Record<string, unknown> = {},
) => ({
  matricule,
  nom: `Nom ${matricule}`,
  prenom: `Prénom ${matricule}`,
  email: `${matricule.toLowerCase()}@example.test`,
  telephone: null,
  role: 'CSC',
  est_actif: true,
  est_indisponible: false,
  statut: 'Actif',
  ...overrides,
});

const replacement = (overrides: Record<string, unknown> = {}) => ({
  id_remplacement: 1n,
  titulaire_matricule: 'T0001',
  remplacant_matricule: 'R0001',
  role_remplace: 'CSC',
  region_remplacement: 'Centre',
  service_remplacement: null,
  date_debut: date('2026-08-05'),
  date_fin: date('2026-09-03'),
  date_fin_effective: null,
  duree_prevue_jours: 30,
  motif: 'Congé annuel',
  cree_par: 'A0001',
  est_actif: true,
  notifications_envoyees: false,
  equipe_notifiee: false,
  created_at: new Date('2026-08-01T00:00:00.000Z'),
  updated_at: new Date('2026-08-01T00:00:00.000Z'),
  ...overrides,
});

describe('RemplacementsService', () => {
  let service: RemplacementsService;
  let prisma: any;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-05T12:00:00.000Z'));

    prisma = {
      replacement_temporaire: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      utilisateur: {
        findMany: jest
          .fn()
          .mockResolvedValue([activeUser('T0001'), activeUser('R0001')]),
        findUnique: jest.fn().mockResolvedValue(activeUser('T0001')),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: jest.fn(async (callback: (tx: any) => unknown) =>
        callback(prisma),
      ),
    };
    service = new RemplacementsService(prisma);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const createInput = (overrides: Record<string, unknown> = {}) => ({
    titulaire_matricule: 'T0001',
    remplacant_matricule: 'R0001',
    role_remplace: 'CSC',
    region_remplacement: 'Centre',
    motif: 'Congé annuel',
    date_debut: '2026-08-05',
    date_fin: '2026-09-03',
    duree_prevue_jours: 30,
    cree_par: 'A0001',
    ...overrides,
  });

  it('refuse un titulaire identique au remplaçant', async () => {
    await expect(
      service.create(createInput({ remplacant_matricule: 'T0001' })),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('refuse une durée incohérente avec les dates', async () => {
    await expect(
      service.create(createInput({ duree_prevue_jours: 31 })),
    ).rejects.toThrow('La durée prévue doit correspondre aux dates');
  });

  it('refuse un compte suspendu ou inactif', async () => {
    prisma.utilisateur.findMany.mockResolvedValue([
      activeUser('T0001'),
      activeUser('R0001', { statut: 'Suspendu' }),
    ]);

    await expect(service.create(createInput())).rejects.toThrow(
      'Le remplaçant doit avoir un compte actif',
    );
    expect(prisma.replacement_temporaire.create).not.toHaveBeenCalled();
  });

  it('crée atomiquement un remplacement courant et rend le titulaire indisponible', async () => {
    const row = replacement();
    prisma.replacement_temporaire.findFirst.mockResolvedValue(null);
    prisma.replacement_temporaire.create.mockResolvedValue(row);
    prisma.replacement_temporaire.findUnique.mockResolvedValue(row);

    const result = await service.create(createInput());

    expect(result.id_remplacement).toBe(1);
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(prisma.utilisateur.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          statut: 'Indisponible',
          est_indisponible: true,
        }),
      }),
    );
  });

  it('ne rend pas indisponible le titulaire d’un remplacement futur', async () => {
    const future = replacement({
      date_debut: date('2026-09-01'),
      date_fin: date('2026-09-30'),
    });
    prisma.replacement_temporaire.findFirst.mockResolvedValue(null);
    prisma.replacement_temporaire.create.mockResolvedValue(future);
    prisma.replacement_temporaire.findUnique.mockResolvedValue(future);

    await service.create(
      createInput({ date_debut: '2026-09-01', date_fin: '2026-09-30' }),
    );

    expect(prisma.utilisateur.updateMany).not.toHaveBeenCalled();
  });

  it('termine atomiquement et restaure le titulaire sans autre remplacement courant', async () => {
    const row = replacement();
    prisma.replacement_temporaire.findUnique.mockResolvedValue(row);
    prisma.replacement_temporaire.update.mockResolvedValue({
      ...row,
      est_actif: false,
    });
    prisma.replacement_temporaire.findFirst.mockResolvedValue(null);
    prisma.utilisateur.findUnique.mockResolvedValue(
      activeUser('T0001', {
        statut: 'Indisponible',
        est_indisponible: true,
      }),
    );

    await service.terminer(1);

    expect(prisma.replacement_temporaire.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ est_actif: false }),
      }),
    );
    expect(prisma.utilisateur.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          statut: 'Actif',
          est_indisponible: false,
        }),
      }),
    );
  });

  it('conserve l’indisponibilité lorsqu’un autre remplacement est courant', async () => {
    const row = replacement();
    const other = replacement({ id_remplacement: 2n, motif: 'Mission' });
    prisma.replacement_temporaire.findUnique.mockResolvedValue(row);
    prisma.replacement_temporaire.update.mockResolvedValue({
      ...row,
      est_actif: false,
    });
    prisma.replacement_temporaire.findFirst.mockResolvedValue(other);
    prisma.utilisateur.findUnique.mockResolvedValue(
      activeUser('T0001', {
        statut: 'Indisponible',
        est_indisponible: true,
      }),
    );

    await service.terminer(1);

    expect(prisma.utilisateur.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          statut: 'Indisponible',
          est_indisponible: true,
          motif_indisponibilite: 'Mission',
        }),
      }),
    );
  });

  it('ne réactive jamais un compte suspendu lors de la clôture', async () => {
    const row = replacement();
    prisma.replacement_temporaire.findUnique.mockResolvedValue(row);
    prisma.replacement_temporaire.update.mockResolvedValue({
      ...row,
      est_actif: false,
    });
    prisma.replacement_temporaire.findFirst.mockResolvedValue(null);
    prisma.utilisateur.findUnique.mockResolvedValue(
      activeUser('T0001', {
        statut: 'Suspendu',
        est_indisponible: true,
      }),
    );

    await service.terminer(1);

    expect(prisma.utilisateur.updateMany).not.toHaveBeenCalled();
  });

  it('met à jour atomiquement et restaure un titulaire quand la période devient future', async () => {
    const current = replacement();
    const future = replacement({
      date_debut: date('2026-09-01'),
      date_fin: date('2026-09-30'),
    });
    prisma.replacement_temporaire.findUnique.mockResolvedValue(current);
    prisma.replacement_temporaire.findFirst
      .mockResolvedValueOnce(null) // contrôle de chevauchement
      .mockResolvedValueOnce(null); // aucun autre remplacement courant
    prisma.replacement_temporaire.update.mockResolvedValue(future);
    prisma.utilisateur.findUnique.mockResolvedValue(
      activeUser('T0001', {
        statut: 'Indisponible',
        est_indisponible: true,
      }),
    );

    await service.update(1, {
      date_debut: '2026-09-01',
      date_fin: '2026-09-30',
      duree_prevue_jours: 30,
    });

    expect(prisma.utilisateur.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          statut: 'Actif',
          est_indisponible: false,
        }),
      }),
    );
  });

  it('clôture les expirés et active les remplacements arrivés', async () => {
    const expired = replacement({
      id_remplacement: 1n,
      titulaire_matricule: 'T0001',
      date_debut: date('2026-07-01'),
      date_fin: date('2026-08-04'),
    });
    const arrived = replacement({
      id_remplacement: 2n,
      titulaire_matricule: 'T0002',
      date_debut: date('2026-08-05'),
      date_fin: date('2026-09-03'),
    });
    prisma.replacement_temporaire.findMany
      .mockResolvedValueOnce([expired])
      .mockResolvedValueOnce([arrived]);
    prisma.replacement_temporaire.updateMany.mockResolvedValue({ count: 1 });
    prisma.replacement_temporaire.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(arrived);
    prisma.utilisateur.findUnique
      .mockResolvedValueOnce(
        activeUser('T0001', {
          statut: 'Indisponible',
          est_indisponible: true,
        }),
      )
      .mockResolvedValueOnce(activeUser('T0002'));

    const result = await service.synchronizeScheduledReplacements('2026-08-05');

    expect(result).toEqual({ activated: 1, closed: 1 });
    expect(prisma.replacement_temporaire.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ est_actif: false }),
      }),
    );
    expect(prisma.utilisateur.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ matricule: 'T0001' }),
        data: expect.objectContaining({ statut: 'Actif' }),
      }),
    );
    expect(prisma.utilisateur.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ matricule: 'T0002' }),
        data: expect.objectContaining({ statut: 'Indisponible' }),
      }),
    );
  });

  it('lit les remplacements actifs depuis Prisma/MySQL avec la fenêtre courante', async () => {
    prisma.replacement_temporaire.findMany.mockResolvedValue([]);

    await service.getActifs();

    expect(prisma.replacement_temporaire.findMany).toHaveBeenCalledWith({
      where: {
        est_actif: true,
        date_debut: { lte: expect.any(Date) },
        OR: [{ date_fin: null }, { date_fin: { gte: expect.any(Date) } }],
      },
      orderBy: { date_debut: 'desc' },
    });
  });
});
