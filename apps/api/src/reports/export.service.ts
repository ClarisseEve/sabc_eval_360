import { Injectable, NotFoundException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import PptxGenJS from 'pptxgenjs';
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
    const workbook = new ExcelJS.Workbook();
    const sections = (rapport.sections_json as RapportSection[]);

    if (sections.length === 0) {
      const worksheet = workbook.addWorksheet('Rapport');
      worksheet.addRows([[rapport.titre], [''], ['Aucune section']]);
    } else {
      const usedSheetNames = new Set<string>();
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
        const sheetName = this.uniqueSheetName(
          String(section.titre ?? 'Section'),
          usedSheetNames,
        );
        workbook.addWorksheet(sheetName).addRows(rows);
      }
    }

    const data = await workbook.xlsx.writeBuffer();
    return Buffer.from(data);
  }

  private uniqueSheetName(rawName: string, usedNames: Set<string>): string {
    const sanitized = rawName.replace(/[\\/*?:[\]]/g, ' ').trim() || 'Section';
    const baseName = sanitized.slice(0, 31);
    let candidate = baseName;
    let suffix = 2;

    while (usedNames.has(candidate.toLocaleLowerCase('fr-FR'))) {
      const suffixText = ` (${suffix++})`;
      candidate = `${baseName.slice(0, 31 - suffixText.length)}${suffixText}`;
    }

    usedNames.add(candidate.toLocaleLowerCase('fr-FR'));
    return candidate;
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
