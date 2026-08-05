import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { PrismaService } from '../prisma/prisma.service';
import { DatabasePgService } from '../database/database-pg.service';
import { EvaluationsService } from '../evaluations/evaluations.service';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { CreateUserDto } from './dto/user.dto';
import { UpdateUserDto } from './dto/user.dto';

const ADMIN_MATRICULE = 'ADMIN';
const ADMIN_IP = '127.0.0.1';

const makeCreateDto = (
  overrides: Partial<CreateUserDto> = {},
): CreateUserDto => ({
  matricule: 'U0001',
  nom: 'Dupont',
  prenom: 'Jean',
  email: 'jean.dupont@sabc.cm',
  password: 'Fixture-NotARealSecret-1',
  id_role: 'R001',
  id_region: 'RG01',
  ...overrides,
});

const makeRole = (overrides: Record<string, unknown> = {}) => ({
  id_role: 'R001',
  nom_role: 'CSC',
  description: 'Chef Service Commercial',
  id_branche: 'BR001',
  niveau_taniere: 3,
  niveau_non_taniere: 2,
  peut_cross_branch: false,
  ...overrides,
});

const makeRegion = (overrides: Record<string, unknown> = {}) => ({
  id_region: 'RG01',
  nom_region: 'Littoral',
  est_taniere: true,
  ...overrides,
});

