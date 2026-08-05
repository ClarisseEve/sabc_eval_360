import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HierarchyService {
  constructor(private prisma: PrismaService) {}

  async getHierarchieRegion(idRegion: string) {
    const region = await this.prisma.region.findUnique({ where: { id_region: idRegion } });
    if (!region) return {};

    const utilisateurs = await this.prisma.utilisateur.findMany({
      where: { id_region: idRegion, est_actif: true },
      select: {
        matricule: true, nom: true, prenom: true, email: true,
        role: true, role_nom: true, manager_matricule: true,
        niveau_hierarchique: true,
      },
      orderBy: { niveau_hierarchique: 'asc' },
    });

    const structure = region.est_taniere
      ? {
          niveau_1: 'Directeur Régional (DR)',
          niveau_2: 'Chef Département Trade (CDTT)',
          niveau_3: 'Chef Service Commercial (CSC) / Regional Trade Marketing (RTM)',
          niveau_4: 'Chef District Vente (CDV) / Trade Marketing Operator (TMO)',
          niveau_5: 'Chef de Secteur (CDS) / Assistant Superviseur Sponsoring (AS)',
        }
      : {
          niveau_1: 'Directeur Régional (DR)',
          niveau_2: 'Chef Service Commercial (CSC) / SRMO',
          niveau_3: 'Chef de Secteur (CDS) / TMO',
        };

    const grouped: Record<string, any[]> = {};
    for (const u of utilisateurs) {
      const key = `niveau_${u.niveau_hierarchique}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({
        matricule: u.matricule,
        nom_complet: `${u.prenom} ${u.nom}`,
        role: u.role_nom ?? u.role,
        email: u.email,
        manager_matricule: u.manager_matricule,
      });
    }

    return {
      region: { id: region.id_region, nom: region.nom_region, est_taniere: region.est_taniere },
      structure,
      utilisateurs: grouped,
    };
  }

  async getRegionStats(idRegion: string) {
    const total = await this.prisma.utilisateur.count({ where: { id_region: idRegion, est_actif: true } });
    const parRole = await this.prisma.utilisateur.groupBy({
      by: ['role'],
      where: { id_region: idRegion, est_actif: true },
      _count: true,
    });
    return { total, par_role: parRole.map((r: { role: string; _count: number }) => ({ role: r.role, count: r._count })) };
  }

  async getSubordonnesDirects(matricule: string) {
    return this.prisma.utilisateur.findMany({
      where: { manager_matricule: matricule, est_actif: true },
      select: {
        matricule: true, nom: true, prenom: true, email: true,
        role: true, role_nom: true, manager_matricule: true, niveau_hierarchique: true, id_region: true,
      },
    });
  }

  async getTousSubordonnes(
    matricule: string,
    visited = new Set<string>(),
    depth = 0,
  ): Promise<any[]> {
    if (depth > 10 || visited.has(matricule)) return [];
    visited.add(matricule);
    const directs = await this.getSubordonnesDirects(matricule);
    let all = [...directs];
    for (const sub of directs) {
      const nested = await this.getTousSubordonnes(sub.matricule, visited, depth + 1);
      all = all.concat(nested);
    }
    return all;
  }

  async getChaineHierarchique(matricule: string): Promise<any[]> {
    const chaine: any[] = [];
    let current = await this.prisma.utilisateur.findUnique({
      where: { matricule },
      select: { matricule: true, nom: true, prenom: true, role: true, role_nom: true, manager_matricule: true, niveau_hierarchique: true },
    });

    // Un cycle manager_matricule (données importées, assignation manuelle)
    // ferait tourner cette boucle indéfiniment et figerait le process.
    const visites = new Set<string>();

    while (current) {
      if (visites.has(current.matricule)) break;
      visites.add(current.matricule);

      chaine.push({
        matricule: current.matricule,
        nom_complet: `${current.prenom} ${current.nom}`,
        role: current.role_nom ?? current.role,
        niveau: current.niveau_hierarchique,
      });
      if (!current.manager_matricule) break;
      current = await this.prisma.utilisateur.findUnique({
        where: { matricule: current.manager_matricule },
        select: { matricule: true, nom: true, prenom: true, role: true, role_nom: true, manager_matricule: true, niveau_hierarchique: true },
      });
    }

    return chaine.reverse();
  }

  async peutSuperviser(superviseurMatricule: string, subordonneMatricule: string): Promise<boolean> {
    const [sup, sub] = await Promise.all([
      this.prisma.utilisateur.findUnique({ where: { matricule: superviseurMatricule } }),
      this.prisma.utilisateur.findUnique({ where: { matricule: subordonneMatricule } }),
    ]);
    if (!sup || !sub) return false;
    if (sup.id_region !== sub.id_region) return false;
    if (sup.niveau_hierarchique >= sub.niveau_hierarchique) return false;
    if (sup.id_branche !== sub.id_branche) {
      return this.getRolePeutCrossBranch(sup.role);
    }
    return true;
  }

  async validerAssignationManager(matricule: string, managerMatricule: string) {
    const erreurs: string[] = [];
    const [user, manager] = await Promise.all([
      this.prisma.utilisateur.findUnique({ where: { matricule } }),
      this.prisma.utilisateur.findUnique({ where: { matricule: managerMatricule } }),
    ]);

    if (!user || !manager) return { valide: false, erreurs: ['Utilisateur ou manager introuvable'] };
    if (user.id_region !== manager.id_region) erreurs.push("Le manager doit être dans la même région");
    if (manager.niveau_hierarchique >= user.niveau_hierarchique) erreurs.push("Le manager doit être à un niveau supérieur");
    if (user.id_branche !== manager.id_branche) {
      const canCross = await this.getRolePeutCrossBranch(manager.role);
      if (!canCross) {
        erreurs.push("Seuls les rôles autorisés (peut_cross_branch) peuvent superviser des utilisateurs d'autres branches");
      }
    }

    // Cycle detection
    const chaine = await this.getChaineHierarchique(managerMatricule);
    if (chaine.some(n => n.matricule === matricule)) {
      erreurs.push('Cette assignation créerait un cycle dans la hiérarchie');
    }

    return { valide: erreurs.length === 0, erreurs };
  }

  async assignerManager(matricule: string, managerMatricule: string) {
    const validation = await this.validerAssignationManager(matricule, managerMatricule);
    if (!validation.valide) {
      throw new NotFoundException(validation.erreurs.join('; '));
    }
    await this.prisma.utilisateur.update({
      where: { matricule },
      data: { manager_matricule: managerMatricule },
    });
    return { success: true, message: 'Manager assigné avec succès' };
  }

  async getManagersEligibles(matricule: string) {
    const user = await this.prisma.utilisateur.findUnique({ where: { matricule } });
    if (!user) return [];
    return this.prisma.utilisateur.findMany({
      where: {
        id_region: user.id_region,
        est_actif: true,
        niveau_hierarchique: { lt: user.niveau_hierarchique },
        matricule: { not: matricule },
      },
      select: { matricule: true, nom: true, prenom: true, role: true, role_nom: true },
    });
  }

  private async getRolePeutCrossBranch(roleCode: string): Promise<boolean> {
    // Utilisateur.role contient le nom du rôle ('DR', 'ADMIN'), pas son identifiant:
    // chercher par id_role renvoyait toujours null et bloquait toute supervision
    // inter-branches.
    const role = await this.prisma.role.findUnique({ where: { nom_role: roleCode } });
    return role?.peut_cross_branch ?? false;
  }
}
