import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminStructureService } from './admin-structure.service';

/**
 * Sans mise à jour, renommer un service, un district ou un secteur imposait de
 * le supprimer puis de le recréer — ce que la suppression refuse dès qu'un
 * utilisateur y est rattaché. La structure devenait donc figée.
 */
describe('AdminStructureService — mise à jour de la structure', () => {
  let service: AdminStructureService;
  let prisma: any;
  let pg: any;
  let transaction: any;

  beforeEach(() => {
    transaction = {
      region: {
        update: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      serviceCommercial: { updateMany: jest.fn() },
      utilisateur: { groupBy: jest.fn(), updateMany: jest.fn() },
    };
    prisma = {
      region: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      serviceCommercial: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      utilisateur: { groupBy: jest.fn(), updateMany: jest.fn() },
      district: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
      secteur: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
      $transaction: jest.fn((callback: (client: typeof transaction) => unknown) => callback(transaction)),
    };
    pg = { execute: jest.fn().mockResolvedValue(1) };
    service = new AdminStructureService(prisma, pg);
  });

  describe('regions', () => {
    it('retourne le nombre réel d’utilisateurs rattachés à chaque région', async () => {
      prisma.region.findMany.mockResolvedValue([
        { id_region: 'RG004', nom_region: 'Nord-Ouest' },
        { id_region: 'LT', nom_region: 'Littoral' },
      ]);
      prisma.utilisateur.groupBy.mockResolvedValue([
        { id_region: 'RG004', _count: { _all: 12 } },
        { id_region: 'LT', _count: { _all: 19 } },
      ]);

      const regions = await service.getRegions();

      expect(regions.map((region: any) => [region.id_region, region._count.utilisateurs])).toEqual([
        ['RG004', 12],
        ['LT', 19],
      ]);
    });

    it.each([
      ['Littoral', 'LT'],
      ['Centre', 'CE'],
      ['Nord', 'NO'],
      ['Ouest', 'OU'],
    ])('crée %s avec son code officiel %s', async (nom_region, id_region) => {
      await service.createRegion({ id_region, nom_region });

      expect(prisma.region.create).toHaveBeenCalledWith({
        data: { id_region, nom_region },
      });
    });

    it('refuse un code qui ne correspond pas au nom officiel', async () => {
      await expect(
        service.createRegion({ id_region: 'RG001', nom_region: 'Littoral' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.region.create).not.toHaveBeenCalled();
    });

    it('transfère services et utilisateurs quand le code change', async () => {
      prisma.region.findUnique
        .mockResolvedValueOnce({ id_region: 'RG001', nom_region: 'Littoral', est_taniere: true })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      transaction.region.create.mockResolvedValue({ id_region: 'LT', nom_region: 'Littoral' });

      await service.updateRegion('RG001', { id_region: 'LT', nom_region: 'Littoral' });

      expect(pg.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE utilisateurs_ref'),
        ['LT', 'Littoral', 'taniere', 'RG001'],
      );
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(transaction.region.update).toHaveBeenCalledWith({
        where: { id_region: 'RG001' },
        data: { nom_region: expect.stringMatching(/^__rekey_LT/) },
      });
      expect(transaction.region.create).toHaveBeenCalledWith({
        data: { id_region: 'LT', nom_region: 'Littoral', est_taniere: true },
      });
      expect(transaction.region.delete).toHaveBeenCalledWith({ where: { id_region: 'RG001' } });
      expect(transaction.serviceCommercial.updateMany).toHaveBeenCalledWith({
        where: { id_region: 'RG001' },
        data: { id_region: 'LT' },
      });
      expect(transaction.utilisateur.updateMany).toHaveBeenCalledWith({
        where: { id_region: 'RG001' },
        data: { id_region: 'LT', region_nom: 'Littoral', type_region: 'taniere' },
      });
    });
  });

  describe('createService', () => {
    it('génère le prochain code séquentiel de la région', async () => {
      prisma.region.findUnique.mockResolvedValue({ id_region: 'LT' });
      prisma.serviceCommercial.findMany.mockResolvedValue([
        { id_service: 'LTSC01' },
        { id_service: 'SVC8K1XQ0' },
      ]);

      await service.createService({ nom_service: 'Service suivant', id_region: 'LT' });

      expect(prisma.serviceCommercial.create).toHaveBeenCalledWith({
        data: { id_service: 'LTSC03', nom_service: 'Service suivant', id_region: 'LT' },
      });
    });
  });

  describe('createDistrict', () => {
    it('incrémente le numéro des districts du service', async () => {
      prisma.serviceCommercial.findUnique.mockResolvedValue({ id_service: 'LTSC01', id_region: 'LT' });
      prisma.serviceCommercial.findMany.mockResolvedValue([{ id_service: 'LTSC01' }]);
      prisma.district.findMany.mockResolvedValue([{ id_district: 'LTSC01D1' }]);

      await service.createDistrict({ nom_district: 'District suivant', id_service: 'LTSC01' });

      expect(prisma.district.create).toHaveBeenCalledWith({
        data: { id_district: 'LTSC01D2', nom_district: 'District suivant', id_service: 'LTSC01' },
      });
    });

    it('utilise le code régional attendu pour un ancien service aléatoire', async () => {
      prisma.serviceCommercial.findUnique.mockResolvedValue({ id_service: 'SVC8K1XQ0', id_region: 'LT' });
      prisma.serviceCommercial.findMany.mockResolvedValue([{ id_service: 'SVC8K1XQ0' }]);
      prisma.district.findMany.mockResolvedValue([]);

      await service.createDistrict({ nom_district: 'Premier district', id_service: 'SVC8K1XQ0' });

      expect(prisma.district.create).toHaveBeenCalledWith({
        data: {
          id_district: 'LTSC01D1',
          nom_district: 'Premier district',
          id_service: 'SVC8K1XQ0',
        },
      });
    });
  });

  describe('createSecteur', () => {
    it('incrémente les secteurs à l’échelle de leur région', async () => {
      prisma.district.findUnique.mockResolvedValue({ id_district: 'LTSC01D1', id_service: 'LTSC01' });
      prisma.serviceCommercial.findUnique.mockResolvedValue({ id_service: 'LTSC01', id_region: 'LT' });
      prisma.serviceCommercial.findMany.mockResolvedValue([
        { id_service: 'LTSC01' },
        { id_service: 'LTSC02' },
      ]);
      prisma.secteur.findMany.mockResolvedValue([
        { id_secteur: 'LTST01' },
        { id_secteur: 'LTST03' },
      ]);

      await service.createSecteur({ nom_secteur: 'Secteur suivant', id_district: 'LTSC01D1' });

      expect(prisma.secteur.create).toHaveBeenCalledWith({
        data: {
          id_secteur: 'LTST04',
          nom_secteur: 'Secteur suivant',
          id_district: 'LTSC01D1',
          id_service: 'LTSC01',
        },
      });
    });
  });

  describe('updateService', () => {
    it('renomme un service existant', async () => {
      prisma.serviceCommercial.findUnique.mockResolvedValue({ id_service: 'S1' });
      prisma.serviceCommercial.update.mockResolvedValue({ id_service: 'S1', nom_service: 'Nouveau' });

      const result = await service.updateService('S1', { nom_service: 'Nouveau' });

      expect(prisma.serviceCommercial.update).toHaveBeenCalledWith({
        where: { id_service: 'S1' },
        data: { nom_service: 'Nouveau' },
      });
      expect(result.nom_service).toBe('Nouveau');
    });

    it('refuse un service inconnu', async () => {
      prisma.serviceCommercial.findUnique.mockResolvedValue(null);

      await expect(service.updateService('X', { nom_service: 'N' })).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.serviceCommercial.update).not.toHaveBeenCalled();
    });
  });

  describe('updateDistrict', () => {
    it('renomme un district existant', async () => {
      prisma.district.findUnique.mockResolvedValue({ id_district: 'D1' });
      prisma.district.update.mockResolvedValue({ id_district: 'D1', nom_district: 'Nouveau' });

      await service.updateDistrict('D1', { nom_district: 'Nouveau' });

      expect(prisma.district.update).toHaveBeenCalledWith({
        where: { id_district: 'D1' },
        data: { nom_district: 'Nouveau' },
      });
    });

    it('refuse un district inconnu', async () => {
      prisma.district.findUnique.mockResolvedValue(null);

      await expect(service.updateDistrict('X', { nom_district: 'N' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateSecteur', () => {
    it('renomme un secteur et permet de le rattacher ailleurs', async () => {
      prisma.secteur.findUnique.mockResolvedValue({ id_secteur: 'T1' });
      prisma.secteur.update.mockResolvedValue({ id_secteur: 'T1' });

      await service.updateSecteur('T1', { nom_secteur: 'Nouveau', id_district: 'D2' });

      expect(prisma.secteur.update).toHaveBeenCalledWith({
        where: { id_secteur: 'T1' },
        data: { nom_secteur: 'Nouveau', id_district: 'D2' },
      });
    });

    it('refuse un secteur inconnu', async () => {
      prisma.secteur.findUnique.mockResolvedValue(null);

      await expect(service.updateSecteur('X', { nom_secteur: 'N' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
