import { BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { AdminImportsService } from './admin-imports.service';
import { AdminUsersService } from './admin-users.service';
import { TemplatesService } from '../templates/templates.service';

async function workbookBuffer(headers: string[], rows: Array<Record<string, string | number>>) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Import');
  sheet.addRow(headers);
  for (const row of rows) sheet.addRow(headers.map((header) => row[header] ?? ''));
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

const userHeaders = [
  'matricule', 'nom', 'prenom', 'email', 'id_role', 'id_region',
  'telephone', 'manager_matricule', 'id_service', 'id_district', 'id_secteur', 'sexe',
];

const templateHeaders = [
  'template_key', 'titre', 'description', 'categorie', 'version',
  'section', 'description_section', 'competence', 'description_competence',
  'poids', 'niveau_requis', 'niveau_1', 'niveau_2', 'niveau_3', 'niveau_4', 'niveau_5',
];

describe('AdminImportsService', () => {
  let service: AdminImportsService;
  let usersService: { validateUserCreation: jest.Mock; createUser: jest.Mock };
  let templatesService: { listTemplates: jest.Mock; createTemplate: jest.Mock };

  beforeEach(() => {
    usersService = {
      validateUserCreation: jest.fn().mockResolvedValue(undefined),
      createUser: jest.fn().mockResolvedValue({ matricule: 'U001' }),
    };
    templatesService = {
      listTemplates: jest.fn().mockResolvedValue([]),
      createTemplate: jest.fn().mockResolvedValue({ id_template: 'template-id' }),
    };
    service = new AdminImportsService(
      usersService as unknown as AdminUsersService,
      templatesService as unknown as TemplatesService,
    );
  });

  it('accepts valid user rows and reports duplicates with their spreadsheet row', async () => {
    const buffer = await workbookBuffer(userHeaders, [
      {
        matricule: 'U001',
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean@example.com',
        id_role: 'R001',
        id_region: 'RG01',
      },
      {
        matricule: 'U001',
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean@example.com',
        id_role: 'R001',
        id_region: 'RG01',
      },
    ]);

    const result = await service.previewUsers(buffer, 'Initial-Password-1');

    expect(result.valid_count).toBe(1);
    expect(result.skipped_count).toBe(1);
    expect(result.users[0].row).toBe(2);
    expect(result.errors).toEqual([
      { row: 3, message: 'Matricule en doublon dans le fichier. Adresse e-mail en doublon dans le fichier.' },
    ]);
  });

  it('imports valid user rows and reports rows invalidated after preview', async () => {
    usersService.createUser
      .mockRejectedValueOnce(new BadRequestException('Matricule déjà utilisé'));
    const buffer = await workbookBuffer(userHeaders, [
      {
        matricule: 'U001',
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean@example.com',
        id_role: 'R001',
        id_region: 'RG01',
      },
    ]);

    const result = await service.importUsers(buffer, 'Initial-Password-1', 'ADMIN', '127.0.0.1');

    expect(result.imported_count).toBe(0);
    expect(result.skipped_count).toBe(1);
    expect(result.errors[0].row).toBe(2);
  });

  it('validates complete templates as a group and imports them as drafts', async () => {
    const shared = {
      template_key: 'CDS-V1',
      titre: 'Template CDS',
      categorie: 'CDS',
      version: '1',
      section: 'Ventes',
      niveau_requis: 2,
      niveau_1: 'Débutant',
      niveau_2: 'En progression',
      niveau_3: 'Autonome',
      niveau_4: 'Confirmé',
      niveau_5: 'Expert',
    };
    const buffer = await workbookBuffer(templateHeaders, [
      { ...shared, competence: 'Connaissance produit', poids: 40 },
      { ...shared, competence: 'Techniques de vente', poids: 60 },
    ]);

    const preview = await service.previewTemplates(buffer);
    const result = await service.importTemplates(buffer);

    expect(preview.valid_count).toBe(1);
    expect(preview.templates[0]).toMatchObject({ titre: 'Template CDS', competences: 2 });
    expect(result.imported_count).toBe(1);
    expect(templatesService.createTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ est_actif: false, categorie: 'CDS' }),
    );
  });

  it('skips templates whose competence weights do not total 100 percent', async () => {
    const buffer = await workbookBuffer(templateHeaders, [{
      template_key: 'CDS-V1',
      titre: 'Template CDS',
      categorie: 'CDS',
      version: '1',
      section: 'Ventes',
      competence: 'Connaissance produit',
      poids: 80,
      niveau_requis: 2,
      niveau_1: 'Débutant',
      niveau_2: 'En progression',
      niveau_3: 'Autonome',
      niveau_4: 'Confirmé',
      niveau_5: 'Expert',
    }]);

    const result = await service.previewTemplates(buffer);

    expect(result.valid_count).toBe(0);
    expect(result.skipped_count).toBe(1);
    expect(result.errors[0].message).toContain('100 %');
  });
});
