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
    return this.prisma.utilisateur.findUnique({
      where: { matricule },
      select: {
        matricule: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        role_nom: true,
        est_actif: true,
        est_admin: true,
        photo_url: true,
        id_region: true,
        id_branche: true,
        created_at: true,
      },
    });
  }
}
