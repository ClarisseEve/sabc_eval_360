import { Injectable, NotFoundException } from '@nestjs/common';
import PptxGenJS from 'pptxgenjs';
import * as XLSX from 'xlsx';
import { DatabasePgService } from '../database/database-pg.service';
import { RapportRow, RapportSection } from './dto/section.dto';

@Injectable()
export class ExportService {
  constructor(private readonly pg: DatabasePgService) {}

  private async findRapport(idRapport: string): Promise<RapportRow> {
    const row = await this.pg.queryOne<RapportRow>(
      `SELECT * FROM rapports WHERE id_rapport = $1 AND statut != 'supprime'`,
      [idRapport],
    );
    if (!row) throw new NotFoundException(`Rapport ${idRapport} introuvable`);
    return { ...row, sections_json: row.sections_json ?? [] };
  }

  async exportPPTX(idRapport: string): Promise<Buffer> {
    const rapport = await this.findRapport(idRapport);
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';

    // Slide titre
    const titleSlide = pptx.addSlide();
    titleSlide.addText(rapport.titre, {
      x: 1, y: 2, w: 8.5, h: 1.5,
      fontSize: 28, bold: true, color: 'E53E3E', align: 'center',
    });
    titleSlide.addText('SABC — Évaluation 360°', {
      x: 1, y: 3.8, w: 8.5, h: 0.5,
      fontSize: 14, color: '888888', align: 'center',
    });
    titleSlide.addText(new Date().toLocaleDateString('fr-FR'), {
      x: 1, y: 4.5, w: 8.5, h: 0.4,
      fontSize: 12, color: 'AAAAAA', align: 'center',
    });

    const sections = (rapport.sections_json as RapportSection[]);
    for (const section of sections) {
      const slide = pptx.addSlide();
      slide.addShape('rect' as any, { x: 0, y: 0, w: '100%', h: 0.9, fill: { color: 'E53E3E' } });
      slide.addText(section.titre, {
        x: 0.3, y: 0.1, w: 9.4, h: 0.7,
        fontSize: 18, bold: true, color: 'FFFFFF',
      });
      if (section.contenu?.texte) {
        slide.addText(section.contenu.texte, {
          x: 0.5, y: 1.2, w: 9, h: 5.5,
          fontSize: 12, color: '333333', align: 'left', valign: 'top',
          wrap: true,
        });
      }
    }

    return pptx.write({ outputType: 'nodebuffer' }) as unknown as Promise<Buffer>;
  }

  async exportXLSX(idRapport: string): Promise<Buffer> {
    const rapport = await this.findRapport(idRapport);
    const wb = XLSX.utils.book_new();
    const sections = (rapport.sections_json as RapportSection[]);

    if (sections.length === 0) {
      const ws = XLSX.utils.aoa_to_sheet([[rapport.titre], [''], ['Aucune section']]);
      XLSX.utils.book_append_sheet(wb, ws, 'Rapport');
    } else {
      for (const section of sections) {
        const rows: (string | number)[][] = [
          [section.titre],
          [''],
          [section.contenu?.texte ?? ''],
        ];
        if (section.contenu?.graphes?.length) {
          rows.push([''], ['Graphes liés :']);
          for (const g of section.contenu.graphes) {
            rows.push([`- ${g.titre} (${g.type})`]);
          }
        }
        const sheetName = String(section.titre ?? 'Section').slice(0, 31);
        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }
    }

    return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }) as Buffer;
  }

  async logExport(data: {
    rapport_id: string;
    format: string;
    createur_matricule: string;
    fichier_nom: string;
  }): Promise<void> {
    await this.pg.query(
      `INSERT INTO historique_exports (rapport_id, format, createur_matricule, fichier_nom)
       VALUES ($1, $2, $3, $4)`,
      [data.rapport_id, data.format, data.createur_matricule, data.fichier_nom],
    );
  }

  async getExportHistory(rapportId: string): Promise<unknown[]> {
    return this.pg.query(
      `SELECT * FROM historique_exports WHERE rapport_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [rapportId],
    );
  }
}
