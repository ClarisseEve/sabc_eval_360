import { BadRequestException, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ValidationError, validate } from 'class-validator';
import * as ExcelJS from 'exceljs';
import { CreateUserDto } from './dto/user.dto';
import { CreateTemplateDto } from '../templates/dto/template.dto';
import { AdminUsersService } from './admin-users.service';
import { TemplatesService } from '../templates/templates.service';

type ImportIssue = { row: number; message: string };
type UserImportRow = { row: number; data: CreateUserDto };
type TemplateImportGroup = {
  key: string;
  firstRow: number;
  dto: CreateTemplateDto;
  issues: ImportIssue[];
};

const USER_COLUMNS = [
  'matricule',
  'nom',
  'prenom',
  'email',
  'id_role',
  'id_region',
  'telephone',
  'manager_matricule',
  'id_service',
  'id_district',
  'id_secteur',
  'sexe',
];

const TEMPLATE_COLUMNS = [
  'template_key',
  'titre',
  'description',
  'categorie',
  'version',
  'section',
  'description_section',
  'competence',
  'description_competence',
  'poids',
  'niveau_requis',
  'niveau_1',
  'niveau_2',
  'niveau_3',
  'niveau_4',
  'niveau_5',
];

function cellText(cell: ExcelJS.Cell): string {
  const value = cell.value;
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('text' in value && typeof value.text === 'string') return value.text.trim();
    if ('result' in value) return String(value.result ?? '').trim();
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map((item) => item.text).join('').trim();
    }
    return '';
  }
  return String(value).trim();
}

function validationMessages(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => [
    ...Object.values(error.constraints ?? {}),
    ...validationMessages(error.children ?? []),
  ]);
}

function addIssue(issues: ImportIssue[], row: number, message: string) {
  issues.push({ row, message });
}

@Injectable()
export class AdminImportsService {
  constructor(
    private readonly usersService: AdminUsersService,
    private readonly templatesService: TemplatesService,
  ) {}

