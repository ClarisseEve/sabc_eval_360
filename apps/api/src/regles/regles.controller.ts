import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ReglesService } from './regles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ValidateCriteresDto } from './dto/validate-criteres.dto';

@Controller('regles')
@UseGuards(JwtAuthGuard)
export class ReglesController {
  constructor(private service: ReglesService) {}

  @Get('constraints')
  getConstraints() {
    return this.service.getConstraints();
  }

  @Get('categories')
  getCategories() {
    return this.service.getCategoriesValides();
  }

  @Post('validate')
  validateCriteres(@Body() dto: ValidateCriteresDto) {
    return this.service.validateCriteres(dto.criteres);
  }
}