const makeDbUser = (overrides: Record<string, unknown> = {}) => ({
  matricule: 'U0001',
  nom: 'Dupont',
  prenom: 'Jean',
  email: 'jean.dupont@sabc.cm',
  telephone: null,
  password: '$2b$10$hashedpw',
  remember_token: null,
  role: 'CSC',
  role_nom: 'Chef Service Commercial',
  id_region: 'RG01',
  region_nom: 'Littoral',
  type_region: 'taniere',
  id_branche: 'BR001',
  manager_matricule: null,
  niveau_hierarchique: 2,
  statut: 'Actif',
  est_actif: true,
  est_admin: false,
  est_indisponible: false,
  region: { id_region: 'RG01', nom_region: 'Littoral' },
  branche: null,
  ...overrides,
});

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let prisma: jest.Mocked<PrismaService>;
  let pg: jest.Mocked<DatabasePgService>;
  let hierarchyService: jest.Mocked<HierarchyService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        {
          provide: PrismaService,
          useValue: {
            utilisateur: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            role: {
              findUnique: jest.fn().mockResolvedValue(makeRole()),
            },
            region: {
              findUnique: jest.fn().mockResolvedValue(makeRegion()),
            },
          },
        },
        {
          provide: DatabasePgService,
          useValue: {
            queryOne: jest.fn().mockResolvedValue({
              total: '0',
              validees: '0',
              score_moyen: null,
            }),
            query: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: EvaluationsService,
          useValue: {
            getHistorique: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: HierarchyService,
          useValue: {
            validerAssignationManager: jest.fn(),
            getChaineHierarchique: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            log: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AdminUsersService>(AdminUsersService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    pg = module.get(DatabasePgService) as jest.Mocked<DatabasePgService>;
    hierarchyService = module.get(
      HierarchyService,
    ) as jest.Mocked<HierarchyService>;
    auditLogService = module.get(
      AuditLogService,
    ) as jest.Mocked<AuditLogService>;
  });

  // ─── createUser ────────────────────────────────────────────────────────────

  describe('createUser', () => {
    it('should create user successfully when manager is valid (same region)', async () => {
      const dto = makeCreateDto({ manager_matricule: 'MGR01' });
      const createdUser = makeDbUser({ manager_matricule: 'MGR01' });
      const manager = makeDbUser({
        matricule: 'MGR01',
        niveau_hierarchique: 2,
      });

      (prisma.utilisateur.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(manager);
      (prisma.utilisateur.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.utilisateur.create as jest.Mock).mockResolvedValue(createdUser);

      const result = await service.createUser(dto, ADMIN_MATRICULE, ADMIN_IP);

      expect(hierarchyService.validerAssignationManager).not.toHaveBeenCalled();
      expect(prisma.utilisateur.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: 'CSC',
          role_nom: 'CSC',
          id_region: 'RG01',
          region_nom: 'Littoral',
          type_region: 'taniere',
          id_branche: 'BR001',
          niveau_hierarchique: 3,
          manager_matricule: 'MGR01',
        }),
      });
      expect(result).not.toHaveProperty('password');
      expect(result.matricule).toBe('U0001');
    });

    it('should throw BadRequestException when manager is in a different region', async () => {
      const dto = makeCreateDto({ manager_matricule: 'MGR02' });
      const manager = makeDbUser({
        matricule: 'MGR02',
        id_region: 'RG02',
        niveau_hierarchique: 2,
      });

      (prisma.utilisateur.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(manager);
      (prisma.utilisateur.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createUser(dto, ADMIN_MATRICULE, ADMIN_IP),
      ).rejects.toThrow(BadRequestException);

      expect(hierarchyService.validerAssignationManager).not.toHaveBeenCalled();
    });

    it('should derive denormalized fields from role and region and ignore spoofed values', async () => {
      const dto = {
        ...makeCreateDto({ telephone: '', manager_matricule: '' }),
        role: 'ADMIN',
        role_nom: 'Administrateur',
        region_nom: 'Fausse région',
        type_region: 'non-taniere',
        id_branche: 'FAKE',
        niveau_hierarchique: 0,
        est_admin: true,
      } as CreateUserDto;
      const createdUser = makeDbUser();

      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.utilisateur.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.utilisateur.create as jest.Mock).mockResolvedValue(createdUser);

      await service.createUser(dto, ADMIN_MATRICULE, ADMIN_IP);

      expect(prisma.utilisateur.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: 'CSC',
          role_nom: 'CSC',
          region_nom: 'Littoral',
          type_region: 'taniere',
          id_branche: 'BR001',
          niveau_hierarchique: 3,
          est_admin: false,
          telephone: null,
          manager_matricule: null,
        }),
      });
    });

    it('should reject an inactive manager before creating the user', async () => {
      const dto = makeCreateDto({ manager_matricule: 'MGR01' });
      const manager = makeDbUser({
        matricule: 'MGR01',
        niveau_hierarchique: 2,
        statut: 'Inactif',
        est_actif: false,
      });

      (prisma.utilisateur.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(manager);
      (prisma.utilisateur.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createUser(dto, ADMIN_MATRICULE, ADMIN_IP),
      ).rejects.toThrow('Le manager doit être actif');
      expect(prisma.utilisateur.create).not.toHaveBeenCalled();
    });

    it('should reject an unknown manager without requiring the candidate to exist first', async () => {
      const dto = makeCreateDto({ manager_matricule: 'MGR99' });

      (prisma.utilisateur.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      (prisma.utilisateur.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createUser(dto, ADMIN_MATRICULE, ADMIN_IP),
      ).rejects.toThrow('manager introuvable');
      expect(hierarchyService.validerAssignationManager).not.toHaveBeenCalled();
      expect(prisma.utilisateur.create).not.toHaveBeenCalled();
    });

    it('should reject a manager who is not above the new user', async () => {
      const dto = makeCreateDto({ manager_matricule: 'MGR01' });
      const manager = makeDbUser({
        matricule: 'MGR01',
        niveau_hierarchique: 3,
      });

      (prisma.utilisateur.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(manager);
      (prisma.utilisateur.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createUser(dto, ADMIN_MATRICULE, ADMIN_IP),
      ).rejects.toThrow('Le manager doit être à un niveau supérieur');
    });

    it('should enforce cross-branch permission for the prospective manager', async () => {
      const dto = makeCreateDto({ manager_matricule: 'MGR01' });
      const manager = makeDbUser({
        matricule: 'MGR01',
        id_branche: 'BR002',
        niveau_hierarchique: 2,
        role: 'CDS',
      });

      (prisma.utilisateur.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(manager);
      (prisma.utilisateur.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.role.findUnique as jest.Mock)
        .mockResolvedValueOnce(makeRole())
        .mockResolvedValueOnce(
          makeRole({ nom_role: 'CDS', peut_cross_branch: false }),
        );

      await expect(
        service.createUser(dto, ADMIN_MATRICULE, ADMIN_IP),
      ).rejects.toThrow('peut_cross_branch');
      expect(prisma.role.findUnique).toHaveBeenLastCalledWith({
        where: { nom_role: 'CDS' },
      });
    });

    it('should reject a role without a hierarchy level for the selected region type', async () => {
      const dto = makeCreateDto();

      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.utilisateur.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(
        makeRole({ niveau_taniere: null }),
      );

      await expect(
        service.createUser(dto, ADMIN_MATRICULE, ADMIN_IP),
      ).rejects.toThrow("n'est pas configuré pour ce type de région");
      expect(prisma.utilisateur.create).not.toHaveBeenCalled();
    });

    it('should call auditLogService.log with USER_CREATE after successful creation', async () => {
      const dto = makeCreateDto();
      const createdUser = makeDbUser();

      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.utilisateur.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.utilisateur.create as jest.Mock).mockResolvedValue(createdUser);

      await service.createUser(dto, ADMIN_MATRICULE, ADMIN_IP);

      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          matricule_utilisateur: ADMIN_MATRICULE,
          action: 'USER_CREATE',
          entite: 'utilisateur',
          adresse_ip: ADMIN_IP,
          id_entite: 'U0001',
        }),
      );
    });

    it('should throw BadRequestException when matricule already exists', async () => {
      const dto = makeCreateDto();
      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(
        makeDbUser(),
      );

      await expect(
        service.createUser(dto, ADMIN_MATRICULE, ADMIN_IP),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── updateUser ────────────────────────────────────────────────────────────

  describe('updateUser', () => {
    it('should validate a changed manager against the prospective user state', async () => {
      const existingUser = makeDbUser({ manager_matricule: 'OLD01' });
      const prospectiveRole = makeRole({
        id_role: 'R002',
        nom_role: 'CDV',
        id_branche: 'BR002',
        niveau_taniere: 4,
      });
      const prospectiveRegion = makeRegion({
        id_region: 'RG02',
        nom_region: 'Centre',
      });
      const manager = makeDbUser({
        matricule: 'NEW01',
        id_region: 'RG02',
        id_branche: 'BR002',
        niveau_hierarchique: 2,
      });
      const updatedUser = makeDbUser({
        manager_matricule: 'NEW01',
        role: 'CDV',
        id_region: 'RG02',
      });

      (prisma.utilisateur.findUnique as jest.Mock)
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(manager);
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(prospectiveRole);
      (prisma.region.findUnique as jest.Mock).mockResolvedValue(
        prospectiveRegion,
      );
      (prisma.utilisateur.update as jest.Mock).mockResolvedValue(updatedUser);

      await service.updateUser(
        'U0001',
        {
          id_role: 'R002',
          id_region: 'RG02',
          manager_matricule: 'NEW01',
        },
        ADMIN_MATRICULE,
        ADMIN_IP,
      );

      expect(hierarchyService.validerAssignationManager).not.toHaveBeenCalled();
      expect(hierarchyService.getChaineHierarchique).toHaveBeenCalledWith(
        'NEW01',
      );
      expect(prisma.utilisateur.update).toHaveBeenCalledWith({
        where: { matricule: 'U0001' },
        data: expect.objectContaining({
          role: 'CDV',
          role_nom: 'CDV',
          id_region: 'RG02',
          region_nom: 'Centre',
          id_branche: 'BR002',
          niveau_hierarchique: 4,
          manager_matricule: 'NEW01',
        }),
      });
    });

    it('should NOT call validerAssignationManager when manager_matricule is unchanged', async () => {
      const existingUser = makeDbUser({
        manager_matricule: 'MGR01',
        niveau_hierarchique: 3,
      });
      const updatedUser = makeDbUser({
        nom: 'Martin',
        manager_matricule: 'MGR01',
      });

      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(
        existingUser,
      );
      (prisma.utilisateur.update as jest.Mock).mockResolvedValue(updatedUser);

      await service.updateUser(
        'U0001',
        { nom: 'Martin' },
        ADMIN_MATRICULE,
        ADMIN_IP,
      );

      expect(hierarchyService.validerAssignationManager).not.toHaveBeenCalled();
      expect(hierarchyService.getChaineHierarchique).not.toHaveBeenCalled();
    });

    it('should derive every denormalized field from canonical role and region identifiers', async () => {
      const existingUser = makeDbUser();
      const updatedUser = makeDbUser({
        role: 'ADMIN',
        statut: 'Suspendu',
        est_actif: false,
        est_admin: true,
      });
      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(
        existingUser,
      );
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(
        makeRole({
          id_role: 'R0000',
          nom_role: 'ADMIN',
          id_branche: null,
          niveau_taniere: 0,
          niveau_non_taniere: 0,
        }),
      );
      (prisma.region.findUnique as jest.Mock).mockResolvedValue(
        makeRegion({
          id_region: 'RG02',
          nom_region: 'Ouest',
          est_taniere: false,
        }),
      );
      (prisma.utilisateur.update as jest.Mock).mockResolvedValue(updatedUser);

      await service.updateUser(
        'U0001',
        {
          id_role: 'R0000',
          id_region: 'RG02',
          statut: 'Suspendu',
          role: 'CSC',
          role_nom: 'Chef Service',
          region_nom: 'Fausse région',
          type_region: 'taniere',
          id_branche: 'FAKE',
          est_admin: false,
          est_actif: true,
        } as UpdateUserDto,
        ADMIN_MATRICULE,
        ADMIN_IP,
      );

      const updateCall = (prisma.utilisateur.update as jest.Mock).mock
        .calls[0][0];
      expect(updateCall.data).toEqual(
        expect.objectContaining({
          role: 'ADMIN',
          role_nom: 'ADMIN',
          id_region: 'RG02',
          region_nom: 'Ouest',
          type_region: 'non-taniere',
          id_branche: null,
          niveau_hierarchique: 0,
          est_admin: true,
          statut: 'Suspendu',
          est_actif: false,
        }),
      );
      expect(updateCall.data).not.toHaveProperty('id_role');
    });

    it('should preserve statut and derive est_actif coherently when status is omitted', async () => {
      const existingUser = makeDbUser({
        statut: 'Indisponible',
        est_actif: true,
      });
      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(
        existingUser,
      );
      (prisma.utilisateur.update as jest.Mock).mockResolvedValue(existingUser);

      await service.updateUser(
        'U0001',
        { nom: 'Martin' },
        ADMIN_MATRICULE,
        ADMIN_IP,
      );

      expect(prisma.utilisateur.update).toHaveBeenCalledWith({
        where: { matricule: 'U0001' },
        data: expect.objectContaining({
          statut: 'Indisponible',
          est_actif: true,
        }),
      });
    });

    it('should reject a canonical role unknown to the server', async () => {
      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(
        makeDbUser(),
      );
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateUser(
          'U0001',
          { id_role: 'BAD' },
          ADMIN_MATRICULE,
          ADMIN_IP,
        ),
      ).rejects.toThrow('Rôle introuvable');
      expect(prisma.utilisateur.update).not.toHaveBeenCalled();
    });

    it('should reject a manager cycle while using prospective attributes', async () => {
      const existingUser = makeDbUser({ manager_matricule: null });
      const manager = makeDbUser({
        matricule: 'SUB01',
        niveau_hierarchique: 2,
      });
      (prisma.utilisateur.findUnique as jest.Mock)
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(manager);
      (hierarchyService.getChaineHierarchique as jest.Mock).mockResolvedValue([
        { matricule: 'U0001' },
      ]);

      await expect(
        service.updateUser(
          'U0001',
          { manager_matricule: 'SUB01' },
          ADMIN_MATRICULE,
          ADMIN_IP,
        ),
      ).rejects.toThrow('cycle dans la hiérarchie');
      expect(prisma.utilisateur.update).not.toHaveBeenCalled();
    });

    it('should call auditLogService.log with USER_UPDATE', async () => {
      const existingUser = makeDbUser();
      const updatedUser = makeDbUser({ nom: 'Martin' });

      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(
        existingUser,
      );
      (prisma.utilisateur.update as jest.Mock).mockResolvedValue(updatedUser);

      await service.updateUser(
        'U0001',
        { nom: 'Martin' },
        ADMIN_MATRICULE,
        ADMIN_IP,
      );

      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_UPDATE',
          entite: 'utilisateur',
          id_entite: 'U0001',
          matricule_utilisateur: ADMIN_MATRICULE,
        }),
      );
    });

    it('should log USER_MANAGER_CHANGE_EVALS_DETECTED when manager changes and active evals exist (AC5)', async () => {
      const existingUser = makeDbUser({ manager_matricule: 'OLD01' });
      const updatedUser = makeDbUser({ manager_matricule: 'NEW01' });

      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(
        existingUser,
      );
      (
        hierarchyService.validerAssignationManager as jest.Mock
      ).mockResolvedValue({ valide: true, erreurs: [] });
      (prisma.utilisateur.update as jest.Mock).mockResolvedValue(updatedUser);
      // Simulate 2 active evaluations in open period
      (pg.query as jest.Mock).mockResolvedValueOnce([
        { id_evaluation: 'eval-1', statut: 'soumis' },
        { id_evaluation: 'eval-2', statut: 'brouillon' },
      ]);

      await service.updateUser(
        'U0001',
        { manager_matricule: 'NEW01' },
        ADMIN_MATRICULE,
        ADMIN_IP,
      );

      // Should have been called twice: once for MANAGER_CHANGE_EVALS_REASSIGNED + once for USER_UPDATE
      expect(auditLogService.log).toHaveBeenCalledTimes(2);
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_MANAGER_CHANGE_EVALS_DETECTED',
          entite: 'evaluation',
          id_entite: 'U0001',
          details_json: expect.objectContaining({
            ancien_manager: 'OLD01',
            nouveau_manager: 'NEW01',
            evaluations_actives: 2,
            evaluations_ids: ['eval-1', 'eval-2'],
          }),
        }),
      );
    });

    it('should NOT log EVALS_REASSIGNED when manager changes but no active evals exist', async () => {
      const existingUser = makeDbUser({ manager_matricule: 'OLD01' });
      const updatedUser = makeDbUser({ manager_matricule: 'NEW01' });

      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(
        existingUser,
      );
      (
        hierarchyService.validerAssignationManager as jest.Mock
      ).mockResolvedValue({ valide: true, erreurs: [] });
      (prisma.utilisateur.update as jest.Mock).mockResolvedValue(updatedUser);
      (pg.query as jest.Mock).mockResolvedValueOnce([]); // no active evals

      await service.updateUser(
        'U0001',
        { manager_matricule: 'NEW01' },
        ADMIN_MATRICULE,
        ADMIN_IP,
      );

      // Only USER_UPDATE should be logged
      expect(auditLogService.log).toHaveBeenCalledTimes(1);
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'USER_UPDATE' }),
      );
    });
  });

  // ─── deactivateUser ────────────────────────────────────────────────────────

  describe('deactivateUser', () => {
    it('should soft-delete (statut=Inactif, est_actif=false) and log USER_DEACTIVATE', async () => {
      const existingUser = makeDbUser();
      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(
        existingUser,
      );
      (prisma.utilisateur.update as jest.Mock).mockResolvedValue({
        ...existingUser,
        statut: 'Inactif',
        est_actif: false,
      });

      await service.deactivateUser('U0001', ADMIN_MATRICULE, ADMIN_IP);

      expect(prisma.utilisateur.update).toHaveBeenCalledWith({
        where: { matricule: 'U0001' },
        data: { statut: 'Inactif', est_actif: false },
      });

      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_DEACTIVATE',
          entite: 'utilisateur',
          id_entite: 'U0001',
          matricule_utilisateur: ADMIN_MATRICULE,
        }),
      );
    });

    it('should throw NotFoundException when user does not exist', async () => {
      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.deactivateUser('XXXXX', ADMIN_MATRICULE, ADMIN_IP),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
