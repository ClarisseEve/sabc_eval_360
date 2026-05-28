import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.utilisateur.findUnique({ where: { email } });
  }

  async findByIdentifier(identifier: string) {
    const value = identifier.trim();
    if (!value) return null;

    return this.prisma.utilisateur.findFirst({
      where: {
        OR: [
          { email: value },
          { matricule: value.toUpperCase() },
        ],
      },
    });
  }

  async findByMatricule(matricule: string) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { matricule },
      select: {
        matricule: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        date_naissance: true,
        sexe: true,
        preferences_json: true,
        role: true,
        role_nom: true,
        est_actif: true,
        est_admin: true,
        photo_url: true,
        id_region: true,
        region_nom: true,
        id_branche: true,
        id_service: true,
        id_district: true,
        id_secteur: true,
        manager_matricule: true,
        created_at: true,
      },
    });

    if (!utilisateur) return null;

    let branche: { nom_branche: string } | null = null;
    if (utilisateur.id_branche) {
      branche = await this.prisma.branche.findUnique({
        where: { id_branche: utilisateur.id_branche },
        select: { nom_branche: true },
      });
    }

    return { ...utilisateur, branche };
  }
}
