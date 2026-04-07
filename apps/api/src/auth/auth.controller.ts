import { Controller, Post, Put, Get, Body, UseGuards, Request, HttpCode, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private prisma: PrismaService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: any) {
    return this.authService.me(req.user.matricule);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(200)
  logout() {
    return { message: 'Déconnexion réussie' };
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(
    @Request() req: any,
    @Body() body: UpdateProfileDto,
  ) {
    const data: any = {};
    if (body.nom !== undefined) data.nom = body.nom;
    if (body.prenom !== undefined) data.prenom = body.prenom;
    if (body.email !== undefined) {
      const existing = await this.prisma.utilisateur.findFirst({
        where: { email: body.email, matricule: { not: req.user.matricule } },
      });
      if (existing) throw new BadRequestException('Cet email est déjà utilisé');
      data.email = body.email;
    }
    if (body.telephone !== undefined) data.telephone = body.telephone;

    await this.prisma.utilisateur.update({ where: { matricule: req.user.matricule }, data });
    return this.usersService.findByMatricule(req.user.matricule);
  }

  @UseGuards(JwtAuthGuard)
  @Put('password')
  async updatePassword(
    @Request() req: any,
    @Body() body: UpdatePasswordDto,
  ) {
    if (body.password !== body.password_confirmation) {
      throw new BadRequestException('Les mots de passe ne correspondent pas');
    }
    if (body.password.length < 6) {
      throw new BadRequestException('Le mot de passe doit contenir au moins 6 caractères');
    }

    const user = await this.prisma.utilisateur.findUnique({ where: { matricule: req.user.matricule } });
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