  async buildUsersTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Utilisateurs');
    sheet.addRow(USER_COLUMNS);
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB91C1C' } };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.columns = USER_COLUMNS.map((header) => ({ header, key: header, width: 22 }));
    sheet.getColumn('email').width = 32;
    sheet.getColumn('manager_matricule').width = 24;
    const instructions = workbook.addWorksheet('Instructions');
    instructions.addRows([
      ['Import des utilisateurs'],
      ['Une ligne représente une personne. Les colonnes matricule, nom, prenom, email, id_role et id_region sont obligatoires.'],
      ['Les identifiants id_role et id_region sont ceux des référentiels de la plateforme.'],
      ['Les colonnes manager_matricule, telephone, id_service, id_district, id_secteur et sexe sont facultatives.'],
      ['Les managers doivent déjà exister. Importez d’abord les managers, puis leurs subordonnés.'],
      ['Le mot de passe initial est saisi dans la plateforme au moment de l’import et n’est pas stocké dans ce fichier.'],
      ['Les matricules ou e-mails déjà utilisés et les lignes invalides seront ignorés, avec leur numéro de ligne.'],
    ]);
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async buildTemplatesTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Competences');
    sheet.addRow(TEMPLATE_COLUMNS);
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB91C1C' } };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.columns = TEMPLATE_COLUMNS.map((header) => ({ header, key: header, width: 24 }));
    sheet.getColumn('template_key').width = 22;
    sheet.getColumn('titre').width = 32;
    sheet.getColumn('description').width = 36;
    sheet.getColumn('description_competence').width = 36;
    for (const column of ['niveau_1', 'niveau_2', 'niveau_3', 'niveau_4', 'niveau_5']) {
      sheet.getColumn(column).width = 38;
    }
    const instructions = workbook.addWorksheet('Instructions');
    instructions.addRows([
      ['Import des templates d’évaluation'],
      ['Une ligne représente une compétence. Répétez les informations du template sur chaque ligne.'],
      ['Utilisez le même template_key pour regrouper les compétences d’un template.'],
      ['Les colonnes template_key, titre, categorie, section, competence, poids, niveau_requis et niveau_1 à niveau_5 sont obligatoires.'],
      ['Le poids de toutes les compétences d’un template doit totaliser 100 %.'],
      ['Les niveaux requis et les niveaux_1 à niveaux_5 doivent correspondre à l’échelle de 1 à 5.'],
      ['Un template contenant une ligne invalide sera ignoré en entier ; les autres templates valides seront importés.'],
      ['Les templates importés restent en brouillon. Publiez-les ensuite depuis la plateforme.'],
    ]);
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async previewUsers(buffer: Buffer, initialPassword: string) {
    if (!initialPassword || initialPassword.length < 8) {
      throw new BadRequestException('Le mot de passe initial doit contenir au moins 8 caractères.');
    }
    const rows = await this.readRows(buffer, USER_COLUMNS);
    const accepted: UserImportRow[] = [];
    const issues: ImportIssue[] = [];
    const matricules = new Set<string>();
    const emails = new Set<string>();

    for (const { row, values } of rows) {
      const data = plainToInstance(CreateUserDto, { ...values, password: initialPassword });
      const messages = validationMessages(await validate(data));
      for (const field of ['matricule', 'nom', 'prenom', 'email', 'id_role', 'id_region'] as const) {
        if (!data[field]?.trim()) messages.push(`La colonne ${field} est obligatoire.`);
      }

      const matricule = data.matricule?.trim();
      const email = data.email?.trim().toLowerCase();
      if (matricule && matricules.has(matricule)) messages.push('Matricule en doublon dans le fichier.');
      if (email && emails.has(email)) messages.push('Adresse e-mail en doublon dans le fichier.');

      if (messages.length === 0) {
        try {
          await this.usersService.validateUserCreation(data);
        } catch (error) {
          if (!(error instanceof BadRequestException)) throw error;
          messages.push(error.message);
        }
      }

      if (messages.length > 0) {
        addIssue(issues, row, [...new Set(messages)].join(' '));
      } else {
        if (matricule) matricules.add(matricule);
        if (email) emails.add(email);
        accepted.push({ row, data });
      }
    }

    return {
      total: rows.length,
      valid_count: accepted.length,
      skipped_count: issues.length,
      users: accepted.map(({ row, data }) => ({
        row,
        matricule: data.matricule,
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        manager_matricule: data.manager_matricule ?? null,
      })),
      errors: issues,
    };
  }

  async importUsers(buffer: Buffer, initialPassword: string, adminMatricule: string, ip: string) {
    const preview = await this.previewUsers(buffer, initialPassword);
    const rows = await this.readRows(buffer, USER_COLUMNS);
    const usersByRow = new Map<number, CreateUserDto>();
    const acceptedRows = new Set(preview.users.map((user) => user.row));
    for (const { row, values } of rows) {
      if (acceptedRows.has(row)) {
        usersByRow.set(row, plainToInstance(CreateUserDto, { ...values, password: initialPassword }));
      }
    }

    const errors = [...preview.errors];
    let imported = 0;
    for (const row of acceptedRows) {
      const user = usersByRow.get(row);
      if (!user) continue;
      try {
        await this.usersService.createUser(user, adminMatricule, ip);
        imported += 1;
      } catch (error) {
        if (!(error instanceof BadRequestException)) throw error;
        addIssue(errors, row, error.message);
      }
    }

    return {
      imported_count: imported,
      skipped_count: errors.length,
      errors,
    };
  }

