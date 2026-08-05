import { EvaluationsService } from './evaluations.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('EvaluationsService', () => {
  let service: EvaluationsService;
  let mockPg: any;
  let mockPrisma: any;

  let mockValidationNotation: any;
  let mockValidationManager: any;
  let mockNotifications: any;
  let mockEligibility: any;

  const evaluatorActor = { matricule: 'M1', role: 'CDS', is_admin: false };
  const visibilityEnvelope = (overrides: Record<string, any> = {}) => ({
    criteres: [],
    visibility_policy: {
      evaluated: true,
      manager_n1: true,
      upper_management: true,
      admin: true,
      detail: 'aggregated',
      ...overrides,
    },
  });

  beforeEach(() => {
    mockPg = {
      query: jest.fn().mockResolvedValue([]),
      queryOne: jest.fn(),
      execute: jest.fn(),
    };
    mockPrisma = {
      utilisateur: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    mockValidationNotation = {
      normaliserNotes: jest.fn().mockImplementation((rawNotes: any) => {
        if (!Array.isArray(rawNotes)) {
          return { notes: [], errors: ['format invalide'] };
        }
        const errors: string[] = [];
        const notes = rawNotes.flatMap((rawNote: any, index: number) => {
          const id = rawNote?.critere_id ?? rawNote?.id_critere ?? rawNote?.id;
          if (id == null) {
            errors.push(`identifiant manquant ${index}`);
            return [];
          }
          return [{
            critere_id: String(id),
            note: rawNote.note,
            ...(rawNote.commentaire !== undefined
              ? { commentaire: rawNote.commentaire }
              : {}),
          }];
        });
        return { notes, errors };
      }),
      validateBornes: jest.fn().mockReturnValue({ valid: true, errors: [] }),
      validateCommentaires: jest.fn().mockReturnValue({ valid: true, errors: [] }),
      validatePourSoumission: jest.fn().mockReturnValue({ valid: true, errors: [] }),
      calculerNoteGlobale: jest.fn().mockReturnValue(4),
    };
    mockValidationManager = {
      peutValider: jest.fn().mockResolvedValue({ canValidate: false }),
      aPorteeRegionale: jest.fn().mockImplementation((validateur: any) => {
        const role = String(validateur?.role_nom ?? validateur?.role ?? '').toUpperCase();
        return ['DR', 'CDTT'].includes(role) && validateur?.id_region != null;
      }),
      peutValiderUtilisateurs: jest.fn().mockImplementation((validateur: any, evalue: any) => {
        const role = String(validateur?.role_nom ?? validateur?.role ?? '').toUpperCase();
        const direct = evalue?.manager_matricule === validateur?.matricule;
        const regional =
          ['DR', 'CDTT'].includes(role) &&
          validateur?.id_region != null &&
          validateur.id_region === evalue?.id_region;
        return { canValidate: Boolean(direct || regional) };
      }),
      validerMotifRejet: jest.fn().mockReturnValue({ valid: true }),
    };
    mockNotifications = {
      create: jest.fn().mockResolvedValue({}),
    };
    mockEligibility = {
      canEvaluate: jest.fn().mockResolvedValue({ autorise: true }),
    };
    service = new EvaluationsService(
      mockPg,
      mockPrisma,
      mockValidationNotation,
      mockValidationManager,
      mockNotifications,
      mockEligibility,
    );
  });

  describe('findById', () => {
    it('should return evaluation when found', async () => {
      const eval_ = { id_evaluation: 'uuid-1', statut: 'brouillon', evaluateur_matricule: 'M1', evalue_matricule: 'M2' };
      mockPg.queryOne.mockResolvedValue(eval_);
      // enrichEvaluations calls prisma.findMany + pg.query for periodes/regles
      mockPrisma.utilisateur.findMany.mockResolvedValue([]);
      mockPg.query.mockResolvedValue([]);

      const result = await service.findById('uuid-1', evaluatorActor);
      expect(result.id_evaluation).toBe('uuid-1');
    });

    it('should throw NotFoundException when not found', async () => {
      mockPg.queryOne.mockResolvedValue(null);
      await expect(service.findById('missing', evaluatorActor)).rejects.toThrow(NotFoundException);
    });

    it('refuse la lecture à un utilisateur sans lien avec l’évaluation', async () => {
      mockPg.queryOne.mockResolvedValue({
        id_evaluation: 'uuid-1',
        statut: 'brouillon',
        evaluateur_matricule: 'M1',
        evalue_matricule: 'M2',
      });

      await expect(
        service.findById('uuid-1', { matricule: 'OTHER', role: 'CSC' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('autorise un manager habilité à lire une évaluation soumise', async () => {
      mockPg.queryOne.mockResolvedValue({
        id_evaluation: 'uuid-1',
        statut: 'soumis',
        evaluateur_matricule: 'M1',
        evalue_matricule: 'M2',
      });
      mockValidationManager.peutValider.mockResolvedValue({ canValidate: true });

      const result = await service.findById('uuid-1', { matricule: 'MGR1', role: 'CDS' });

      expect(result.id_evaluation).toBe('uuid-1');
      expect(mockValidationManager.peutValider).toHaveBeenCalledWith('MGR1', 'M2');
    });

    it("interdit le détail à l'évalué lorsque visibility_policy.evaluated=false", async () => {
      mockPg.queryOne
        .mockResolvedValueOnce({
          id_evaluation: 'uuid-1',
          statut: 'valide',
          evaluateur_matricule: 'M1',
          evalue_matricule: 'M2',
          id_regle: 'R1',
        })
        .mockResolvedValueOnce({
          criteres_evaluation_json: visibilityEnvelope({ evaluated: false }),
        });

      await expect(
        service.findById('uuid-1', { matricule: 'M2', role: 'CSC' }),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.utilisateur.findMany).not.toHaveBeenCalled();
    });

    it("masque le détail agrégé pour l'évalué mais conserve la note et l'état", async () => {
      const evaluation = {
        id_evaluation: 'uuid-1',
        statut: 'valide',
        evaluateur_matricule: 'M1',
        evalue_matricule: 'M2',
        id_regle: 'R1',
        note_globale: 4.25,
        notations_json: [{ critere_id: 'C1', note: 4, commentaire: 'détail' }],
        commentaire_global: 'commentaire global',
        commentaire_validation: 'commentaire validation',
        motif_rejet: 'motif privé',
      };
      const rule = {
        id_regle: 'R1',
        criteres_evaluation_json: visibilityEnvelope(),
      };
      mockPg.queryOne
        .mockResolvedValueOnce(evaluation)
        .mockResolvedValueOnce({ criteres_evaluation_json: visibilityEnvelope() });
      mockPg.query.mockResolvedValueOnce([rule]);

      const result = await service.findById('uuid-1', { matricule: 'M2', role: 'CSC' });

      expect(result).toEqual(expect.objectContaining({ statut: 'valide', note_globale: 4.25 }));
      expect(result.notations_json).toBeNull();
      expect(result.commentaire_global).toBeNull();
      expect(result.commentaire_validation).toBeNull();
      expect((result as any).motif_rejet).toBeNull();
    });

    it("anonymise une évaluation de pairs avant l'enrichissement, même pour son propriétaire", async () => {
      mockPg.queryOne.mockResolvedValueOnce({
        id_evaluation: 'uuid-pairs',
        statut: 'brouillon',
        type_evaluation: 'pairs',
        evaluateur_matricule: 'M1',
        evalue_matricule: 'M2',
        id_regle: null,
        notations_json: [{ critere_id: 'C1', note: 3 }],
      });
      mockPrisma.utilisateur.findMany.mockResolvedValue([
        { matricule: 'M1', nom: 'Identité', prenom: 'Secrète' },
        { matricule: 'M2', nom: 'Cible', prenom: 'Camille' },
      ]);

      const result = await service.findById('uuid-pairs', evaluatorActor);

      expect(result.evaluateur_matricule).toBeNull();
      expect(result.evaluateur).toBeNull();
      expect(result.notations_json).toEqual([{ critere_id: 'C1', note: 3 }]);
      expect(mockPrisma.utilisateur.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { matricule: { in: ['M2'] } },
        }),
      );
    });

    it("respecte visibility_policy.admin=false pour un administrateur sans autre lien", async () => {
      mockPg.queryOne
        .mockResolvedValueOnce({
          id_evaluation: 'uuid-1',
          statut: 'valide',
          evaluateur_matricule: 'M1',
          evalue_matricule: 'M2',
          id_regle: 'R1',
        })
        .mockResolvedValueOnce({
          criteres_evaluation_json: visibilityEnvelope({ admin: false }),
        });

      await expect(
        service.findById('uuid-1', { matricule: 'ADMIN1', role: 'ADMIN', is_admin: true }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('refuse le manager direct lorsque manager_n1=false', async () => {
      mockPg.queryOne
        .mockResolvedValueOnce({
          id_evaluation: 'uuid-1',
          statut: 'soumis',
          evaluateur_matricule: 'M1',
          evalue_matricule: 'M2',
          id_regle: 'R1',
        })
        .mockResolvedValueOnce({
          criteres_evaluation_json: visibilityEnvelope({ manager_n1: false }),
        });
      mockValidationManager.peutValider.mockResolvedValue({ canValidate: true });
      mockPrisma.utilisateur.findUnique.mockResolvedValue({ manager_matricule: 'MGR1' });

      await expect(
        service.findById('uuid-1', { matricule: 'MGR1', role: 'CDS' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getHistorique', () => {
    it("ne révèle pas les brouillons à l'utilisateur évalué", async () => {
      mockPg.query.mockResolvedValue([]);
      mockPg.queryOne.mockResolvedValue({ total: '0' });

      await service.getHistorique('M2');

      const historySql = String(mockPg.query.mock.calls[0][0]);
      const countSql = String(mockPg.queryOne.mock.calls[0][0]);
      for (const sql of [historySql, countSql]) {
        expect(sql).toContain('e.evalue_matricule = $1');
        expect(sql).toContain("e.statut IN ('soumis', 'valide')");
        expect(sql).toContain("'{visibility_policy,evaluated}'");
      }
    });
  });

  describe('updateNotes', () => {
    it('should update notes for brouillon', async () => {
      mockPg.queryOne.mockResolvedValue({ id_evaluation: 'uuid-1', statut: 'brouillon', evaluateur_matricule: 'M1', evalue_matricule: 'M2' });
      mockPg.query.mockResolvedValue([]);
      mockPg.execute.mockResolvedValue(1);
      const result = await service.updateNotes(
        'uuid-1',
        evaluatorActor,
        [{ critere_id: 'c1', note: 4, poids: 999 }],
      );
      expect(result).toBe(true);
      expect(mockPg.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE evaluations'),
        [JSON.stringify([{ critere_id: 'c1', note: 4 }]), null, 'uuid-1'],
      );
    });

    it('should reject update for non-brouillon', async () => {
      mockPg.queryOne.mockResolvedValue({ id_evaluation: 'uuid-1', statut: 'soumis', evaluateur_matricule: 'M1', evalue_matricule: 'M2' });
      mockPg.query.mockResolvedValue([]);
      await expect(service.updateNotes('uuid-1', evaluatorActor, [])).rejects.toThrow(BadRequestException);
    });

    it('refuse la mise à jour par un non-propriétaire', async () => {
      mockPg.queryOne.mockResolvedValue({
        id_evaluation: 'uuid-1',
        statut: 'brouillon',
        evaluateur_matricule: 'M1',
        evalue_matricule: 'M2',
      });

      await expect(
        service.updateNotes('uuid-1', { matricule: 'OTHER' }, [{ note: 4 }]),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPg.execute).not.toHaveBeenCalled();
    });
  });

  describe('submit', () => {
    const criteres = [
      {
        id: 'c1',
        libelle: 'Critère 1',
        poids: 75,
        commentaire_requis_si_note_lt: 3,
        echelle: { min: 1, max: 5 },
      },
      {
        id: 'c2',
        libelle: 'Critère 2',
        poids: 25,
        commentaire_requis_si_note_lt: 3,
        echelle: { min: 1, max: 5 },
      },
    ];

    const makeEvaluation = (overrides: Record<string, any> = {}) => ({
      id_evaluation: 'uuid-1',
      statut: 'brouillon',
      notations_json: JSON.stringify([
        { note: 5, id_critere: 'c1', poids: 1 },
        { note: 1, id: 'c2', ponderation: 999, commentaire: 'À améliorer' },
      ]),
      evaluateur_matricule: 'M1',
      evalue_matricule: 'M2',
      id_periode: 'p1',
      id_regle: 'r1',
      ...overrides,
    });

    it('soumet avec le contrat canonique et les seuls poids de la règle', async () => {
      const evalRow = makeEvaluation();
      mockPg.queryOne
        .mockResolvedValueOnce(evalRow)
        .mockResolvedValueOnce({ id_periode: 'p1' })
        .mockResolvedValueOnce({ criteres_evaluation_json: { criteres } });
      mockPrisma.utilisateur.findUnique.mockResolvedValue(null);
      mockPg.execute.mockResolvedValue(1);

      const result = await service.submit('uuid-1', evaluatorActor);

      expect(result.success).toBe(true);
      expect(mockValidationNotation.validatePourSoumission).toHaveBeenCalledWith(
        [
          { critere_id: 'c1', note: 5 },
          { critere_id: 'c2', note: 1, commentaire: 'À améliorer' },
        ],
        expect.arrayContaining([
          expect.objectContaining({ id: 'c1', poids: 75 }),
          expect.objectContaining({ id: 'c2', poids: 25 }),
        ]),
      );
      expect(mockValidationNotation.calculerNoteGlobale).toHaveBeenCalledWith(
        expect.any(Array),
        expect.arrayContaining([
          expect.objectContaining({ id: 'c1', poids: 75 }),
          expect.objectContaining({ id: 'c2', poids: 25 }),
        ]),
      );

      const updateParams = mockPg.execute.mock.calls[0][1];
      expect(updateParams[0]).toBe(4);
      expect(JSON.parse(updateParams[1])).toEqual([
        { critere_id: 'c1', note: 5, poids: 75 },
        { critere_id: 'c2', note: 1, commentaire: 'À améliorer', poids: 25 },
      ]);

      const periodCheckSql = String(mockPg.queryOne.mock.calls[1][0]);
      expect(periodCheckSql).toContain("statut = 'ouverte'");
      expect(periodCheckSql).toContain('est_ouverte = true');
      expect(periodCheckSql).toContain('est_cloturee = false');
      expect(periodCheckSql).toContain("AT TIME ZONE 'Africa/Douala'");

      const submitSql = String(mockPg.execute.mock.calls[0][0]);
      expect(submitSql).toContain('WITH periode_active AS');
      expect(submitSql).toContain("statut = 'ouverte'");
      expect(submitSql).toContain('est_ouverte = true');
      expect(submitSql).toContain('est_cloturee = false');
      expect(submitSql).toContain("AT TIME ZONE 'Africa/Douala'");
      expect(submitSql).toContain('FOR UPDATE');
      expect(updateParams[3]).toBe('p1');
    });

    it('rejette une évaluation vide avec une erreur HTTP métier', async () => {
      mockPg.queryOne
        .mockResolvedValueOnce(makeEvaluation({ notations_json: '[]' }))
        .mockResolvedValueOnce({ id_periode: 'p1' });

      await expect(service.submit('uuid-1', evaluatorActor)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPg.execute).not.toHaveBeenCalled();
    });

    it('rejette un état non soumettable avec une erreur HTTP métier', async () => {
      mockPg.queryOne.mockResolvedValueOnce(makeEvaluation({ statut: 'valide' }));

      await expect(service.submit('uuid-1', evaluatorActor)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPg.execute).not.toHaveBeenCalled();
    });

    it('rejette une période fermée avec une erreur HTTP métier', async () => {
      mockPg.queryOne
        .mockResolvedValueOnce(makeEvaluation())
        .mockResolvedValueOnce(null);

      await expect(service.submit('uuid-1', evaluatorActor)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPg.execute).not.toHaveBeenCalled();
    });

    it('rejette une évaluation sans règle, car aucun poids serveur ne serait disponible', async () => {
      mockPg.queryOne
        .mockResolvedValueOnce(makeEvaluation({ id_regle: null }))
        .mockResolvedValueOnce({ id_periode: 'p1' });

      await expect(service.submit('uuid-1', evaluatorActor)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockValidationNotation.calculerNoteGlobale).not.toHaveBeenCalled();
      expect(mockPg.execute).not.toHaveBeenCalled();
    });

    it('rejette une soumission incomplète avec une erreur HTTP métier', async () => {
      mockPg.queryOne
        .mockResolvedValueOnce(makeEvaluation())
        .mockResolvedValueOnce({ id_periode: 'p1' })
        .mockResolvedValueOnce({ criteres_evaluation_json: { criteres } });
      mockValidationNotation.validatePourSoumission.mockReturnValueOnce({
        valid: false,
        errors: ['Évaluation incomplète'],
      });

      await expect(service.submit('uuid-1', evaluatorActor)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPg.execute).not.toHaveBeenCalled();
    });

    it("anonymise aussi l'identité pair dans la notification au manager", async () => {
      mockPg.queryOne
        .mockResolvedValueOnce(makeEvaluation({ type_evaluation: 'pairs' }))
        .mockResolvedValueOnce({ id_periode: 'p1' })
        .mockResolvedValueOnce({ criteres_evaluation_json: { criteres } });
      mockPg.execute.mockResolvedValue(1);
      mockPrisma.utilisateur.findUnique.mockResolvedValueOnce({
        matricule: 'M2',
        prenom: 'Camille',
        nom: 'Cible',
        manager_matricule: 'MGR1',
      });

      await service.submit('uuid-1', evaluatorActor);

      expect(mockPrisma.utilisateur.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.utilisateur.findUnique).toHaveBeenCalledWith({
        where: { matricule: 'M2' },
      });
      const notification = mockNotifications.create.mock.calls[0][0];
      expect(notification.message).toContain('un pair anonyme');
      expect(notification.message).not.toContain('M1');
      expect(notification).not.toHaveProperty('expediteur_matricule');
    });

    it('refuse la soumission par un non-propriétaire', async () => {
      mockPg.queryOne.mockResolvedValue({
        id_evaluation: 'uuid-1',
        statut: 'brouillon',
        evaluateur_matricule: 'M1',
        evalue_matricule: 'M2',
      });

      await expect(service.submit('uuid-1', { matricule: 'OTHER' })).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPg.execute).not.toHaveBeenCalled();
    });
  });

  describe('validate', () => {
    it("lève une erreur 4xx lorsque l'évaluation n'est pas soumise", async () => {
      mockPg.queryOne.mockResolvedValueOnce({
        id_evaluation: 'uuid-1',
        statut: 'brouillon',
        evaluateur_matricule: 'M1',
        evalue_matricule: 'M2',
      });

      await expect(
        service.validate('uuid-1', 'MGR1', true),
      ).rejects.toThrow(BadRequestException);
      expect(mockValidationManager.peutValider).not.toHaveBeenCalled();
      expect(mockPg.execute).not.toHaveBeenCalled();
    });
  });

  describe('getRapport', () => {
    it('applique la politique admin et anonymise les pairs dans le rapport', async () => {
      mockPg.queryOne.mockResolvedValueOnce({
        id_periode: 'P1',
        nom_periode: 'Période 1',
      });
      mockPg.query.mockResolvedValueOnce([
        {
          id_evaluation: 'PAIR-1',
          evaluateur_matricule: 'SECRET',
          evaluateur: { matricule: 'SECRET', nom: 'Identité' },
          evalue_matricule: 'M2',
          id_periode: 'P1',
          type_evaluation: 'pairs',
          statut: 'valide',
          note_globale: 4.5,
          notations_json: [{ note: 4, commentaire: 'privé' }],
          commentaire_global: 'privé',
          __rule_envelope: {
            visibility_policy: { admin: true, detail: 'aggregated' },
          },
        },
        {
          id_evaluation: 'HIDDEN-1',
          evaluateur_matricule: 'M9',
          evalue_matricule: 'M2',
          id_periode: 'P1',
          type_evaluation: 'descendante',
          statut: 'valide',
          __rule_envelope: {
            visibility_policy: { admin: false, detail: 'detailed' },
          },
        },
      ]);

      const result = await service.getRapport('P1', 'ADMIN1');

      expect(result.evaluations).toHaveLength(1);
      expect(result.evaluations[0]).toEqual(expect.objectContaining({
        evaluateur_matricule: null,
        evaluateur: null,
        note_globale: 4.5,
        notations_json: null,
        commentaire_global: null,
      }));
      expect(result.stats.total).toBe(1);
      expect(result.stats.valide).toBe(1);
      const reportSql = String(mockPg.query.mock.calls[0][0]);
      expect(reportSql).toContain("'{visibility_policy,admin}'");
    });
  });

  describe('create', () => {
    const evaluateur = {
      matricule: 'M1',
      nom: 'Eval',
      prenom: 'Eva',
      email: 'eval@example.test',
      role: 'CDS',
      role_nom: 'CDS',
      manager_matricule: null,
      niveau_hierarchique: 2,
      id_region: 'R1',
      id_branche: 'B1',
      statut: 'Actif',
      est_actif: true,
    };
    const evalue = {
      matricule: 'M2',
      nom: 'Cible',
      prenom: 'Cam',
      email: 'cible@example.test',
      role: 'CSC',
      role_nom: 'CSC',
      manager_matricule: 'M1',
      niveau_hierarchique: 3,
      id_region: 'R1',
      id_branche: 'B1',
      statut: 'Actif',
      est_actif: true,
    };

    beforeEach(() => {
      mockPrisma.utilisateur.findUnique.mockImplementation(({ where }: any) =>
        Promise.resolve(where.matricule === 'M1' ? evaluateur : evalue),
      );
      mockPg.execute.mockResolvedValue(1);
    });

    it('applique l’éligibilité et conserve l’UUID canonique de période', async () => {
      const created = { id_evaluation: 'E1', id_periode: 'periode-uuid' };
      mockPg.queryOne
        .mockResolvedValueOnce({
          id_periode: 'periode-uuid',
          code_periode: 'P1',
          statut: 'ouverte',
          est_ouverte: true,
        })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(created);

      const result = await service.create('M1', 'M2', 'periode-uuid');

      expect(result).toEqual(created);
      expect(mockEligibility.canEvaluate).toHaveBeenCalledWith('M1', 'M2', 'subordonnes');
      const insertCall = mockPg.queryOne.mock.calls.find((call: any[]) =>
        String(call[0]).includes('INSERT INTO evaluations'),
      );
      expect(insertCall?.[1][2]).toBe('periode-uuid');
      expect(insertCall?.[1][5]).toBe('periode-uuid');
      expect(insertCall?.[0]).toContain('WITH periode_active AS');
      expect(insertCall?.[0]).toContain("statut = 'ouverte'");
      expect(insertCall?.[0]).toContain('est_ouverte = true');
      expect(insertCall?.[0]).toContain('est_cloturee = false');
      expect(insertCall?.[0]).toContain("AT TIME ZONE 'Africa/Douala'");
      expect(insertCall?.[0]).toContain('FOR UPDATE');

      const periodCheckSql = String(mockPg.queryOne.mock.calls[0][0]);
      expect(periodCheckSql).toContain("statut = 'ouverte'");
      expect(periodCheckSql).toContain('est_ouverte = true');
      expect(periodCheckSql).toContain('est_cloturee = false');
      expect(periodCheckSql).toContain("AT TIME ZONE 'Africa/Douala'");
    });

    it('bloque la création si la période ne satisfait plus tous les invariants actifs', async () => {
      mockPg.queryOne.mockResolvedValueOnce(null);

      await expect(service.create('M1', 'M2', 'periode-uuid')).rejects.toThrow(
        'Période non active',
      );
      expect(
        mockPg.queryOne.mock.calls.some((call: any[]) =>
          String(call[0]).includes('INSERT INTO evaluations'),
        ),
      ).toBe(false);
    });

    it('bloque la création quand le service d’éligibilité la refuse', async () => {
      mockPg.queryOne
        .mockResolvedValueOnce({
          id_periode: 'periode-uuid',
          code_periode: 'P1',
          statut: 'ouverte',
          est_ouverte: true,
        })
        .mockResolvedValueOnce(null);
      mockEligibility.canEvaluate.mockResolvedValue({
        autorise: false,
        raison: 'Cible non éligible',
      });

      await expect(service.create('M1', 'M2', 'periode-uuid')).rejects.toThrow(
        ForbiddenException,
      );
      expect(
        mockPg.queryOne.mock.calls.some((call: any[]) =>
          String(call[0]).includes('INSERT INTO evaluations'),
        ),
      ).toBe(false);
    });
  });

  describe('getEnAttente', () => {
    it('should return pending evaluations', async () => {
      const evals = [
        { id_evaluation: '1', evaluateur_matricule: 'M1', evalue_matricule: 'M2' },
        { id_evaluation: '2', evaluateur_matricule: 'M1', evalue_matricule: 'M3' },
      ];
      mockPg.query.mockResolvedValue(evals);
      mockPrisma.utilisateur.findMany.mockResolvedValue([]);
      const result = await service.getEnAttente('MAT01');
      expect(result).toHaveLength(2);
      expect(result[0].id_evaluation).toBe('1');
      expect(result[1].id_evaluation).toBe('2');
    });
  });

  describe('getAValider', () => {
    const validateur = (role: string, overrides: Record<string, unknown> = {}) => ({
      matricule: `${role}01`,
      manager_matricule: null,
      role,
      role_nom: role,
      id_region: 'RG001',
      ...overrides,
    });
    const evalue = (matricule: string, overrides: Record<string, unknown> = {}) => ({
      matricule,
      manager_matricule: 'AUTRE',
      role: 'CSC',
      role_nom: 'CSC',
      id_region: 'RG001',
      ...overrides,
    });

    it('returns empty for an unknown validator', async () => {
      mockPrisma.utilisateur.findUnique.mockResolvedValue(null);

      const result = await service.getAValider('MGR01');

      expect(result).toEqual([]);
      expect(mockPrisma.utilisateur.findMany).not.toHaveBeenCalled();
      expect(mockPg.query).not.toHaveBeenCalled();
    });

    it('limits a CDS queue to evaluations of direct reports', async () => {
      const cds = validateur('CDS');
      const direct = evalue('SUB1', { manager_matricule: cds.matricule });
      const sameRegionButNotDirect = evalue('SUB2');
      mockPrisma.utilisateur.findUnique.mockResolvedValue(cds);
      mockPrisma.utilisateur.findMany
        .mockResolvedValueOnce([direct, sameRegionButNotDirect])
        .mockResolvedValueOnce([]);
      mockPg.query.mockResolvedValueOnce([
        {
          id_evaluation: 'e1',
          evaluateur_matricule: 'EVAL1',
          evalue_matricule: 'SUB1',
          statut: 'soumis',
          id_regle: null,
        },
      ]);

      const result = await service.getAValider(cds.matricule);

      expect(result).toHaveLength(1);
      expect(mockPg.query.mock.calls[0][1]).toEqual(['SUB1']);
      expect(mockPrisma.utilisateur.findMany.mock.calls[0][0].where).toEqual({
        OR: [{ manager_matricule: cds.matricule }],
      });
    });

    it.each(['DR', 'CDTT'])('includes same-region evaluations for %s', async (role) => {
      const regionalValidator = validateur(role);
      const regional = evalue('SUB1');
      mockPrisma.utilisateur.findUnique.mockResolvedValue(regionalValidator);
      mockPrisma.utilisateur.findMany
        .mockResolvedValueOnce([regional])
        .mockResolvedValueOnce([]);
      mockPg.query.mockResolvedValueOnce([
        {
          id_evaluation: 'e1',
          evaluateur_matricule: 'EVAL1',
          evalue_matricule: 'SUB1',
          statut: 'soumis',
          id_regle: null,
        },
      ]);

      const result = await service.getAValider(regionalValidator.matricule);

      expect(result).toHaveLength(1);
      expect(mockPrisma.utilisateur.findMany.mock.calls[0][0].where.OR).toEqual([
        { manager_matricule: regionalValidator.matricule },
        { id_region: 'RG001' },
      ]);
      expect(mockPg.query.mock.calls[0][1]).toEqual(['SUB1']);
      expect(String(mockPg.query.mock.calls[0][0])).toContain('upper_management');
    });

    it.each([
      ['CDS direct', 'CDS', true, 0],
      ['DR régional', 'DR', false, 1],
    ])(
      'applies manager_n1 versus upper_management visibility for %s',
      async (_label, role, isDirect, expectedCount) => {
        const validator = validateur(role);
        const candidate = evalue('SUB1', {
          manager_matricule: isDirect ? validator.matricule : 'AUTRE',
        });
        mockPrisma.utilisateur.findUnique.mockResolvedValue(validator);
        mockPrisma.utilisateur.findMany
          .mockResolvedValueOnce([candidate])
          .mockResolvedValueOnce([]);
        mockPg.query
          .mockResolvedValueOnce([
            {
              id_evaluation: 'e1',
              evaluateur_matricule: 'EVAL1',
              evalue_matricule: 'SUB1',
              statut: 'soumis',
              type_evaluation: 'descendante',
              id_regle: 'R1',
            },
          ])
          .mockResolvedValueOnce([
            {
              id_regle: 'R1',
              nom_regle: 'Règle test',
              criteres_evaluation_json: visibilityEnvelope({
                manager_n1: false,
                upper_management: true,
              }),
              est_active: true,
              role_evaluateur: null,
              role_evalue: null,
              type_evaluation: 'descendante',
            },
          ]);

        const result = await service.getAValider(validator.matricule);

        expect(result).toHaveLength(expectedCount);
      },
    );

    it('drops any candidate that the shared server authorization refuses', async () => {
      const cds = validateur('CDS');
      const unauthorized = evalue('SUB2');
      mockPrisma.utilisateur.findUnique.mockResolvedValue(cds);
      mockPrisma.utilisateur.findMany.mockResolvedValueOnce([unauthorized]);

      const result = await service.getAValider(cds.matricule);

      expect(result).toEqual([]);
      expect(mockValidationManager.peutValiderUtilisateurs).toHaveBeenCalledWith(
        cds,
        unauthorized,
      );
      expect(mockPg.query).not.toHaveBeenCalled();
    });
  });
});
