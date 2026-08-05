import { Controller, Get, Post, Put, Delete, Body, UseGuards, Param, NotFoundException } from '@nestjs/common';
import { ReglesService } from './regles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ValidateCriteresDto } from './dto/validate-criteres.dto';
import { CreateRegleDto } from './dto/create-regle.dto';
import { UpdateRegleDto } from './dto/update-regle.dto';

@Controller('regles')
@UseGuards(JwtAuthGuard)
export class ReglesController {
  constructor(private service: ReglesService) {}

  @Get()
  list() {
    return this.service.listActives();
  }

  @Get('constraints')
  getConstraints() {
    return this.service.getConstraints();
  }

  @Get('categories')
  getCategories() {
    return this.service.getCategoriesValides();
  }

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  listAll() {
    return this.service.listAll();
  }

  @Post('validate')
  validateCriteres(@Body() dto: ValidateCriteresDto) {
    return this.service.validateCriteres(dto.criteres);
  }

  @Get(':id')
  async show(@Param('id') id: string) {
    const regle = await this.service.findById(id);
    if (!regle) {
      throw new NotFoundException(`Règle introuvable: ${id}`);
    }
    return regle;
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateRegleDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateRegleDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/toggle')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  toggleActive(@Param('id') id: string) {
    return this.service.toggleActive(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
