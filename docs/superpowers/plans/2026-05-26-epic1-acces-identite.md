# Epic 1 — Accès & Identité Utilisateur — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compléter l'Epic 1 (Stories 1.1–1.4) à 100% — auth sécurisé, RBAC strict, gestion utilisateurs avec validation hiérarchique, profil utilisateur complet.

**Architecture:** NestJS 11 API (apps/api) + React 19 SPA (apps/web). MySQL via Prisma (core/identité). Redis via CacheService existant pour le lockout. AuditLogService transversal pour tous les logs admin.

**Tech Stack:** NestJS 11, Prisma 6, class-validator, bcrypt, @nestjs/jwt, @nestjs/passport, Redis (CacheService existant), React 19, React Query, TypeScript 5.9

---

## Vagues d'exécution parallèle

Les tâches sont organisées en 3 vagues. Les tâches d'une même vague peuvent être exécutées en parallèle par des agents séparés.

### Vague 1 — Infrastructure transversale (1 agent)
- Task 1: AuditLogService

### Vague 2 — Stories en parallèle (4 agents simultanés)
- Task 2: Story 1.1 — Auth (lockout + logging)
- Task 3: Story 1.2 — RBAC (validation métier + guard permissions)
- Task 4: Story 1.3 — Users (validation hiérarchique + DTOs)
- Task 5: Story 1.4 — Profil (preferences_json + champs org)

### Vague 3 — Tests + Review (2 agents simultanés)
- Task 6: Tests complets Epic 1
- Task 7: Code Review rigoureuse

---

## Task 1: AuditLogService — Service de logging transversal

**Files:**
- Create: `apps/api/src/common/services/audit-log.service.ts`
- Create: `apps/api/src/common/common.module.ts` (si inexistant, sinon modifier)
- Modify: `apps/api/prisma/schema.prisma` (vérifier modèle LogAdministration)
- Test: `apps/api/src/common/services/audit-log.service.spec.ts`

**Contexte:** Le modèle Prisma `LogAdministration` existe déjà (schema.prisma L166-183) avec les champs : `id`, `utilisateur_matricule`, `action`, `resultat`, `adresse_ip`, `details`, `date_action`, `ancienne_valeur`, `nouvelle_valeur`. Mais AUCUN service ne l'utilise.

- [ ] **Step 1: Écrire le test du service**

```typescript
// apps/api/src/common/services/audit-log.service.spec.ts
import { Test } from '@nestjs/testing';
import { AuditLogService } from './audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let prisma: { logAdministration: { create: jest.Mock } };

  beforeEach(async () => {
    prisma = { logAdministration: { create: jest.fn() } };
    const module = await Test.createTestingModule({
      providers: [
        AuditLogService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(AuditLogService);
  });

  it('should log a successful action', async () => {
    prisma.logAdministration.create.mockResolvedValue({ id: 1 });

    await service.log({
      utilisateur_matricule: 'MAT001',
      action: 'login_success',
      resultat: 'succes',
      adresse_ip: '192.168.1.1',
    });

    expect(prisma.logAdministration.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        utilisateur_matricule: 'MAT001',
        action: 'login_success',
        resultat: 'succes',
        adresse_ip: '192.168.1.1',
      }),
    });
  });

  it('should log a failed action with details', async () => {
    prisma.logAdministration.create.mockResolvedValue({ id: 2 });

    await service.log({
      utilisateur_matricule: 'MAT002',
      action: 'login_failed',
      resultat: 'erreur',
      adresse_ip: '10.0.0.1',
      details: 'Mot de passe incorrect',
    });

    expect(prisma.logAdministration.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        details: 'Mot de passe incorrect',
      }),
    });
  });

  it('should log with ancienne/nouvelle valeur for updates', async () => {
    prisma.logAdministration.create.mockResolvedValue({ id: 3 });

    await service.log({
      utilisateur_matricule: 'ADMIN01',
      action: 'role_updated',
      resultat: 'succes',
      adresse_ip: '10.0.0.1',
      ancienne_valeur: 'niveau=3',
      nouvelle_valeur: 'niveau=4',
    });

    expect(prisma.logAdministration.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ancienne_valeur: 'niveau=3',
        nouvelle_valeur: 'niveau=4',
      }),
    });
  });

  it('should not throw on logging failure (fire-and-forget)', async () => {
    prisma.logAdministration.create.mockRejectedValue(new Error('DB down'));

    await expect(
      service.log({
        utilisateur_matricule: 'MAT001',
        action: 'login_success',
        resultat: 'succes',
        adresse_ip: '127.0.0.1',
      }),
    ).resolves.not.toThrow();
  });
});
```

