import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogEntry {
  matricule_utilisateur: string | null;
  action: string;
  entite: string;
  adresse_ip: string;
  id_entite?: string | null;
  details_json?: Record<string, unknown> | null;
  user_agent?: string | null;
}

/**
 * Generates a short alphanumeric ID (5 chars max) for LogAdministration.id_log.
 * Uses base-36 encoding of a combination of timestamp + random bits.
 */
function generateShortId(): string {
  const ts = Date.now() % 1_679_616; // mod 36^4 to keep within 4 chars
  const rand = Math.floor(Math.random() * 36);
  return (ts * 36 + rand).toString(36).slice(-5).padStart(5, '0');
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const now = new Date();
      await this.prisma.logAdministration.create({
        data: {
          id_log: generateShortId(),
          matricule_utilisateur: entry.matricule_utilisateur,
          action: entry.action,
          entite: entry.entite,
          id_entite: entry.id_entite ?? null,
          details_json: entry.details_json ?? null,
          adresse_ip: entry.adresse_ip,
          user_agent: entry.user_agent ?? null,
          created_at: now,
          updated_at: now,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to write audit log: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
