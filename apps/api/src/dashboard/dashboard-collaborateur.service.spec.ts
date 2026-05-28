import { DashboardCollaborateurService } from './dashboard-collaborateur.service';

describe('DashboardCollaborateurService', () => {
  let service: DashboardCollaborateurService;
  let mockPg: { query: jest.Mock; queryOne: jest.Mock };
  let mockPrisma: { utilisateur: { findMany: jest.Mock } };
  let mockCache: { getOrCompute: jest.Mock };

  beforeEach(() => {
    mockPg = {
      query: jest.fn(),
      queryOne: jest.fn(),
    };
    mockPrisma = {
      utilisateur: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    mockCache = {
      getOrCompute: jest.fn().mockImplementation((_key: string, _ttl: number, fn: () => any) => fn()),
    };

    service = new DashboardCollaborateurService(
      mockPg as any,
      mockPrisma as any,
      mockCache as any,
    );
  });

  describe('getStatutPersonnel', () => {
    it('test 1 — a_completer contient uniquement les statuts brouillon et soumis', async () => {
      // a_completer rows
      mockPg.query
        .mockResolvedValueOnce([
          {
            id_evaluation: 'eval-1',
            evaluateur_matricule: 'MAT001',
            evalue_matricule: 'MAT002',
            statut: 'brouillon',
            id_periode: 'periode-1',
            note_globale: null,
            date_soumission: null,
            created_at: '2026-01-01T00:00:00Z',
            nom_periode: 'S1 2026',
          },
          {
            id_evaluation: 'eval-2',
            evaluateur_matricule: 'MAT001',
            evalue_matricule: 'MAT003',
            statut: 'soumis',
            id_periode: 'periode-1',
            note_globale: null,
            date_soumission: '2026-01-15T00:00:00Z',
            created_at: '2026-01-15T00:00:00Z',
            nom_periode: 'S1 2026',
          },
        ])
        // recues rows (empty)
        .mockResolvedValueOnce([]);

      // score_global
      mockPg.queryOne
        .mockResolvedValueOnce({ score: '0' })
        // période active (pour progression)
        .mockResolvedValueOnce(null);

      mockPrisma.utilisateur.findMany.mockResolvedValue([
        { matricule: 'MAT001', nom: 'Dupont', prenom: 'Jean' },
        { matricule: 'MAT002', nom: 'Martin', prenom: 'Paul' },
        { matricule: 'MAT003', nom: 'Durand', prenom: 'Alice' },
      ]);

      const result = await service.getStatutPersonnel('MAT001');

      expect(result.a_completer).toHaveLength(2);
      const statuts = result.a_completer.map((e) => e.statut);
      expect(statuts).toContain('brouillon');
      expect(statuts).toContain('soumis');
      // Aucun 'valide' ou 'rejete' dans a_completer
      expect(statuts).not.toContain('valide');
      expect(statuts).not.toContain('rejete');
    });

    it('test 2 — recues ne contient PAS les évals avec statut brouillon (AC3 visibilité)', async () => {
      // a_completer rows (empty)
      mockPg.query
        .mockResolvedValueOnce([])
        // recues rows: uniquement soumis et valide, pas brouillon
        .mockResolvedValueOnce([
          {
            id_evaluation: 'eval-10',
            evaluateur_matricule: 'MAT005',
            evalue_matricule: 'MAT001',
            statut: 'soumis',
            id_periode: 'periode-1',
            note_globale: null,
            date_soumission: '2026-02-01T00:00:00Z',
            created_at: '2026-02-01T00:00:00Z',
            nom_periode: 'S1 2026',
          },
          {
            id_evaluation: 'eval-11',
            evaluateur_matricule: 'MAT006',
            evalue_matricule: 'MAT001',
            statut: 'valide',
            id_periode: 'periode-1',
            note_globale: 4.5,
            date_soumission: '2026-01-20T00:00:00Z',
            created_at: '2026-01-20T00:00:00Z',
            nom_periode: 'S1 2026',
          },
        ]);

      mockPg.queryOne
        .mockResolvedValueOnce({ score: '4.5' })
        .mockResolvedValueOnce(null); // pas de période active

      mockPrisma.utilisateur.findMany.mockResolvedValue([]);

      const result = await service.getStatutPersonnel('MAT001');

      // Vérification AC3: aucun brouillon dans recues
      const statutsRecues = result.recues.map((e) => e.statut);
      expect(statutsRecues).not.toContain('brouillon');
    });

    it('test 3 — recues contient bien les statuts soumis et valide', async () => {
      mockPg.query
        .mockResolvedValueOnce([]) // a_completer
        .mockResolvedValueOnce([
          {
            id_evaluation: 'eval-20',
            evaluateur_matricule: 'MAT007',
            evalue_matricule: 'MAT001',
            statut: 'soumis',
            id_periode: 'periode-2',
            note_globale: null,
            date_soumission: '2026-03-01T00:00:00Z',
            created_at: '2026-03-01T00:00:00Z',
            nom_periode: 'S2 2026',
          },
          {
            id_evaluation: 'eval-21',
            evaluateur_matricule: 'MAT008',
            evalue_matricule: 'MAT001',
            statut: 'valide',
            id_periode: 'periode-2',
            note_globale: 3.8,
            date_soumission: '2026-03-05T00:00:00Z',
            created_at: '2026-03-05T00:00:00Z',
            nom_periode: 'S2 2026',
          },
        ]);

      mockPg.queryOne
        .mockResolvedValueOnce({ score: '3.8' })
        .mockResolvedValueOnce(null);

      mockPrisma.utilisateur.findMany.mockResolvedValue([]);

      const result = await service.getStatutPersonnel('MAT001');

      expect(result.recues).toHaveLength(2);
      const statuts = result.recues.map((e) => e.statut);
      expect(statuts).toContain('soumis');
      expect(statuts).toContain('valide');
    });

    it('test 4 — kpi.score_global est calculé correctement', async () => {
      mockPg.query
        .mockResolvedValueOnce([]) // a_completer
        .mockResolvedValueOnce([]); // recues

      // score_global = AVG retourne 4.25
      mockPg.queryOne
        .mockResolvedValueOnce({ score: '4.25' })
        .mockResolvedValueOnce(null); // pas de période active

      mockPrisma.utilisateur.findMany.mockResolvedValue([]);

      const result = await service.getStatutPersonnel('MAT001');

      expect(result.kpi.score_global).toBe(4.25);
    });

    it('test 5 — progression null quand pas de période active', async () => {
      mockPg.query
        .mockResolvedValueOnce([]) // a_completer
        .mockResolvedValueOnce([]); // recues

      mockPg.queryOne
        .mockResolvedValueOnce({ score: '3.5' }) // score_global
        .mockResolvedValueOnce(null); // queryOne pour période active → null

      mockPrisma.utilisateur.findMany.mockResolvedValue([]);

      const result = await service.getStatutPersonnel('MAT001');

      expect(result.kpi.progression_vs_periode_precedente).toBeNull();
    });

    it('test 6 — kpi.nb_a_completer reflète le nombre d\'évals à compléter', async () => {
      mockPg.query
        .mockResolvedValueOnce([
          {
            id_evaluation: 'eval-30',
            evaluateur_matricule: 'MAT001',
            evalue_matricule: 'MAT009',
            statut: 'brouillon',
            id_periode: 'periode-3',
            note_globale: null,
            date_soumission: null,
            created_at: '2026-04-01T00:00:00Z',
            nom_periode: 'S3 2026',
          },
          {
            id_evaluation: 'eval-31',
            evaluateur_matricule: 'MAT001',
            evalue_matricule: 'MAT010',
            statut: 'brouillon',
            id_periode: 'periode-3',
            note_globale: null,
            date_soumission: null,
            created_at: '2026-04-02T00:00:00Z',
            nom_periode: 'S3 2026',
          },
          {
            id_evaluation: 'eval-32',
            evaluateur_matricule: 'MAT001',
            evalue_matricule: 'MAT011',
            statut: 'soumis',
            id_periode: 'periode-3',
            note_globale: null,
            date_soumission: '2026-04-03T00:00:00Z',
            created_at: '2026-04-03T00:00:00Z',
            nom_periode: 'S3 2026',
          },
        ])
        .mockResolvedValueOnce([]); // recues

      mockPg.queryOne
        .mockResolvedValueOnce({ score: '0' })
        .mockResolvedValueOnce(null);

      mockPrisma.utilisateur.findMany.mockResolvedValue([]);

      const result = await service.getStatutPersonnel('MAT001');

      expect(result.kpi.nb_a_completer).toBe(3);
      expect(result.a_completer).toHaveLength(3);
    });

    it('test 7 — progression calculée correctement quand les deux périodes existent', async () => {
      mockPg.query
        .mockResolvedValueOnce([]) // a_completer
        .mockResolvedValueOnce([]); // recues

      mockPg.queryOne
        .mockResolvedValueOnce({ score: '0' }) // score_global (AVG valide)
        .mockResolvedValueOnce({ id_periode: 'periode-active' }) // période active
        .mockResolvedValueOnce({ avg: '4.5' }) // score période active
        .mockResolvedValueOnce({ id_periode: 'periode-prec' }) // période précédente
        .mockResolvedValueOnce({ avg: '4.0' }); // score période précédente

      mockPrisma.utilisateur.findMany.mockResolvedValue([]);

      const result = await service.getStatutPersonnel('MAT001');

      // progression = 4.5 - 4.0 = 0.5
      expect(result.kpi.progression_vs_periode_precedente).toBe(0.5);
    });
  });
});