- [ ] **Step 2: Vérifier que le test échoue**

Run: `cd apps/api && npx jest --testPathPattern=audit-log.service.spec --no-coverage`
Expected: FAIL — module `./audit-log.service` not found

- [ ] **Step 3: Implémenter le service**

```typescript
// apps/api/src/common/services/audit-log.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogEntry {
  utilisateur_matricule: string | null;
  action: string;
  resultat: 'succes' | 'erreur';
  adresse_ip: string;
  details?: string;
  ancienne_valeur?: string;
  nouvelle_valeur?: string;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.logAdministration.create({
        data: {
          utilisateur_matricule: entry.utilisateur_matricule,
          action: entry.action,
          resultat: entry.resultat,
          adresse_ip: entry.adresse_ip,
          details: entry.details ?? null,
          ancienne_valeur: entry.ancienne_valeur ?? null,
          nouvelle_valeur: entry.nouvelle_valeur ?? null,
          date_action: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Audit log failed: ${error.message}`, error.stack);
    }
  }
}
```

- [ ] **Step 4: Exporter depuis common module**

Vérifier si `apps/api/src/common/common.module.ts` existe. S'il n'existe pas, le créer. Si un fichier barrel `index.ts` existe, ajouter l'export.

```typescript
// apps/api/src/common/common.module.ts (créer ou modifier)
import { Module, Global } from '@nestjs/common';
import { AuditLogService } from './services/audit-log.service';
import { CacheService } from './cache.service';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [AuditLogService, CacheService],
  exports: [AuditLogService, CacheService],
})
export class CommonModule {}
```

Puis s'assurer que `CommonModule` est importé dans `AppModule` (`apps/api/src/app.module.ts`).

- [ ] **Step 5: Vérifier que les tests passent**

Run: `cd apps/api && npx jest --testPathPattern=audit-log.service.spec --no-coverage`
Expected: 4 tests PASS

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/common/services/audit-log.service.ts apps/api/src/common/services/audit-log.service.spec.ts apps/api/src/common/common.module.ts
git commit -m "feat(common): add AuditLogService for admin action logging"
```

---

## Task 2: Story 1.1 — Auth Security (lockout + logging)

**Dépend de:** Task 1 (AuditLogService)

**Files:**
- Modify: `apps/api/src/auth/auth.service.ts`
- Modify: `apps/api/src/auth/auth.controller.ts`
- Modify: `apps/api/src/auth/auth.module.ts`
- Modify: `apps/api/src/auth/strategies/local.strategy.ts`
- Test: `apps/api/src/auth/auth.service.spec.ts`

**Contexte existant:**
- `auth.service.ts` (42 L) a `validateUser(identifier, password)` et `login(user)` qui retourne un JWT.
- `local.strategy.ts` (17 L) appelle `validateUser` et throw `UnauthorizedException` si null.
- `CacheService` existe (`common/cache.service.ts`, 183 L) avec `get/set/del/increment` — supporte Redis + fallback mémoire.
- `ThrottlerModule` est déjà configuré avec rate limiting sur `/auth/login` (5 req/min).

- [ ] **Step 1: Écrire les tests**

