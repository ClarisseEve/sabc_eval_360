import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { PrismaService } from '../prisma/prisma.service';
import { DatabasePgService } from '../database/database-pg.service';
import { EvaluationsService } from '../evaluations/evaluations.service';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { CreateUserDto } from './dto/user.dto';

const ADMIN_MATRICULE = 'ADMIN';
const ADMIN_IP = '127.0.0.1';

const makeCreateDto = (overrides: Partial<CreateUserDto> = {}): CreateUserDto => ({
  matricule: 'U0001',
  nom: 'Dupont',
  prenom: 'Jean',
  email: 'jean.dupont@sabc.cm',
  password: '***REMOVED***',
  id_role: 'R001',
  id_region: 'RG01',
  role: 'CSC',
  role_nom: 'Chef Service Commercial',
  region_nom: 'Littoral',
  type_region: 'taniere',
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
  id_branche: null,
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
          },
        },
        {
          provide: DatabasePgService,
          useValue: {
            queryOne: jest.fn().mockResolvedValue({ total: '0', validees: '0', score_moyen: null }),
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
    hierarchyService = module.get(HierarchyService) as jest.Mocked<HierarchyService>;
    auditLogService = module.get(AuditLogService) as jest.Mocked<AuditLogService>;
  });

  // ─── createUser ────────────────────────────────────────────────────────────

  describe('createUser', () => {
    it('should create user successfully when manager is valid (same region)', async () => {
      const dto = makeCreateDto({ manager_matricule: 'MGR01' });
      const createdUser = makeDbUser({ manager_matricule: 'MGR01' });

      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.utilisateur.findFirst as jest.Mock).mockResolvedValue(null);
      (hierarchyService.validerAssignationManager as jest.Mock).mockResolvedValue({
        valide: true,
        erreurs: [],
      });
      (prisma.utilisateur.create as jest.Mock).mockResolvedValue(createdUser);

      const result = await service.createUser(dto, ADMIN_MATRICULE, ADMIN_IP);

      expect(hierarchyService.validerAssignationManager).toHaveBeenCalledWith('U0001', 'MGR01');
      expect(result).not.toHaveProperty('password');
      expect(result.matricule).toBe('U0001');
    });

    it('should throw BadRequestException when manager is in a different region', async () => {
      const dto = makeCreateDto({ manager_matricule: 'MGR02' });

      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.utilisateur.findFirst as jest.Mock).mockResolvedValue(null);
      (hierarchyService.validerAssignationManager as jest.Mock).mockResolvedValue({
        valide: false,
        erreurs: ['Le manager doit être dans la même région'],
      });

      await expect(
        service.createUser(dto, ADMIN_MATRICULE, ADMIN_IP),
      ).rejects.toThrow(BadRequestException);

      expect(hierarchyService.validerAssignationManager).toHaveBeenCalledWith('U0001', 'MGR02');
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
      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(makeDbUser());

      await expect(
        service.createUser(dto, ADMIN_MATRICULE, ADMIN_IP),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── updateUser ────────────────────────────────────────────────────────────

  describe('updateUser', () => {
    it('should call validerAssignationManager when manager_matricule changes', async () => {
      const existingUser = makeDbUser({ manager_matricule: 'OLD01' });
      const updatedUser = makeDbUser({ manager_matricule: 'NEW01' });

      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(existingUser);
      (hierarchyService.validerAssignationManager as jest.Mock).mockResolvedValue({
        valide: true,
        erreurs: [],
      });
      (prisma.utilisateur.update as jest.Mock).mockResolvedValue(updatedUser);

      await service.updateUser('U0001', { manager_matricule: 'NEW01' }, ADMIN_MATRICULE, ADMIN_IP);

      expect(hierarchyService.validerAssignationManager).toHaveBeenCalledWith('U0001', 'NEW01');
    });

    it('should NOT call validerAssignationManager when manager_matricule is unchanged', async () => {
      const existingUser = makeDbUser({ manager_matricule: 'MGR01' });
      const updatedUser = makeDbUser({ nom: 'Martin', manager_matricule: 'MGR01' });

      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(existingUser);
      (prisma.utilisateur.update as jest.Mock).mockResolvedValue(updatedUser);

      await service.updateUser('U0001', { nom: 'Martin' }, ADMIN_MATRICULE, ADMIN_IP);

      expect(hierarchyService.validerAssignationManager).not.toHaveBeenCalled();
    });

    it('should call auditLogService.log with USER_UPDATE', async () => {
      const existingUser = makeDbUser();
      const updatedUser = makeDbUser({ nom: 'Martin' });

      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(existingUser);
      (prisma.utilisateur.update as jest.Mock).mockResolvedValue(updatedUser);

      await service.updateUser('U0001', { nom: 'Martin' }, ADMIN_MATRICULE, ADMIN_IP);

      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_UPDATE',
          entite: 'utilisateur',
          id_entite: 'U0001',
          matricule_utilisateur: ADMIN_MATRICULE,
        }),
      );
    });
  });

  // ─── deactivateUser ────────────────────────────────────────────────────────

  describe('deactivateUser', () => {
    it('should soft-delete (statut=Inactif, est_actif=false) and log USER_DEACTIVATE', async () => {
      const existingUser = makeDbUser();
      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(existingUser);
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
