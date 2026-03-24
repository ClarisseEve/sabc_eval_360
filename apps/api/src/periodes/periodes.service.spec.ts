import { PeriodesService } from './periodes.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PeriodesService', () => {
  let service: PeriodesService;
  let mockPg: any;

  beforeEach(() => {
    mockPg = {
      query: jest.fn(),
      queryOne: jest.fn(),
      execute: jest.fn(),
    };
    service = new PeriodesService(mockPg);
  });

  describe('findById', () => {
    it('should return periode when found', async () => {
      const p = { id_periode: 'uuid-1', statut: 'planifiee' };
      mockPg.queryOne.mockResolvedValue(p);
      const result = await service.findById('uuid-1');
      expect(result).toEqual(p);
    });

    it('should throw NotFoundException when not found', async () => {
      mockPg.queryOne.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should reject dates where debut >= fin', async () => {
      await expect(
        service.create({
          code_periode: 'P1',
          nom_periode: 'Test',
          date_debut: '2027-06-01',
          date_fin: '2027-05-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject period shorter than 7 days', async () => {
      await expect(
        service.create({
          code_periode: 'P1',
          nom_periode: 'Test',
          date_debut: '2027-06-01',
          date_fin: '2027-06-05',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject period longer than 180 days', async () => {
      await expect(
        service.create({
          code_periode: 'P1',
          nom_periode: 'Test',
          date_debut: '2027-06-01',
          date_fin: '2028-06-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('ouvrir', () => {
    it('should reject already open period', async () => {
      mockPg.queryOne.mockResolvedValue({ id_periode: 'uuid-1', est_ouverte: true });
      await expect(service.ouvrir('uuid-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('fermer', () => {
    it('should reject already closed period', async () => {
      mockPg.queryOne.mockResolvedValue({ id_periode: 'uuid-1', est_cloturee: true });
      await expect(service.fermer('uuid-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should reject deletion when evaluations exist', async () => {
      mockPg.queryOne.mockResolvedValue({ count: '5' });
      await expect(service.delete('uuid-1')).rejects.toThrow(BadRequestException);
    });

    it('should allow deletion when no evaluations', async () => {
      mockPg.queryOne.mockResolvedValue({ count: '0' });
      mockPg.execute.mockResolvedValue(1);
      await service.delete('uuid-1');
      expect(mockPg.execute).toHaveBeenCalledWith(expect.stringContaining('DELETE'), ['uuid-1']);
    });
  });
});