```typescript
// apps/api/src/auth/auth.service.spec.ts
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { AuditLogService } from '../common/services/audit-log.service';
import { CacheService } from '../common/cache.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: { findByIdentifier: jest.Mock };
  let jwtService: { sign: jest.Mock };
  let auditLog: { log: jest.Mock };
  let cache: { get: jest.Mock; set: jest.Mock; del: jest.Mock; increment: jest.Mock };

  beforeEach(async () => {
    usersService = { findByIdentifier: jest.fn() };
    jwtService = { sign: jest.fn().mockReturnValue('jwt-token') };
    auditLog = { log: jest.fn().mockResolvedValue(undefined) };
    cache = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      increment: jest.fn().mockResolvedValue(1),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: AuditLogService, useValue: auditLog },
        { provide: CacheService, useValue: cache },
      ],
    }).compile();

    authService = module.get(AuthService);
  });

  describe('validateUser', () => {
    const hashedPassword = bcrypt.hashSync('correct-password', 10);
    const mockUser = {
      matricule: 'MAT001',
      email: 'test@sabc.cm',
      password: hashedPassword,
      role: { nom_role: 'CSC' },
      est_actif: true,
    };

    it('should return user data on valid credentials', async () => {
      usersService.findByIdentifier.mockResolvedValue(mockUser);
      cache.get.mockResolvedValue(null);

      const result = await authService.validateUser('MAT001', 'correct-password', '192.168.1.1');
      expect(result).toBeDefined();
      expect(result.matricule).toBe('MAT001');
      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'login_success', resultat: 'succes' }),
      );
      expect(cache.del).toHaveBeenCalledWith('login_attempts:MAT001');
    });

    it('should throw and log on invalid password', async () => {
      usersService.findByIdentifier.mockResolvedValue(mockUser);
      cache.get.mockResolvedValue(null);

      await expect(
        authService.validateUser('MAT001', 'wrong-password', '192.168.1.1'),
      ).rejects.toThrow(UnauthorizedException);

      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'login_failed', resultat: 'erreur' }),
      );
      expect(cache.increment).toHaveBeenCalledWith('login_attempts:MAT001', 900);
    });

    it('should throw on locked account (5+ attempts)', async () => {
      cache.get.mockResolvedValue('5');

      await expect(
        authService.validateUser('MAT001', 'correct-password', '10.0.0.1'),
      ).rejects.toThrow('Compte temporairement verrouillé');

      expect(usersService.findByIdentifier).not.toHaveBeenCalled();
    });

    it('should throw on inactive user', async () => {
      usersService.findByIdentifier.mockResolvedValue({ ...mockUser, est_actif: false });
      cache.get.mockResolvedValue(null);

      await expect(
        authService.validateUser('MAT001', 'correct-password', '10.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw on unknown user', async () => {
      usersService.findByIdentifier.mockResolvedValue(null);
      cache.get.mockResolvedValue(null);

      await expect(
        authService.validateUser('UNKNOWN', 'any-password', '10.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return a JWT access_token', async () => {
      const user = { matricule: 'MAT001', email: 'test@sabc.cm', role: { nom_role: 'CSC' } };
      const result = await authService.login(user);
      expect(result).toEqual({ access_token: 'jwt-token' });
    });
  });
});
```

- [ ] **Step 2: Vérifier que les tests échouent**

Run: `cd apps/api && npx jest --testPathPattern=auth.service.spec --no-coverage`
Expected: FAIL — signatures ne matchent pas

- [ ] **Step 3: Modifier auth.service.ts**

Lire le fichier actuel `apps/api/src/auth/auth.service.ts` et le réécrire avec le lockout et le logging. La signature de `validateUser` doit accepter un 3e paramètre `ip: string`.

