import { TemplatesService } from './templates.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
// Logger is used internally — suppress output in tests
jest.spyOn(console, 'warn').mockImplementation(() => {});

describe('TemplatesService', () => {
  let service: TemplatesService;
  let mockPg: any;
  let mockPrisma: any;

  const mockTemplate = {
    id_template: 'uuid-1',
    nom: 'Template Test',
    description: 'Desc',
    evaluated_role: 'CSC',
    version: 1,
    statut: 'published',
    meta_json: { sections: [{ titre: 'S1', competences: [{ libelle: 'C1' }] }] },
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    mockPg = { query: jest.fn(), queryOne: jest.fn(), execute: jest.fn() };
    mockPrisma = { $queryRawUnsafe: jest.fn() };
    service = new TemplatesService(mockPg, mockPrisma);
  });

  // ─── listTemplates ────────────────────────────────────────────────────────

  describe('listTemplates', () => {
    it('returns a normalized array when pg.query resolves rows', async () => {
      mockPg.query.mockResolvedValue([mockTemplate]);

      const result = await service.listTemplates();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'uuid-1',
        titre: 'Template Test',
        statut: 'published',
        est_actif: true,
        nb_sections: 1,
        nb_competences: 1,
      });
    });

    it('returns an empty array when there are no rows', async () => {
      mockPg.query.mockResolvedValue([]);
      const result = await service.listTemplates();
      expect(result).toEqual([]);
    });
  });

  // ─── getTemplateById ──────────────────────────────────────────────────────

  describe('getTemplateById', () => {
    it('returns a normalized template when found', async () => {
      mockPg.queryOne.mockResolvedValue(mockTemplate);

      const result = await service.getTemplateById('uuid-1');

      expect(result).toMatchObject({
        id: 'uuid-1',
        titre: 'Template Test',
        evaluated_role: 'CSC',
        version: '1',
        statut: 'published',
        est_actif: true,
        nb_sections: 1,
        nb_competences: 1,
      });
    });

    it('throws NotFoundException when template is not found', async () => {
      mockPg.queryOne.mockResolvedValue(null);

      await expect(service.getTemplateById('missing')).rejects.toThrow(NotFoundException);
    });

    it('parses meta_json when stored as a string', async () => {
      const rowWithStringJson = {
        ...mockTemplate,
        meta_json: JSON.stringify(mockTemplate.meta_json),
      };
      mockPg.queryOne.mockResolvedValue(rowWithStringJson);

      const result = await service.getTemplateById('uuid-1');

      expect(result.nb_sections).toBe(1);
      expect(result.nb_competences).toBe(1);
    });
  });

  // ─── createTemplate ───────────────────────────────────────────────────────

  describe('createTemplate', () => {
    it('calls pg.execute with INSERT then returns the created template', async () => {
      mockPg.execute.mockResolvedValue(undefined);
      mockPg.queryOne.mockResolvedValue(mockTemplate);

      const dto = {
        titre: 'Template Test',
        categorie: 'CSC',
        sections: [{ titre: 'S1', competences: [{ libelle: 'C1', poids: 100 }] }],
      };

      const result = await service.createTemplate(dto as any);

      expect(mockPg.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO templates'),
        expect.arrayContaining(['Template Test']),
      );
      expect(result).toMatchObject({ id: 'uuid-1', titre: 'Template Test' });
    });

    it('sets statut to "published" when est_actif is true', async () => {
      mockPg.execute.mockResolvedValue(undefined);
      mockPg.queryOne.mockResolvedValue({ ...mockTemplate, statut: 'published' });

      await service.createTemplate({
        titre: 'Active',
        categorie: 'CSC',
        sections: [{ titre: 'S1', competences: [{ libelle: 'C1', poids: 100 }] }],
        est_actif: true,
      } as any);

      const insertCall = mockPg.execute.mock.calls[0];
      expect(insertCall[1]).toContain('published');
    });

    it('sets statut to "draft" when est_actif is false', async () => {
      mockPg.execute.mockResolvedValue(undefined);
      mockPg.queryOne.mockResolvedValue({ ...mockTemplate, statut: 'draft' });

      await service.createTemplate({
        titre: 'Draft',
        categorie: 'CSC',
        sections: [{ titre: 'S1', competences: [{ libelle: 'C1', poids: 100 }] }],
        est_actif: false,
      } as any);

      const insertCall = mockPg.execute.mock.calls[0];
      expect(insertCall[1]).toContain('draft');
    });
  });

  // ─── updateTemplate ───────────────────────────────────────────────────────

  describe('updateTemplate', () => {
    it('updates titre only — builds correct SET clause', async () => {
      // First call: existence check; second call: return after update
      mockPg.queryOne
        .mockResolvedValueOnce(mockTemplate)
        .mockResolvedValueOnce({ ...mockTemplate, nom: 'New Title' });
      mockPg.execute.mockResolvedValue(undefined);

      const result = await service.updateTemplate('uuid-1', { titre: 'New Title' });

      expect(mockPg.execute).toHaveBeenCalledWith(
        expect.stringContaining('nom = $1'),
        expect.arrayContaining(['New Title', 'uuid-1']),
      );
      expect(result.titre).toBe('New Title');
    });

    it('merges sections into existing meta_json', async () => {
      const newSections = [{ titre: 'S2', competences: [{ libelle: 'C2', poids: 50 }, { libelle: 'C3', poids: 50 }] }];

      // updateTemplate calls getTemplateById twice for sections path:
      // once for existence check, once to get current meta_json for merge
      mockPg.queryOne
        .mockResolvedValueOnce(mockTemplate)   // existence check
        .mockResolvedValueOnce(mockTemplate)   // fetch current for meta merge
        .mockResolvedValueOnce({ ...mockTemplate, meta_json: { sections: newSections } }); // post-update fetch
      mockPg.execute.mockResolvedValue(undefined);

      const result = await service.updateTemplate('uuid-1', { sections: newSections as any });

      const executeCall = mockPg.execute.mock.calls[0];
      const metaArg = executeCall[1].find((p: any) => typeof p === 'string' && p.includes('sections'));
      const parsed = JSON.parse(metaArg);
      expect(parsed.sections).toHaveLength(1);
      expect(parsed.sections[0].titre).toBe('S2');
      expect(result.sections).toHaveLength(1);
    });

    it('returns current template unchanged when dto is empty', async () => {
      mockPg.queryOne
        .mockResolvedValueOnce(mockTemplate)   // existence check
        .mockResolvedValueOnce(mockTemplate);  // return after no-op
      mockPg.execute.mockResolvedValue(undefined);

      const result = await service.updateTemplate('uuid-1', {});

      expect(mockPg.execute).not.toHaveBeenCalled();
      expect(result.id).toBe('uuid-1');
    });
  });

  // ─── publishTemplate ──────────────────────────────────────────────────────

  describe('publishTemplate', () => {
    it("sets statut='published' and returns updated template", async () => {
      mockPg.queryOne
        .mockResolvedValueOnce(mockTemplate)   // existence check
        .mockResolvedValueOnce({ ...mockTemplate, statut: 'published' }); // post-update fetch
      mockPg.execute.mockResolvedValue(undefined);

      const result = await service.publishTemplate('uuid-1');

      expect(mockPg.execute).toHaveBeenCalledWith(
        expect.stringContaining("statut = 'published'"),
        ['uuid-1'],
      );
      expect(result.statut).toBe('published');
    });
  });

  // ─── unpublishTemplate ────────────────────────────────────────────────────

  describe('unpublishTemplate', () => {
    it("sets statut='draft' and returns updated template", async () => {
      mockPg.queryOne
        .mockResolvedValueOnce(mockTemplate)   // existence check
        .mockResolvedValueOnce({ ...mockTemplate, statut: 'draft' }); // post-update fetch
      mockPg.execute.mockResolvedValue(undefined);

      const result = await service.unpublishTemplate('uuid-1');

      expect(mockPg.execute).toHaveBeenCalledWith(
        expect.stringContaining("statut = 'draft'"),
        ['uuid-1'],
      );
      expect(result.statut).toBe('draft');
    });
  });

  // ─── deleteTemplate ───────────────────────────────────────────────────────

  describe('deleteTemplate', () => {
    it('throws BadRequestException when active assignations exist', async () => {
      mockPg.queryOne.mockResolvedValue({ count: '2' });

      await expect(service.deleteTemplate('uuid-1')).rejects.toThrow(BadRequestException);
      expect(mockPg.execute).not.toHaveBeenCalled();
    });

    it("archives template (statut='archived') when no active assignations", async () => {
      mockPg.queryOne.mockResolvedValue({ count: '0' });
      mockPg.execute.mockResolvedValue(undefined);

      const result = await service.deleteTemplate('uuid-1');

      expect(mockPg.execute).toHaveBeenCalledWith(
        expect.stringContaining("statut = 'archived'"),
        ['uuid-1'],
      );
      expect(result).toEqual({ success: true });
    });
  });

  // ─── getTemplateForRolePeriode ────────────────────────────────────────────

  describe('getTemplateForRolePeriode', () => {
    it('returns merged assignation + normalized template when found and published', async () => {
      const assignation = {
        ...mockTemplate,
        id_role: 'role-1',
        id_periode: 'periode-1',
        id_template: 'uuid-1',
        template_statut: 'published',
        est_actif: true,
      };
      mockPg.queryOne.mockResolvedValue(assignation);

      const result = await service.getTemplateForRolePeriode('role-1', 'periode-1');

      expect(result).toMatchObject({
        id_role: 'role-1',
        id: 'uuid-1',
        statut: 'published',
        est_actif: true,
      });
    });

    it('throws NotFoundException when no assignation is found', async () => {
      mockPg.queryOne.mockResolvedValue(null);

      await expect(service.getTemplateForRolePeriode('role-1', 'periode-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when assigned template is not published', async () => {
      const assignation = {
        ...mockTemplate,
        id_role: 'role-1',
        id_periode: 'periode-1',
        id_template: 'uuid-1',
        template_statut: 'draft',
        est_actif: true,
      };
      mockPg.queryOne.mockResolvedValue(assignation);

      await expect(service.getTemplateForRolePeriode('role-1', 'periode-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── assignTemplate ───────────────────────────────────────────────────────

  describe('assignTemplate', () => {
    it('throws NotFoundException when period does not exist', async () => {
      mockPg.queryOne.mockResolvedValueOnce(null);

      await expect(service.assignTemplate('uuid-1', 'role-1', 'periode-missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when period is open', async () => {
      mockPg.queryOne.mockResolvedValueOnce({ est_ouverte: true, est_cloturee: false });

      await expect(service.assignTemplate('uuid-1', 'role-1', 'periode-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when period is closed', async () => {
      mockPg.queryOne.mockResolvedValueOnce({ est_ouverte: false, est_cloturee: true });

      await expect(service.assignTemplate('uuid-1', 'role-1', 'periode-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when template is not published', async () => {
      mockPg.queryOne
        .mockResolvedValueOnce({ est_ouverte: false, est_cloturee: false }) // periode check
        .mockResolvedValueOnce({ statut: 'draft' });                         // template check

      await expect(service.assignTemplate('uuid-1', 'role-1', 'periode-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('calls INSERT/UPSERT when period and template are valid', async () => {
      mockPg.queryOne
        .mockResolvedValueOnce({ est_ouverte: false, est_cloturee: false }) // periode
        .mockResolvedValueOnce({ statut: 'published' });                    // template
      mockPg.execute.mockResolvedValue(undefined);

      const result = await service.assignTemplate('uuid-1', 'role-1', 'periode-1');

      expect(mockPg.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO templates_roles_periodes'),
        ['role-1', 'periode-1', 'uuid-1'],
      );
      expect(result).toEqual({ success: true, message: 'Template assigné' });
    });
  });

  // ─── deleteAssignation ────────────────────────────────────────────────────

  describe('deleteAssignation', () => {
    it('throws BadRequestException when period is open', async () => {
      mockPg.queryOne.mockResolvedValue({ est_ouverte: true, est_cloturee: false });

      await expect(service.deleteAssignation('role-1', 'periode-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when period is closed', async () => {
      mockPg.queryOne.mockResolvedValue({ est_ouverte: false, est_cloturee: true });

      await expect(service.deleteAssignation('role-1', 'periode-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('calls DELETE when period allows modification', async () => {
      mockPg.queryOne.mockResolvedValue({ est_ouverte: false, est_cloturee: false });
      mockPg.execute.mockResolvedValue(undefined);

      const result = await service.deleteAssignation('role-1', 'periode-1');

      expect(mockPg.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM templates_roles_periodes'),
        ['role-1', 'periode-1'],
      );
      expect(result).toEqual({ success: true });
    });
  });

  // ─── getMatriceAssignations ───────────────────────────────────────────────

  describe('getMatriceAssignations', () => {
    it('maps roles to their assignations correctly', async () => {
      const assignations = [
        {
          id_role: 'role-1',
          id_template: 'uuid-1',
          template_nom: 'Template Test',
          template_statut: 'published',
          est_actif: true,
        },
      ];
      const roles = [
        { id_role: 'role-1', nom_role: 'CSC' },
        { id_role: 'role-2', nom_role: 'DR' },
      ];

      mockPg.query.mockResolvedValue(assignations);
      mockPrisma.$queryRawUnsafe.mockResolvedValue(roles);

      const result = await service.getMatriceAssignations('periode-1');

      expect(result).toHaveLength(2);

      const cscEntry = result.find((r: any) => r.id_role === 'role-1');
      expect(cscEntry).toBeDefined();
      expect(cscEntry!.est_assigne).toBe(true);
      expect(cscEntry!.template_assigne).toMatchObject({
        id_template: 'uuid-1',
        nom: 'Template Test',
        statut: 'published',
      });

      const drEntry = result.find((r: any) => r.id_role === 'role-2');
      expect(drEntry).toBeDefined();
      expect(drEntry!.est_assigne).toBe(false);
      expect(drEntry!.template_assigne).toBeNull();
    });

    it('returns all roles with est_assigne=false when no assignations exist', async () => {
      mockPg.query.mockResolvedValue([]);
      mockPrisma.$queryRawUnsafe.mockResolvedValue([
        { id_role: 'role-1', nom_role: 'CSC' },
        { id_role: 'role-2', nom_role: 'DR' },
      ]);

      const result = await service.getMatriceAssignations('periode-empty');

      expect(result.every((r: any) => r.est_assigne === false)).toBe(true);
      expect(result.every((r: any) => r.template_assigne === null)).toBe(true);
    });
  });

  // ─── assignBulk ───────────────────────────────────────────────────────────

  describe('assignBulk', () => {
    it('processes all items and returns correct assigned count', async () => {
      // Both assignments succeed: periode not open, template published
      mockPg.queryOne
        .mockResolvedValueOnce({ est_ouverte: false, est_cloturee: false }) // periode check for item 1
        .mockResolvedValueOnce({ statut: 'published' })                    // template check for item 1
        .mockResolvedValueOnce({ est_ouverte: false, est_cloturee: false }) // periode check for item 2
        .mockResolvedValueOnce({ statut: 'published' });                   // template check for item 2
      mockPg.execute.mockResolvedValue(undefined);

      const result = await service.assignBulk('periode-1', [
        { id_role: 'role-1', id_template: 'uuid-1' },
        { id_role: 'role-2', id_template: 'uuid-2' },
      ]);

      expect(result).toMatchObject({ assigned: 2, total: 2, errors: [] });
      expect(mockPg.execute).toHaveBeenCalledTimes(2);
    });

    it('counts only successful assignments when some fail', async () => {
      // First item fails (period open), second item succeeds
      mockPg.queryOne
        .mockResolvedValueOnce({ est_ouverte: true, est_cloturee: false })  // period open → reject
        .mockResolvedValueOnce({ est_ouverte: false, est_cloturee: false }) // second item period ok
        .mockResolvedValueOnce({ statut: 'published' });                    // second item template ok
      mockPg.execute.mockResolvedValue(undefined);

      const result = await service.assignBulk('periode-1', [
        { id_role: 'role-1', id_template: 'uuid-1' },
        { id_role: 'role-2', id_template: 'uuid-2' },
      ]);

      expect(result).toMatchObject({ assigned: 1, total: 2 });
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({ id_role: 'role-1', id_template: 'uuid-1' });
    });

    it('returns assigned=0 when all fail', async () => {
      mockPg.queryOne.mockResolvedValue({ est_ouverte: true, est_cloturee: false });

      const result = await service.assignBulk('periode-1', [
        { id_role: 'role-1', id_template: 'uuid-1' },
      ]);

      expect(result).toMatchObject({ assigned: 0, total: 1 });
      expect(result.errors).toHaveLength(1);
    });
  });

  // ─── getAssignationsByPeriode ─────────────────────────────────────────────

  describe('getAssignationsByPeriode', () => {
    it('calls pg.query with the correct idPeriode parameter', async () => {
      const rows = [
        { id_role: 'role-1', id_template: 'uuid-1', template_nom: 'T1', template_statut: 'published', est_actif: true },
      ];
      mockPg.query.mockResolvedValue(rows);

      const result = await service.getAssignationsByPeriode('periode-42');

      expect(mockPg.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE trp.id_periode = $1'),
        ['periode-42'],
      );
      expect(result).toEqual(rows);
    });

    it('returns an empty array when no assignations exist for the period', async () => {
      mockPg.query.mockResolvedValue([]);

      const result = await service.getAssignationsByPeriode('periode-empty');

      expect(result).toEqual([]);
    });
  });
});
