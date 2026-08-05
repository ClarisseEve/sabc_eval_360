import { AdminRolesService } from './admin-roles.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AdminRolesService', () => {
  let service: AdminRolesService;
  let mockPrisma: any;
  let mockPg: any;
  let mockAuditLog: any;

  const validRuleRow = (estActive: boolean) => ({
    id_regle: 'uuid-1',
    nom_regle: 'Règle annuelle',
    description: 'Description',
    est_active: estActive,
    role_evaluateur: 'MANAGER',
    role_evalue: 'COLLABORATEUR',
    type_evaluation: 'annuelle',
    criteres_evaluation_json: {
      criteres: Array.from({ length: 5 }, (_, index) => ({
        id: `critere-${index + 1}`,
        libelle: `Critère ${index + 1}`,
        description: 'Description',
        poids: 20,
        section_label: 'Performance',
        section_order: 1,
        niveau_requis: 3,
        improvement_axis_code: null,
        recommendation_tags: [],
        commentaire_requis_si_note_lt: 3,
        echelle: { min: 1, max: 5 },
      })),
      constraints: {
        meme_region_obligatoire: true,
        meme_branche_obligatoire: true,
      },
    },
    created_at: new Date(),
    updated_at: new Date(),
  });

  beforeEach(() => {
    mockPrisma = {
      role: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      utilisateur: { count: jest.fn() },
    };
    mockPg = {
      query: jest.fn(),
      queryOne: jest.fn(),
      execute: jest.fn(),
    };
    mockAuditLog = {
      log: jest.fn().mockResolvedValue(undefined),
    };
    service = new AdminRolesService(mockPrisma, mockPg, mockAuditLog);
  });

  describe('getRoles', () => {
    it('should return all roles with user counts', async () => {
      const roles = [{ id_role: 1, nom_role: 'DR', _count: { utilisateurs: 5 } }];
      mockPrisma.role.findMany.mockResolvedValue(roles);
      expect(await service.getRoles()).toEqual(roles);
    });
  });

  describe('deleteRole', () => {
    it('should reject deletion when users exist', async () => {
      mockPrisma.role.findUnique.mockResolvedValue({ id_role: 'DR', nom_role: 'Directeur Régional' });
      mockPrisma.utilisateur.count.mockResolvedValue(3);
      await expect(service.deleteRole('DR', 'admin01', '127.0.0.1')).rejects.toThrow(BadRequestException);
    });

    it('should delete when no users', async () => {
      mockPrisma.role.findUnique.mockResolvedValue({ id_role: 'TST', nom_role: 'Test' });
      mockPrisma.utilisateur.count.mockResolvedValue(0);
      mockPrisma.role.delete.mockResolvedValue({ id_role: 'TST' });
      await service.deleteRole('TST', 'admin01', '127.0.0.1');
      expect(mockPrisma.role.delete).toHaveBeenCalledWith({ where: { id_role: 'TST' } });
    });
  });

  describe('toggleRegleActive', () => {
    it('should toggle from active to inactive', async () => {
      mockPg.queryOne.mockResolvedValue({ est_active: true });
      mockPg.execute.mockResolvedValue(undefined);
      const result = await service.toggleRegleActive('uuid-1');
      expect(result.est_active).toBe(false);
    });

    it('should throw if rule not found', async () => {
      mockPg.queryOne.mockResolvedValue(null);
      await expect(service.toggleRegleActive('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('should reject reactivation when the rule is already referenced', async () => {
      mockPg.queryOne
        .mockResolvedValueOnce({ est_active: false })
        .mockResolvedValueOnce({ count: '2' });

      await expect(service.toggleRegleActive('uuid-1')).rejects.toThrow(
        /référencée.*désactivation.*nouvelle règle/i,
      );
      expect(mockPg.execute).not.toHaveBeenCalled();
    });

    it('should reactivate an unreferenced inactive rule', async () => {
      mockPg.queryOne
        .mockResolvedValueOnce({ est_active: false })
        .mockResolvedValueOnce({ count: '0' });
      mockPg.execute.mockResolvedValue(undefined);

      await expect(service.toggleRegleActive('uuid-1')).resolves.toEqual({ est_active: true });
      expect(mockPg.execute).toHaveBeenCalledWith(expect.stringContaining('est_active = $1'), [true, 'uuid-1']);
    });
  });

  describe('updateRegleEvaluation — publication integrity', () => {
    it('rejects in-place changes to an active rule even when it is not referenced', async () => {
      mockPg.queryOne
        .mockResolvedValueOnce(validRuleRow(true))
        .mockResolvedValueOnce({ count: '0' });

      await expect(service.updateRegleEvaluation('uuid-1', { nom_regle: 'Nouvelle règle' })).rejects.toThrow(
        /active\/publiée.*Désactivez.*nouvelle règle/i,
      );
      expect(mockPg.queryOne).toHaveBeenCalledTimes(2);
    });

    it('requires a separate deactivation request before changing an active rule', async () => {
      mockPg.queryOne
        .mockResolvedValueOnce(validRuleRow(true))
        .mockResolvedValueOnce({ count: '0' });

      await expect(
        service.updateRegleEvaluation('uuid-1', { nom_regle: 'Nouvelle règle', est_active: false }),
      ).rejects.toThrow(/Désactivez.*nouvelle règle/i);
      expect(mockPg.queryOne).toHaveBeenCalledTimes(2);
    });

    it.each([
      ['nom', { nom_regle: 'Nouvelle règle' }],
      ['description', { description: 'Nouvelle description' }],
      ['rôle évaluateur', { role_evaluateur: 'DR' }],
      ['rôle évalué', { role_evalue: 'MANAGER' }],
      ['type', { type_evaluation: 'trimestrielle' }],
      ['critères', { criteres: [] }],
      ['sections', { sections: [] }],
      ['visibilité', { visibility_policy: { evaluated: false } }],
      ['analytics', { analytics_metadata: { alerts: false } }],
      ['contrainte région', { meme_region_obligatoire: false }],
      ['contrainte branche', { meme_branche_obligatoire: false }],
    ])('rejects changing %s on an inactive referenced rule', async (_label, payload) => {
      mockPg.queryOne
        .mockResolvedValueOnce(validRuleRow(false))
        .mockResolvedValueOnce({ count: '3' });

      await expect(service.updateRegleEvaluation('uuid-1', payload as any)).rejects.toThrow(
        /référencée.*désactivation.*nouvelle règle/i,
      );
      expect(mockPg.queryOne).toHaveBeenCalledTimes(2);
    });

    it('allows definition changes after an unreferenced rule has been deactivated', async () => {
      mockPg.queryOne
        .mockResolvedValueOnce(validRuleRow(false))
        .mockResolvedValueOnce({ count: '0' })
        .mockResolvedValueOnce({ ...validRuleRow(false), nom_regle: 'Nouvelle règle' });

      const result = await service.updateRegleEvaluation('uuid-1', { nom_regle: 'Nouvelle règle' });

      expect(result.nom_regle).toBe('Nouvelle règle');
      expect(mockPg.queryOne.mock.calls[2][0]).toContain('UPDATE regles_evaluation');
    });

    it('allows deactivation as the only change on a referenced active rule', async () => {
      mockPg.queryOne
        .mockResolvedValueOnce(validRuleRow(true))
        .mockResolvedValueOnce(validRuleRow(false));

      const result = await service.updateRegleEvaluation('uuid-1', { est_active: false });

      expect(result.est_active).toBe(false);
      expect(mockPg.queryOne.mock.calls.some(([sql]: [string]) => sql.includes('COUNT(*)'))).toBe(false);
      expect(mockPg.queryOne.mock.calls[1][0]).toContain('UPDATE regles_evaluation');
      expect(mockPg.queryOne.mock.calls[1][0]).not.toContain('nom_regle =');
      expect(mockPg.queryOne.mock.calls[1][0]).not.toContain('criteres_evaluation_json =');
    });

    it('rejects reactivation when the inactive rule is already referenced', async () => {
      mockPg.queryOne
        .mockResolvedValueOnce(validRuleRow(false))
        .mockResolvedValueOnce({ count: '1' });

      await expect(service.updateRegleEvaluation('uuid-1', { est_active: true })).rejects.toThrow(
        /référencée.*nouvelle règle/i,
      );
      expect(mockPg.queryOne).toHaveBeenCalledTimes(2);
    });
  });

  describe('createRole — business rules', () => {
    it('should force peut_cross_branch=true and portee_geographique=global for DR role', async () => {
      const created = {
        id_role: 'DR',
        nom_role: 'DR',
        peut_cross_branch: true,
        portee_geographique: 'global',
        id_branche: null,
      };
      mockPrisma.role.create.mockResolvedValue(created);

      const result = await service.createRole(
        { id_role: 'DR', nom_role: 'DR', id_branche: 'BR01' },
        'admin01',
        '127.0.0.1',
      );

      const callArg = mockPrisma.role.create.mock.calls[0][0].data;
      expect(callArg.peut_cross_branch).toBe(true);
      expect(callArg.portee_geographique).toBe('global');
      expect(callArg.id_branche).toBeNull();
      expect(result.peut_cross_branch).toBe(true);
    });

    it('should force id_branche=null and niveaux=0 for ADMIN role', async () => {
      const created = {
        id_role: 'ADM',
        nom_role: 'ADMIN',
        id_branche: null,
        niveau_taniere: 0,
        niveau_non_taniere: 0,
      };
      mockPrisma.role.create.mockResolvedValue(created);

      await service.createRole(
        { id_role: 'ADM', nom_role: 'ADMIN', id_branche: 'BR01', niveau_taniere: 5, niveau_non_taniere: 3 },
        'admin01',
        '127.0.0.1',
      );

      const callArg = mockPrisma.role.create.mock.calls[0][0].data;
      expect(callArg.id_branche).toBeNull();
      expect(callArg.niveau_taniere).toBe(0);
      expect(callArg.niveau_non_taniere).toBe(0);
    });

    it('should call auditLog.log after successful role creation', async () => {
      const created = { id_role: 'TST2', nom_role: 'Test2' };
      mockPrisma.role.create.mockResolvedValue(created);

      await service.createRole({ id_role: 'TST2', nom_role: 'Test2' }, 'admin01', '10.0.0.1');

      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          matricule_utilisateur: 'admin01',
          action: 'ROLE_CREATE',
          entite: 'role',
          adresse_ip: '10.0.0.1',
          id_entite: 'TST2',
        }),
      );
    });
  });
});