```typescript
// apps/api/src/auth/auth.service.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { CacheService } from '../common/cache.service';
import * as bcrypt from 'bcrypt';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TTL_SECONDS = 900; // 15 minutes

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly auditLog: AuditLogService,
    private readonly cache: CacheService,
  ) {}

  async validateUser(identifier: string, password: string, ip: string) {
    // Check lockout
    const lockKey = `login_attempts:${identifier}`;
    const attempts = await this.cache.get(lockKey);
    if (attempts && parseInt(attempts, 10) >= MAX_LOGIN_ATTEMPTS) {
      await this.auditLog.log({
        utilisateur_matricule: identifier,
        action: 'login_blocked',
        resultat: 'erreur',
        adresse_ip: ip,
        details: `Compte verrouillé (${attempts} tentatives)`,
      });
      throw new UnauthorizedException(
        'Compte temporairement verrouillé (15 minutes). Réessayez plus tard.',
      );
    }

    const user = await this.usersService.findByIdentifier(identifier);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      await this.cache.increment(lockKey, LOCKOUT_TTL_SECONDS);
      await this.auditLog.log({
        utilisateur_matricule: identifier,
        action: 'login_failed',
        resultat: 'erreur',
        adresse_ip: ip,
        details: user ? 'Mot de passe incorrect' : 'Utilisateur inconnu',
      });
      throw new UnauthorizedException('Identifiants incorrects');
    }

    if (!user.est_actif) {
      await this.auditLog.log({
        utilisateur_matricule: user.matricule,
        action: 'login_failed',
        resultat: 'erreur',
        adresse_ip: ip,
        details: 'Compte désactivé',
      });
      throw new UnauthorizedException('Compte désactivé. Contactez l\'administrateur.');
    }

    // Success — reset counter & log
    await this.cache.del(lockKey);
    await this.auditLog.log({
      utilisateur_matricule: user.matricule,
      action: 'login_success',
      resultat: 'succes',
      adresse_ip: ip,
    });

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = {
      sub: user.matricule,
      email: user.email,
      role: user.role?.nom_role ?? user.role,
      is_admin: (user.role?.nom_role ?? user.role) === 'ADMIN',
    };
    return { access_token: this.jwtService.sign(payload) };
  }
}
```

- [ ] **Step 4: Modifier local.strategy.ts pour passer l'IP**

Lire le fichier actuel et le modifier pour extraire l'IP de la requête et la passer à `validateUser`.

```typescript
// apps/api/src/auth/strategies/local.strategy.ts
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Request } from 'express';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'identifier', passReqToCallback: true });
  }

  async validate(req: Request, identifier: string, password: string) {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    return this.authService.validateUser(identifier, password, ip);
  }
}
```

- [ ] **Step 5: Modifier auth.controller.ts — ajouter logging logout**

Lire le fichier actuel. Ajouter l'injection de `AuditLogService` et logger l'action de logout.

Dans la méthode `logout`, ajouter :
```typescript
await this.auditLog.log({
  utilisateur_matricule: req.user.matricule ?? req.user.sub,
  action: 'logout',
  resultat: 'succes',
  adresse_ip: req.ip || 'unknown',
});
```

- [ ] **Step 6: Modifier auth.module.ts — ajouter imports**

S'assurer que `AuditLogService` et `CacheService` sont disponibles dans le module auth. Si `CommonModule` est `@Global()`, ils sont déjà disponibles. Sinon, importer `CommonModule`.

- [ ] **Step 7: Vérifier que les tests passent**

