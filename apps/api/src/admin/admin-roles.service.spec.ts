import { AdminRolesService } from './admin-roles.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AdminRolesService', () => {
  let service: AdminRolesService;
  let mockPrisma: any;
  let mockPg: any;
  let mockAuditLog: any;

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
