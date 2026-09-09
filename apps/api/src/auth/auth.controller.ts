import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { AuditLogService } from '../common/services/audit-log.service';

interface CurrentUserRequest {
  user: { matricule: string };
  ip?: string;
}

interface LocalLoginRequest {
  user: {
    matricule: string;
    email: string;
    role: string;
    est_admin: boolean;
  };
}

interface LogoutRequest extends CurrentUserRequest {
  user: { matricule: string; jti: string; exp: number };
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  login(@Request() req: LocalLoginRequest) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: CurrentUserRequest) {
    return this.authService.me(req.user.matricule);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(@Request() req: LogoutRequest) {
    await this.authService.logout(req.user);
    await this.auditLog.log({
      matricule_utilisateur: req.user.matricule,
      action: 'logout',
      entite: 'auth',
      adresse_ip: req.ip || 'unknown',
    });
    return { message: 'Déconnexion réussie' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Request() req: CurrentUserRequest,
    @Body() body: UpdateProfileDto,
  ) {
    const data: Record<string, unknown> = {};
    if (body.nom !== undefined) data.nom = body.nom;
    if (body.prenom !== undefined) data.prenom = body.prenom;
    if (body.photo_url !== undefined) data.photo_url = body.photo_url;
    if (body.email !== undefined) {
      const existing = await this.prisma.utilisateur.findFirst({
        where: { email: body.email, matricule: { not: req.user.matricule } },
      });
      if (existing) throw new BadRequestException('Cet email est déjà utilisé');
      data.email = body.email;
    }
    if (body.telephone !== undefined) data.telephone = body.telephone;
    if (body.date_naissance !== undefined)
      data.date_naissance = new Date(body.date_naissance);
    if (body.preferences !== undefined)
      data.preferences_json = body.preferences;

    await this.prisma.utilisateur.update({
      where: { matricule: req.user.matricule },
      data: data as any,
    });
    return this.usersService.findByMatricule(req.user.matricule);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async updatePassword(
    @Request() req: CurrentUserRequest,
    @Body() body: UpdatePasswordDto,
  ) {
    if (body.password !== body.password_confirmation) {
      throw new BadRequestException('Les mots de passe ne correspondent pas');
    }

    const user = await this.prisma.utilisateur.findUnique({
      where: { matricule: req.user.matricule },
    });
    if (!user) throw new BadRequestException('Utilisateur introuvable');

    const valid = await bcrypt.compare(body.current_password, user.password);
    if (!valid) throw new BadRequestException('Mot de passe actuel incorrect');

    const hashed = await bcrypt.hash(body.password, 10);
    await this.prisma.utilisateur.update({
      where: { matricule: req.user.matricule },
      data: { password: hashed },
    });

    return { message: 'Mot de passe mis à jour avec succès' };
  }
}
