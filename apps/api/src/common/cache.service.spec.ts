import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';

/**
 * Le cache mémoire est le chemin de repli quand Redis est indisponible.
 * Il ne se purgeait qu'à la lecture d'une clé expirée, donc une entrée écrite
 * puis jamais relue restait indéfiniment. Avec des clés par utilisateur
 * (analytics:scores:<matricule>), la Map grossissait sans borne.
 */
describe('CacheService (cache mémoire)', () => {
  const buildService = (settings: Record<string, unknown> = {}) => {
    const config = {
      get: (key: string, fallback?: unknown) =>
        key in settings ? settings[key] : fallback,
    } as unknown as ConfigService;
    return new CacheService(config);
  };

  const memoryService = (maxEntries: number) =>
    buildService({ CACHE_DRIVER: 'memory', CACHE_MEMORY_MAX_ENTRIES: maxEntries });

  const storeSize = (service: CacheService) =>
    (service as unknown as { store: Map<string, unknown> }).store.size;

  it('restitue une valeur avant expiration', async () => {
    const service = memoryService(10);
    await service.set('k', { value: 1 }, 60);
    await expect(service.get('k')).resolves.toEqual({ value: 1 });
  });

  it('ne restitue plus une valeur expirée', async () => {
    const service = memoryService(10);
    await service.set('k', { value: 1 }, -1);
    await expect(service.get('k')).resolves.toBeNull();
  });

  it('borne le nombre d’entrées même sans aucune lecture', async () => {
    const service = memoryService(50);

    // 500 clés distinctes écrites et jamais relues: c'est le scénario qui
    // faisait croître la Map indéfiniment.
    for (let i = 0; i < 500; i++) {
      await service.set(`analytics:scores:MAT${i}`, { score: i }, 300);
    }

    expect(storeSize(service)).toBeLessThanOrEqual(50);
  });

  it('évince en priorité les entrées expirées', async () => {
    const service = memoryService(3);
    await service.set('expiree-1', 'a', -1);
    await service.set('expiree-2', 'b', -1);
    await service.set('vivante-1', 'c', 300);
    await service.set('vivante-2', 'd', 300);

    await expect(service.get('vivante-1')).resolves.toBe('c');
    await expect(service.get('vivante-2')).resolves.toBe('d');
  });

  it('ne recalcule pas en parallèle pour une même clé', async () => {
    const service = memoryService(10);
    const compute = jest.fn().mockResolvedValue('valeur');

    const [a, b] = await Promise.all([
      service.getOrCompute('k', 60, compute),
      service.getOrCompute('k', 60, compute),
    ]);

    expect(a).toBe('valeur');
    expect(b).toBe('valeur');
    expect(compute).toHaveBeenCalledTimes(1);
  });
});
