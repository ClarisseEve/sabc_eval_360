import { NotFoundException } from '@nestjs/common';
import { ExportService } from './export.service';

// pptxgenjs uses dynamic import() internally which is not compatible with Jest's
// CommonJS VM context. We mock the module to return a controlled Buffer.
jest.mock('pptxgenjs', () => {
  return jest.fn().mockImplementation(() => ({
    layout: '',
    addSlide: jest.fn().mockReturnValue({
      addText: jest.fn(),
      addShape: jest.fn(),
      addImage: jest.fn(),
    }),
    write: jest.fn().mockResolvedValue(Buffer.from('PPTX_MOCK_CONTENT')),
  }));
});

describe('ExportService', () => {
  let service: ExportService;
  let mockPg: { query: jest.Mock; queryOne: jest.Mock };

  const mockRapport = {
    id_rapport: 'uuid-1',
    titre: 'Test Rapport',
    createur_matricule: 'MAT001',
    sections_json: [
      { id: 's1', type: 'kpis', titre: 'KPIs', contenu: { texte: 'Texte KPIs' }, ordre: 1 },
    ],
    statut: 'brouillon',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    mockPg = { query: jest.fn(), queryOne: jest.fn() };
    service = new ExportService(mockPg as any);
  });

  it('exportPPTX — retourne un Buffer non-vide', async () => {
    mockPg.queryOne.mockResolvedValue(mockRapport);
    const buffer = await service.exportPPTX('uuid-1');
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('exportPPTX — lève NotFoundException si rapport absent', async () => {
    mockPg.queryOne.mockResolvedValue(null);
    await expect(service.exportPPTX('missing')).rejects.toThrow(NotFoundException);
  });

  it('exportXLSX — retourne un Buffer non-vide', async () => {
    mockPg.queryOne.mockResolvedValue(mockRapport);
    const buffer = await service.exportXLSX('uuid-1');
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('exportDOCX — retourne un Buffer non-vide', async () => {
    mockPg.queryOne.mockResolvedValue(mockRapport);
    const buffer = await service.exportDOCX('uuid-1');
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('getChartData — métier retourne un radar avec une série par métier', async () => {
    const prisma = {
      utilisateur: {
        findMany: jest.fn().mockResolvedValue([
          { matricule: 'M001', role_nom: 'Commercial', role: 'COMM', region_nom: 'Centre', id_district: 'D1' },
          { matricule: 'M002', role_nom: 'Manager', role: 'MGR', region_nom: 'Centre', id_district: 'D1' },
        ]),
      },
    };
    service = new ExportService(mockPg as any, prisma as any);
    mockPg.query.mockResolvedValue([
      { matricule: 'M001', label: 'Pilotage', value: 2.4 },
      { matricule: 'M002', label: 'Pilotage', value: 3.1 },
      { matricule: 'M001', label: 'Reporting', value: 2.8 },
      { matricule: 'M002', label: 'Reporting', value: 3.2 },
    ]);

    const chart = await (service as any).getChartData('competences_faibles_metier');

    expect(chart.type).toBe('radar');
    expect(chart.data).toHaveLength(2);
    expect(chart.data.map((series: any) => series.name)).toEqual(['Commercial (1 non acquis)', 'Manager (1 non acquis)']);
  });

  it('getChartData — classement utilise des barres horizontales', async () => {
    mockPg.query.mockResolvedValue([{ label: 'Pilotage', value: 2.8 }]);

    const chart = await (service as any).getChartData('classement_competences_metier');

    expect(chart.type).toBe('bar');
    expect(chart.chartOptions.barDir).toBe('bar');
  });

  it('exportXLSX — crée onglet Rapport si sections vides', async () => {
    mockPg.queryOne.mockResolvedValue({ ...mockRapport, sections_json: [] });
    const buffer = await service.exportXLSX('uuid-1');
    expect(Buffer.isBuffer(buffer)).toBe(true);
  });

  it("exportXLSX — assainit et déduplique les noms d'onglets", async () => {
    mockPg.queryOne.mockResolvedValue({
      ...mockRapport,
      sections_json: [
        { ...mockRapport.sections_json[0], id: 's1', titre: 'Ventes / Région' },
        { ...mockRapport.sections_json[0], id: 's2', titre: 'Ventes / Région' },
      ],
    });

    const buffer = await service.exportXLSX('uuid-1');

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.subarray(0, 2).toString()).toBe('PK');
  });

  it('logExport — appelle pg.query avec les bons paramètres', async () => {
    mockPg.query.mockResolvedValue([]);
    await service.logExport({ rapport_id: 'uuid-1', format: 'pptx', createur_matricule: 'MAT001', fichier_nom: 'test.pptx' });
    expect(mockPg.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO historique_exports'),
      ['uuid-1', 'pptx', 'MAT001', 'test.pptx'],
    );
  });

  it('getExportHistory — retourne les exports pour un rapport_id', async () => {
    const rows = [{ id: 'e1', format: 'pptx' }];
    mockPg.query.mockResolvedValue(rows);
    const result = await service.getExportHistory('uuid-1');
    expect(result).toEqual(rows);
  });
});