  async previewTemplates(buffer: Buffer) {
    const rows = await this.readRows(buffer, TEMPLATE_COLUMNS);
    const groups = new Map<string, TemplateImportGroup>();
    const ungroupedIssues: ImportIssue[] = [];

    for (const { row, values } of rows) {
      const key = values.template_key?.trim();
      if (!key) {
        addIssue(ungroupedIssues, row, 'La colonne template_key est obligatoire.');
        continue;
      }
      let group = groups.get(key);
      if (!group) {
        group = {
          key,
          firstRow: row,
          dto: {
            titre: values.titre ?? '',
            description: values.description ?? '',
            categorie: values.categorie ?? '',
            version: values.version || '1',
            est_actif: false,
            sections: [],
          },
          issues: [],
        };
        groups.set(key, group);
      }

      if (
        group.dto.titre !== (values.titre ?? '') ||
        group.dto.categorie !== (values.categorie ?? '') ||
        group.dto.version !== (values.version || '1') ||
        group.dto.description !== (values.description ?? '')
      ) {
        addIssue(group.issues, row, 'Les informations du template doivent rester identiques pour un même template_key.');
      }
      if (!values.section?.trim() || !values.competence?.trim()) {
        addIssue(group.issues, row, 'Les colonnes section et competence sont obligatoires.');
        continue;
      }

      let section = group.dto.sections.find((item) => item.titre === values.section);
      if (!section) {
        section = {
          titre: values.section,
          description: values.description_section || undefined,
          competences: [],
        };
        group.dto.sections.push(section);
      } else if (section.description !== (values.description_section || undefined)) {
        addIssue(group.issues, row, 'La description d’une section doit être identique sur toutes ses lignes.');
      }
      section.competences.push({
        libelle: values.competence,
        description: values.description_competence || undefined,
        poids: Number(values.poids),
        niveau_requis: Number(values.niveau_requis),
        niveaux: [1, 2, 3, 4, 5].map((niveau) => ({
          niveau,
          description: values[`niveau_${niveau}`] ?? '',
        })),
      });

      const required = ['titre', 'categorie', 'poids', 'niveau_requis', ...[1, 2, 3, 4, 5].map((niveau) => `niveau_${niveau}`)];
      const missing = required.filter((field) => !values[field]?.trim());
      if (missing.length > 0) addIssue(group.issues, row, `Colonnes obligatoires manquantes : ${missing.join(', ')}.`);
    }

    const existing = await this.templatesService.listTemplates();
    const valid: TemplateImportGroup[] = [];
    const errors: ImportIssue[] = [...ungroupedIssues];
    const templateIdentities = new Set<string>();
    for (const group of groups.values()) {
      const identity = [
        group.dto.titre.trim().toLowerCase(),
        group.dto.categorie.trim().toLowerCase(),
        String(group.dto.version),
      ].join('|');
      const duplicate = existing.some((template: any) =>
        String(template.titre).trim().toLowerCase() === group.dto.titre.trim().toLowerCase() &&
        String(template.categorie).trim().toLowerCase() === group.dto.categorie.trim().toLowerCase() &&
        String(template.version) === String(group.dto.version),
      );
      if (duplicate) addIssue(group.issues, group.firstRow, 'Un template de même titre, catégorie et version existe déjà.');
      if (templateIdentities.has(identity)) {
        addIssue(group.issues, group.firstRow, 'Ce template est déclaré plusieurs fois dans le fichier.');
      }
      templateIdentities.add(identity);
      const validationErrors = validationMessages(
        await validate(plainToInstance(CreateTemplateDto, group.dto)),
      );
      if (validationErrors.length > 0) {
        addIssue(group.issues, group.firstRow, [...new Set(validationErrors)].join(' '));
      }
      const totalWeight = group.dto.sections
        .flatMap((section) => section.competences)
        .reduce((sum, competence) => sum + Number(competence.poids), 0);
      if (Math.abs(totalWeight - 100) > 0.01) {
        addIssue(group.issues, group.firstRow, `Le total des poids doit être de 100 % (total actuel : ${totalWeight} %).`);
      }
      if (group.issues.length > 0) {
        errors.push(...group.issues);
      } else {
        valid.push(group);
      }
    }

    return {
      total: rows.length,
      valid_count: valid.length,
      skipped_count: groups.size - valid.length + ungroupedIssues.length,
      templates: valid.map(({ key, firstRow, dto }) => ({
        key,
        row: firstRow,
        titre: dto.titre,
        categorie: dto.categorie,
        competences: dto.sections.reduce((sum, section) => sum + section.competences.length, 0),
      })),
      errors,
    };
  }

