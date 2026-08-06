import { NotFoundException } from '@nestjs/common';
import { AdminStructureService } from './admin-structure.service';

/**
 * Sans mise à jour, renommer un service, un district ou un secteur imposait de
 * le supprimer puis de le recréer — ce que la suppression refuse dès qu'un
 * utilisateur y est rattaché. La structure devenait donc figée.
 */
describe('AdminStructureService — mise à jour de la structure', () => {
  let service: AdminStructureService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      serviceCommercial: { findUnique: jest.fn(), update: jest.fn() },
      district: { findUnique: jest.fn(), update: jest.fn() },
      secteur: { findUnique: jest.fn(), update: jest.fn() },
    };
    service = new AdminStructureService(prisma);
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
