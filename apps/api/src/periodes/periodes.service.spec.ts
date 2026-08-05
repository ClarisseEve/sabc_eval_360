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
      withTransaction: jest.fn(),
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

    it('should let PostgreSQL assign the UUID and return the created row', async () => {
      // 1er queryOne : validateNoChevauchement (aucun chevauchement)
      // 2e queryOne : INSERT ... RETURNING id_periode
      // 3e queryOne : findById
      mockPg.queryOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id_periode: '11111111-1111-4111-8111-111111111111' })
        .mockResolvedValueOnce({ id_periode: '11111111-1111-4111-8111-111111111111', code_periode: 'P1', statut: 'planifiee' });

      const result = await service.create({
        code_periode: 'P1',
        nom_periode: 'Test',
        date_debut: '2027-06-01',
        date_fin: '2027-09-01',
      });

      // L'INSERT ne doit PAS contenir id_periode dans les colonnes
      const insertCall = mockPg.queryOne.mock.calls[1];
      expect(insertCall[0]).toMatch(/INSERT INTO periodes_evaluation/);
      expect(insertCall[0]).not.toMatch(/\bid_periode\b\s*,/);
      expect(insertCall[0]).toMatch(/RETURNING id_periode/);
      expect(mockPg.queryOne.mock.calls[2][1]).toEqual(['11111111-1111-4111-8111-111111111111']);
      expect(result).toEqual({
        id_periode: '11111111-1111-4111-8111-111111111111',
        code_periode: 'P1',
        statut: 'planifiee',
      });
    });
  });

  describe('ouvrir', () => {
    const configureTransaction = (responses: any[]) => {
      const client = {
        query: jest.fn(),
      };
      for (const response of responses) {
        client.query.mockResolvedValueOnce(response);
      }
      mockPg.withTransaction.mockImplementation((fn: (c: any) => Promise<any>) => fn(client));
      return client;
    };

    it('ouvre atomiquement une période planifiée dans son intervalle', async () => {
      const opened = {
        id_periode: 'uuid-1',
        statut: 'ouverte',
        est_ouverte: true,
        est_cloturee: false,
      };
      const client = configureTransaction([
        { rows: [{}] },
        { rows: [opened], rowCount: 1 },
      ]);

      await expect(service.ouvrir('uuid-1')).resolves.toEqual(opened);

      expect(mockPg.withTransaction).toHaveBeenCalledTimes(1);
      expect(client.query.mock.calls[0][0]).toContain('pg_advisory_xact_lock');
      const transitionSql = String(client.query.mock.calls[1][0]);
      expect(transitionSql).toContain("p.statut = 'planifiee'");
      expect(transitionSql).toContain('p.est_ouverte = false');
      expect(transitionSql).toContain('p.est_cloturee = false');
      expect(transitionSql).toContain("AT TIME ZONE 'Africa/Douala'");
      expect(transitionSql).toContain('NOT EXISTS');
      expect(transitionSql).toContain('RETURNING p.*');
    });

    it('rejette une période qui est déjà ouverte', async () => {
      configureTransaction([
        { rows: [{}] },
        { rows: [], rowCount: 0 },
        {
          rows: [{
            id_periode: 'uuid-1',
            statut: 'ouverte',
            est_ouverte: true,
            est_cloturee: false,
            dans_intervalle: true,
            autre_periode_ouverte: false,
          }],
        },
      ]);

      await expect(service.ouvrir('uuid-1')).rejects.toThrow(BadRequestException);
    });

    it('rejette l’ouverture quand une autre période est déjà ouverte', async () => {
      configureTransaction([
        { rows: [{}] },
        { rows: [], rowCount: 0 },
        {
          rows: [{
            id_periode: 'uuid-1',
            statut: 'planifiee',
            est_ouverte: false,
            est_cloturee: false,
            dans_intervalle: true,
            autre_periode_ouverte: true,
          }],
        },
      ]);

      await expect(service.ouvrir('uuid-1')).rejects.toThrow(
        'Une autre période est déjà ouverte',
      );
    });

    it('rejette l’ouverture hors de l’intervalle planifié', async () => {
      configureTransaction([
        { rows: [{}] },
        { rows: [], rowCount: 0 },
        {
          rows: [{
            id_periode: 'uuid-1',
            statut: 'planifiee',
            est_ouverte: false,
            est_cloturee: false,
            dans_intervalle: false,
            autre_periode_ouverte: false,
          }],
        },
      ]);

      await expect(service.ouvrir('uuid-1')).rejects.toThrow(
        "La période ne peut être ouverte qu'entre ses dates de début et de fin",
      );
    });
  });

  describe('fermer', () => {
    it('should reject already closed period', async () => {
      mockPg.queryOne.mockResolvedValue({ id_periode: 'uuid-1', est_cloturee: true });
      await expect(service.fermer('uuid-1')).rejects.toThrow(BadRequestException);
    });

    it('should run stats + state update inside a transaction on success', async () => {
      const mockClient = { query: jest.fn().mockResolvedValue({ rows: [{ nb_total: '5', nb_validees: '4' }] }) };
      mockPg.queryOne.mockResolvedValue({ id_periode: 'uuid-1', est_cloturee: false });
      mockPg.withTransaction.mockImplementation((fn: (c: any) => Promise<any>) => fn(mockClient));
      // findById after transaction
      mockPg.queryOne.mockResolvedValueOnce({ id_periode: 'uuid-1', est_cloturee: false })
                     .mockResolvedValueOnce({ id_periode: 'uuid-1', est_cloturee: true, statut: 'fermee' });

      const result = await service.fermer('uuid-1');

      expect(mockPg.withTransaction).toHaveBeenCalledTimes(1);
      // client.query called: stats SELECT + stats UPDATE + state UPDATE = 3 times
      expect(mockClient.query).toHaveBeenCalledTimes(3);
      expect(result.statut).toBe('fermee');
    });
  });

  describe('update', () => {
    it('should reject update when period is not in planifiee state', async () => {
      mockPg.queryOne.mockResolvedValue({ id_periode: 'uuid-1', statut: 'ouverte', est_ouverte: true, est_cloturee: false });
      await expect(service.update('uuid-1', { nom_periode: 'New name' })).rejects.toThrow(BadRequestException);
    });

    it('should ignore unknown keys to prevent SQL injection via column names', async () => {
      const periode = { id_periode: 'uuid-1', statut: 'planifiee', est_ouverte: false, est_cloturee: false, date_debut: '2027-06-01', date_fin: '2027-07-01' };
      mockPg.queryOne.mockResolvedValue(periode);
      mockPg.execute.mockResolvedValue(1);

      // Inject a malicious key — should be stripped by whitelist
      await service.update('uuid-1', { nom_periode: 'Safe name', ...(({ 'DROP TABLE periodes_evaluation --': 'x' }) as any) });

      const executeSql: string = mockPg.execute.mock.calls[0][0];
      expect(executeSql).not.toContain('DROP TABLE');
      expect(executeSql).toContain('nom_periode');
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