  async importTemplates(buffer: Buffer) {
    const preview = await this.previewTemplates(buffer);
    const validKeys = new Set(preview.templates.map((template) => template.key));
    const groups = await this.readTemplateGroups(buffer);
    const errors = [...preview.errors];
    let imported = 0;

    for (const group of groups) {
      if (!validKeys.has(group.key)) continue;
      try {
        await this.templatesService.createTemplate(group.dto);
        imported += 1;
      } catch (error) {
        if (!(error instanceof BadRequestException)) throw error;
        addIssue(errors, group.firstRow, error.message);
      }
    }

    return {
      imported_count: imported,
      skipped_count: preview.skipped_count + preview.valid_count - imported,
      errors,
    };
  }

  private async readTemplateGroups(buffer: Buffer): Promise<TemplateImportGroup[]> {
    const rows = await this.readRows(buffer, TEMPLATE_COLUMNS);
    const groups = new Map<string, TemplateImportGroup>();
    for (const { row, values } of rows) {
      const key = values.template_key?.trim();
      if (!key) continue;
      let group = groups.get(key);
      if (!group) {
        group = {
          key,
          firstRow: row,
          dto: {
            titre: values.titre ?? '',
            description: values.description ?? '',
            categorie: values.categorie ?? '',
            version: values.version || '1',
            est_actif: false,
            sections: [],
          },
          issues: [],
        };
        groups.set(key, group);
      }
      let section = group.dto.sections.find((item) => item.titre === values.section);
      if (!section) {
        section = {
          titre: values.section ?? '',
          description: values.description_section || undefined,
          competences: [],
        };
        group.dto.sections.push(section);
      }
      section.competences.push({
        libelle: values.competence ?? '',
        description: values.description_competence || undefined,
        poids: Number(values.poids),
        niveau_requis: Number(values.niveau_requis),
        niveaux: [1, 2, 3, 4, 5].map((niveau) => ({
          niveau,
          description: values[`niveau_${niveau}`] ?? '',
        })),
      });
    }
    return [...groups.values()];
  }

  private async readRows(buffer: Buffer, requiredColumns: string[]) {
    const workbook = new ExcelJS.Workbook();
    try {
      const excelBuffer = new Uint8Array(buffer.byteLength);
      excelBuffer.set(buffer);
      await workbook.xlsx.load(excelBuffer.buffer);
    } catch {
      throw new BadRequestException('Le fichier n’est pas un classeur Excel .xlsx valide.');
    }
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new BadRequestException('Le classeur ne contient aucune feuille.');

    const headerRow = sheet.getRow(1);
    const headers: string[] = Array.from(
      { length: headerRow.cellCount },
      (_, index) => cellText(headerRow.getCell(index + 1)).toLowerCase(),
    );
    const indexes = new Map<string, number>(
      headers.map((header, index) => [header, index + 1]),
    );
    const missing = requiredColumns.filter((column) => !indexes.has(column));
    if (missing.length > 0) {
      throw new BadRequestException(`Colonnes manquantes dans la première feuille : ${missing.join(', ')}.`);
    }

    const rows: Array<{ row: number; values: Record<string, string> }> = [];
    sheet.eachRow((excelRow, rowNumber) => {
      if (rowNumber === 1) return;
      const values = Object.fromEntries(
        headers
          .filter(Boolean)
          .map((header) => [header, cellText(excelRow.getCell(indexes.get(header)!))]),
      );
      if (Object.values(values).some((value) => value !== '')) {
        rows.push({ row: rowNumber, values });
      }
    });
    if (rows.length === 0) throw new BadRequestException('Le fichier ne contient aucune ligne à importer.');
    return rows;
  }
}
