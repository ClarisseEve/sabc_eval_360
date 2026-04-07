import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return null;
    const { password: _, ...result } = user;
    return result;
  }

  async login(user: { matricule: string; email: string; role: string; est_admin: boolean }) {
    return {
      access_token: this.jwt.sign({
        sub: user.matricule,
        email: user.email,
        role: user.role,
        is_admin: user.est_admin,
      }),
      user: {
        matricule: user.matricule,
        email: user.email,
        role: user.role,
        is_admin: user.est_admin,
      },
    };
  }

  async me(matricule: string) {
    return this.users.findByMatricule(matricule);
  }
}