Run: `cd apps/api && npx jest --testPathPattern=auth.service.spec --no-coverage`
Expected: 5 tests PASS

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/auth/
git commit -m "feat(auth): add login lockout (5 attempts/15min), audit logging on login/logout"
```

---

## Task 3: Story 1.2 — RBAC (validation métier + permissions guard)

**Dépend de:** Task 1 (AuditLogService)

**Files:**
- Create: `apps/api/src/admin/dto/role.dto.ts`
- Modify: `apps/api/src/admin/admin-roles.service.ts`
- Modify: `apps/api/src/admin/admin-roles.controller.ts`
- Modify: `apps/api/src/auth/guards/roles.guard.ts`
- Create: `apps/web/src/pages/Admin/Roles/Edit.tsx`
- Test: `apps/api/src/admin/admin-roles.service.spec.ts` (modifier)

**Contexte existant:**
- `admin-roles.service.ts` : CRUD basique sans validation métier, sans logging.
- `admin-roles.controller.ts` : Routes `GET/POST/PUT/DELETE /admin/roles`.
- `roles.guard.ts` : Vérifie seulement le nom du rôle, pas les permissions fines.
- `admin-roles.service.spec.ts` : 4 tests existants.
- Schema Prisma Role : a `peut_auto_evaluer`, `peut_evaluer_pairs`, `peut_evaluer_subordonnes`, `peut_cross_branch`, `portee_geographique`.

- [ ] **Step 1: Créer les DTOs**

```typescript
// apps/api/src/admin/dto/role.dto.ts
import { IsString, IsInt, IsBoolean, IsOptional, IsIn, Min, Max, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @MaxLength(50)
  nom_role: string;

  @IsString()
  @MaxLength(100)
  nom_complet: string;

  @IsInt()
  @Min(0)
  @Max(5)
  niveau_taniere: number;

  @IsInt()
  @Min(0)
  @Max(5)
  niveau_non_taniere: number;

  @IsBoolean()
  @IsOptional()
  peut_auto_evaluer?: boolean;

  @IsBoolean()
  @IsOptional()
  peut_evaluer_pairs?: boolean;

  @IsBoolean()
  @IsOptional()
  peut_evaluer_subordonnes?: boolean;

  @IsBoolean()
  @IsOptional()
  peut_cross_branch?: boolean;

  @IsIn(['region', 'global'])
  @IsOptional()
  portee_geographique?: string;

  @IsInt()
  @IsOptional()
  id_branche?: number;
}

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nom_complet?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(5)
  niveau_taniere?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(5)
  niveau_non_taniere?: number;

  @IsBoolean()
  @IsOptional()
  peut_auto_evaluer?: boolean;

  @IsBoolean()
  @IsOptional()
  peut_evaluer_pairs?: boolean;

  @IsBoolean()
  @IsOptional()
  peut_evaluer_subordonnes?: boolean;

  @IsBoolean()
  @IsOptional()
  peut_cross_branch?: boolean;

  @IsIn(['region', 'global'])
  @IsOptional()
  portee_geographique?: string;

  @IsInt()
  @IsOptional()
  id_branche?: number;
}
```

- [ ] **Step 2: Ajouter validation métier dans admin-roles.service.ts**

Lire le fichier actuel. Ajouter dans `createRole` et `updateRole` :

1. Si `nom_role` in ['DR', 'CDTT'] → forcer `peut_cross_branch = true`, `portee_geographique = 'global'`
2. Si `nom_role === 'ADMIN'` → forcer `id_branche = null`, `niveau_taniere = 0`, `niveau_non_taniere = 0`
3. Logging via `AuditLogService` sur create/update/delete

Injecter `AuditLogService` dans le constructeur. Pour le logging, passer le `matricule` de l'admin appelant (il faudra le recevoir depuis le controller).

- [ ] **Step 3: Modifier admin-roles.controller.ts — ajouter DTOs et passer l'utilisateur**

Remplacer `@Body() body: any` par `@Body() dto: CreateRoleDto` et `@Body() dto: UpdateRoleDto`.
Ajouter `@Request() req` pour passer `req.user` au service pour le logging.

- [ ] **Step 4: Mettre à jour les tests**

Modifier `admin-roles.service.spec.ts` pour ajouter :
- Test : DR doit avoir `peut_cross_branch = true` après création
- Test : ADMIN doit avoir `id_branche = null` après création
- Test : logging appelé sur create/update/delete

- [ ] **Step 5: Créer la page Edit frontend**

Créer `apps/web/src/pages/Admin/Roles/Edit.tsx` en s'inspirant de `Create.tsx` existant (125 lignes).
Charger le rôle existant via `GET /admin/roles/:id`, pré-remplir le formulaire, soumettre via `PUT /admin/roles/:id`.

- [ ] **Step 6: Vérifier que les tests passent**

Run: `cd apps/api && npx jest --testPathPattern=admin-roles --no-coverage`
Expected: tous les tests PASS

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/admin/dto/role.dto.ts apps/api/src/admin/admin-roles.service.ts apps/api/src/admin/admin-roles.controller.ts apps/api/src/admin/admin-roles.service.spec.ts apps/web/src/pages/Admin/Roles/Edit.tsx
git commit -m "feat(rbac): add business validation for roles, DTOs, audit logging, edit page"
```

---

## Task 4: Story 1.3 — Users (validation hiérarchique + DTOs + logging)

**Dépend de:** Task 1 (AuditLogService)

