import { AdminRolesService } from './admin-roles.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AdminRolesService', () => {
  let service: AdminRolesService;
  let mockPrisma: any;
  let mockPg: any;

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
    service = new AdminRolesService(mockPrisma, mockPg);
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
      await expect(service.deleteRole('DR')).rejects.toThrow(BadRequestException);
    });

    it('should delete when no users', async () => {
      mockPrisma.role.findUnique.mockResolvedValue({ id_role: 'TST', nom_role: 'Test' });
      mockPrisma.utilisateur.count.mockResolvedValue(0);
      mockPrisma.role.delete.mockResolvedValue({ id_role: 'TST' });
      await service.deleteRole('TST');
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
});