**Files:**
- Create: `apps/api/src/admin/dto/user.dto.ts`
- Modify: `apps/api/src/admin/admin-users.service.ts`
- Modify: `apps/api/src/admin/admin-users.controller.ts`
- Create: `apps/api/src/admin/admin-users.service.spec.ts`

**Contexte existant:**
- `admin-users.service.ts` (196 L) : CRUD complet mais `createUser`/`updateUser` ne valident pas la hiérarchie et ne loggent pas.
- `hierarchy.service.ts` : `validerAssignationManager()` et `peutSuperviser()` existent déjà mais ne sont pas appelés.
- Pas de DTOs — `@Body() body: any` partout.

- [ ] **Step 1: Créer les DTOs**

```typescript
// apps/api/src/admin/dto/user.dto.ts
import { IsString, IsEmail, IsInt, IsBoolean, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MaxLength(20)
  matricule: string;

  @IsString()
  @MaxLength(100)
  nom: string;

  @IsString()
  @MaxLength(100)
  prenom: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsInt()
  id_role: number;

  @IsInt()
  id_region: number;

  @IsInt()
  @IsOptional()
  id_branche?: number;

  @IsString()
  @IsOptional()
  manager_matricule?: string;

  @IsInt()
  @IsOptional()
  id_service?: number;

  @IsInt()
  @IsOptional()
  id_district?: number;

  @IsInt()
  @IsOptional()
  id_secteur?: number;

  @IsString()
  @IsOptional()
  telephone?: string;

  @IsString()
  @IsOptional()
  sexe?: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nom?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  prenom?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsInt()
  @IsOptional()
  id_role?: number;

  @IsInt()
  @IsOptional()
  id_region?: number;

  @IsInt()
  @IsOptional()
  id_branche?: number;

  @IsString()
  @IsOptional()
  manager_matricule?: string;

  @IsBoolean()
  @IsOptional()
  est_actif?: boolean;

  @IsString()
  @IsOptional()
  statut?: string;

  @IsInt()
  @IsOptional()
  id_service?: number;

  @IsInt()
  @IsOptional()
  id_district?: number;

  @IsInt()
  @IsOptional()
  id_secteur?: number;

  @IsString()
  @IsOptional()
  telephone?: string;
}
```

- [ ] **Step 2: Modifier admin-users.service.ts — brancher validation hiérarchique + logging**

Lire le fichier actuel. Modifications :

1. Injecter `HierarchyService` et `AuditLogService` dans le constructeur
2. Dans `createUser` : si `manager_matricule` fourni, appeler `this.hierarchyService.validerAssignationManager(manager_matricule, newUserRegion, newUserNiveau)`. Si la validation échoue, throw `BadRequestException` avec le message.
3. Dans `updateUser` : si `manager_matricule` change, même validation.
4. Ajouter logging `AuditLogService.log(...)` sur create, update, delete (désactivation).
5. Hasher le mot de passe dans `createUser` avec bcrypt.

- [ ] **Step 3: Modifier admin-users.controller.ts — ajouter DTOs**

Remplacer `@Body() body: any` par les DTOs typés. Ajouter `@Request() req` pour passer l'admin matricule au service pour le logging.

- [ ] **Step 4: Écrire les tests**

```typescript
// apps/api/src/admin/admin-users.service.spec.ts
// Tests à couvrir :
// 1. createUser avec manager valide dans la même région → succès
// 2. createUser avec manager dans une autre région → BadRequestException
// 3. createUser avec manager de niveau inférieur → BadRequestException
// 4. updateUser qui change de manager → validation appelée
// 5. deleteUser → soft delete (statut=Inactif) + logging
// 6. createUser → mot de passe hashé (pas en clair)
// 7. logging appelé sur chaque opération
```

- [ ] **Step 5: Vérifier que les tests passent**

Run: `cd apps/api && npx jest --testPathPattern=admin-users --no-coverage`

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/admin/dto/user.dto.ts apps/api/src/admin/admin-users.service.ts apps/api/src/admin/admin-users.controller.ts apps/api/src/admin/admin-users.service.spec.ts
git commit -m "feat(users): add hierarchy validation, DTOs, audit logging on user management"
```

---

## Task 5: Story 1.4 — Profil Utilisateur (preferences_json + champs org)

**Dépend de:** Task 1 (AuditLogService)

**Files:**
- Modify: `apps/api/prisma/schema.prisma` (ajouter `preferences_json`)
- Create: Prisma migration
- Modify: `apps/api/src/auth/dto/update-profile.dto.ts`
- Modify: `apps/api/src/auth/auth.controller.ts`
- Modify: `apps/api/src/users/users.service.ts`
- Modify: `apps/web/src/pages/Settings/profile.tsx`
- Modify: `apps/web/src/Services/api.ts`

**Contexte existant:**
- `update-profile.dto.ts` (23 L) : accepte nom, prenom, email, telephone (tous optionnels).
- `auth.controller.ts` : `PUT /auth/profile` met à jour ces 4 champs.
- `users.service.ts` : `findByMatricule` retourne un select limité (12 champs).
- `profile.tsx` (89 L) : formulaire nom, prenom, email, telephone.
- Schema Prisma `Utilisateur` : a `date_naissance DateTime?` mais PAS `preferences_json`.

- [ ] **Step 1: Ajouter preferences_json au schema Prisma**

Ouvrir `apps/api/prisma/schema.prisma`. Dans le modèle `Utilisateur`, ajouter :
```prisma
preferences_json Json?
```
Après le champ `date_naissance`.

- [ ] **Step 2: Générer la migration Prisma**

Run: `cd apps/api && npx prisma migrate dev --name add_preferences_json_to_utilisateurs`

Si la migration échoue (pas de DB locale), utiliser : `npx prisma migrate dev --create-only --name add_preferences_json_to_utilisateurs` puis vérifier le SQL généré.

- [ ] **Step 3: Modifier update-profile.dto.ts**

```typescript
// apps/api/src/auth/dto/update-profile.dto.ts
import { IsString, IsEmail, IsOptional, IsDateString, IsObject, IsBoolean, IsIn, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class PreferencesDto {
  @IsIn(['fr', 'en'])
  @IsOptional()
  langue?: string;

  @IsBoolean()
  @IsOptional()
  notifications_email?: boolean;

  @IsBoolean()
  @IsOptional()
  notifications_app?: boolean;

  @IsIn(['light', 'dark'])
  @IsOptional()
  theme?: string;
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nom?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  prenom?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  telephone?: string;

  @IsDateString()
  @IsOptional()
  date_naissance?: string;

  @IsObject()
  @IsOptional()
  @Type(() => PreferencesDto)
  preferences?: PreferencesDto;
}
```

- [ ] **Step 4: Modifier auth.controller.ts — updateProfile**

Lire le fichier actuel. Modifier la méthode `updateProfile` pour :
1. Supporter `date_naissance` et `preferences_json` dans le update.
2. Mapper `dto.preferences` vers `preferences_json` (JSON.stringify si nécessaire, ou Prisma gère le Json nativement).

- [ ] **Step 5: Modifier users.service.ts — enrichir findByMatricule**

Ajouter dans le `select` de `findByMatricule` :
- `date_naissance: true`
- `preferences_json: true`
- `id_service: true`
- `id_district: true`
- `id_secteur: true`
- `telephone: true`
- `sexe: true`

Et ajouter des includes pour les relations (region, branche, role, manager) si pas déjà fait.

- [ ] **Step 6: Ajouter endpoint GET /auth/profile complet**

Si l'endpoint `GET /auth/me` ne retourne pas assez de données, ajouter un endpoint dédié ou enrichir `me` pour retourner aussi les champs organisationnels avec les noms résolus (region.nom_region, role.nom_complet, etc.).

- [ ] **Step 7: Modifier le frontend profile.tsx**

Réécrire `apps/web/src/pages/Settings/profile.tsx` pour :

1. **Section read-only** en haut : matricule, rôle (nom_complet), région, branche, manager, service/district/secteur si applicable. Affichés dans des badges/texte grisé.
2. **Message info** : "Pour modifier votre région, branche ou rôle, contactez l'administrateur."
3. **Section modifiable** : nom, prénom, email, téléphone, date_naissance (input date).
4. **Section préférences** : checkboxes notifications_email, notifications_app, select langue (fr/en).
5. **Section mot de passe** : garder le composant existant `password.tsx`.

- [ ] **Step 8: Modifier api.ts — ajouter preferences dans l'appel**

Vérifier que `profileApi.update` envoie aussi `date_naissance` et `preferences`.

- [ ] **Step 9: Commit**

```bash
git add apps/api/prisma/ apps/api/src/auth/ apps/api/src/users/ apps/web/src/pages/Settings/ apps/web/src/Services/api.ts
git commit -m "feat(profile): add preferences_json, date_naissance, read-only org fields, admin contact message"
```

---

## Task 6: Tests complets Epic 1

**Dépend de:** Tasks 2–5

**Files:**
- Modify: `apps/api/src/auth/auth.service.spec.ts`
- Modify: `apps/api/src/admin/admin-roles.service.spec.ts`
- Create: `apps/api/src/admin/admin-users.service.spec.ts` (si pas déjà fait dans Task 4)
- Create: `apps/api/src/auth/auth.controller.spec.ts`

**Objectif:** Couverture de tous les cas critiques :

### Auth (Story 1.1)
- Login réussi → token + log succes + reset compteur
- Login échoué → log erreur + incrément compteur
- Login bloqué (5 tentatives) → erreur 401 + log blocked
- Login compte désactivé → erreur 401
- Logout → log logout

### RBAC (Story 1.2)
- Création rôle DR → force cross_branch + portee=global
- Création rôle ADMIN → force branche=null
- Update rôle → logging avec ancienne/nouvelle valeur
- Delete rôle avec utilisateurs liés → erreur
- Guard permissions → vérifie le nom du rôle

### Users (Story 1.3)
- Create user avec manager même région → OK
- Create user avec manager autre région → erreur
- Create user avec manager niveau inférieur → erreur
- Create user → password hashé
- Delete user → soft delete + logging

### Profil (Story 1.4)
- Update profil → champs autorisés seulement
- Update password → vérifie ancien mot de passe
- Update password incorrect → erreur
- Update preferences → sauvegarde JSON

- [ ] **Step 1: Compléter/vérifier tous les fichiers de test**
- [ ] **Step 2: Lancer la suite complète**

Run: `cd apps/api && npx jest --no-coverage`

- [ ] **Step 3: Corriger les tests qui échouent**
- [ ] **Step 4: Commit**

```bash
git add apps/api/src/
git commit -m "test(epic1): complete test coverage for auth, rbac, users, profile"
```

---

## Task 7: Code Review rigoureuse

**Dépend de:** Tasks 1–6

Checklist de review :

- [ ] **Sécurité** : Pas de credentials en dur, pas d'injection SQL, bcrypt pour les mots de passe, JWT bien configuré
- [ ] **Validation** : Tous les endpoints utilisent des DTOs avec class-validator, pas de `body: any`
- [ ] **Logging** : Toutes les actions admin (create/update/delete rôles, users) sont loggées
- [ ] **Auth** : Lockout fonctionne (5 tentatives → 15 min), tentatives loggées, logout loggé
- [ ] **RBAC** : DR/CDTT forcés cross_branch, ADMIN forcé branche=null, validation à la création
- [ ] **Hiérarchie** : `validerAssignationManager` appelé dans createUser/updateUser
- [ ] **Profil** : preferences_json fonctionne, champs org en read-only, message admin affiché
- [ ] **Tests** : Chaque fonctionnalité critique a au moins 1 test, tous les tests passent
- [ ] **TypeScript** : Pas de `any` non justifié, types stricts
- [ ] **Frontend** : Les pages sont responsive, utilisent le design system SABC
- [ ] **Conventions** : Entités en français, code en anglais, pnpm

---

## Récapitulatif des vagues

| Vague | Agents | Tâches | Estimation |
|-------|--------|--------|------------|
| **1** | 1 agent | Task 1 (AuditLogService) | Rapide |
| **2** | 4 agents parallèles | Tasks 2-3-4-5 (Stories 1.1-1.4) | Principal |
| **3** | 2 agents parallèles | Task 6 (tests) + Task 7 (review) | Validation |
