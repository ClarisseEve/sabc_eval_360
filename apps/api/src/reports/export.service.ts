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
      const selectedCharts = section.contenu?.graphes ?? [];
      let currentY = 1.05;
      
      if (section.contenu?.texte) {
        const textHeight = 1.0; // Hauteur fixe pour le texte
        slide.addText(section.contenu.texte, {
          x: 0.55, y: currentY, w: 12.1, h: textHeight,
          fontSize: 11, color: '333333', align: 'left', valign: 'top',
          wrap: true,
        });
        currentY += textHeight + 0.15; // Ajouter espace après texte
      }
      
      const charts = await Promise.all(
        selectedCharts.map((graphe) => this.getChartData(graphe.donnees_source)),
      );
      charts.forEach((chart, index) => {
        if (!chart || chart.data.length === 0) return;
        const y = currentY + Math.floor(index / 2) * 2.85;
        const x = 0.55 + (index % 2) * 6.4;
        slide.addText(chart.title, { x, y, w: 5.9, h: 0.3, fontSize: 12, bold: true, color: '333333' });
        const chartOpts = {
          x, y: y + 0.35, w: 5.9, h: 2.4,
          showLegend: chart.type === 'pie',
          showTitle: false,
          dataLabelColor: '333333',
          valAxisMinVal: chart.min,
          valAxisMaxVal: chart.max,
          valGridLine: { color: 'D9D9D9', width: 1 },
          ...chart.chartOptions,
        };
        if (chart.type !== 'pie') {
          Object.assign(chartOpts, { showValue: true, dataLabelFormatCode: '0.00', dataLabelPosition: 'outEnd' });
        } else {
          Object.assign(chartOpts, { showCategoryName: false, showPercent: false, dataLabelPosition: 'ctr' });
        }
        slide.addChart(chart.type as any, chart.data as any, chartOpts as any);
      });
    }

    await this.addGeneralAssessmentSlide(pptx);

    return pptx.write({ outputType: 'nodebuffer' }) as unknown as Promise<Buffer>;
  }

  private async getChartData(source: string): Promise<{
    title: string;
    type: string;
    data: Array<{ name: string; labels: string[]; values: number[] }>;
    min?: number;
    max?: number;
    chartOptions?: any;
  } | null> {
    if (source === 'kpis') {
      const row = await this.pg.queryOne<any>(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE statut = 'valide')::int AS validees,
                ROUND(AVG(note_globale) FILTER (WHERE note_globale IS NOT NULL)::numeric, 2)::float AS score
           FROM evaluations`,
      );
      return { 
        title: 'Indicateurs clés', 
        type: 'bar', 
        data: [{ name: 'Valeur', labels: ['Evaluations', 'Validées', 'Score moyen'], values: [Number(row?.total ?? 0), Number(row?.validees ?? 0), Number(row?.score ?? 0)] }],
        chartOptions: { catAxisLabelFontSize: 11, valAxisLabelFontSize: 10, catAxisLabelRotate: 0 }
      };
    }
    if (source === 'types_evaluation') {
      const rows = (await this.pg.query<any>(
        `SELECT type_evaluation AS label, COUNT(*)::int AS value
           FROM evaluations GROUP BY type_evaluation ORDER BY value DESC`,
      )) ?? [];
      return { 
        title: 'Répartition des évaluations', 
        type: 'pie', 
        data: [{ name: 'Evaluations', labels: rows.map((row) => String(row.label ?? 'Autre')), values: rows.map((row) => Number(row.value ?? 0)) }],
        chartOptions: { dataLabelPosition: 'ctr', dataLabelFontSize: 10, showLegend: true, legendPos: 'b' }
      };
    }
    if (source === 'evolution_performance') {
      const rows = (await this.pg.query<any>(
        `SELECT TO_CHAR(COALESCE(date_validation, date_soumission, date_creation), 'YYYY-MM') AS label,
                ROUND(AVG(note_globale) FILTER (WHERE note_globale IS NOT NULL)::numeric, 2)::float AS value
           FROM evaluations
          GROUP BY 1 ORDER BY 1`,
      )) ?? [];
      return { 
        title: 'Evolution du score moyen', 
        type: 'line', 
        data: [{ name: 'Score moyen', labels: rows.map((row) => String(row.label)), values: rows.map((row) => Number(row.value ?? 0)) }], 
        min: 0, 
        max: 5,
        chartOptions: { catAxisLabelFontSize: 10, valAxisLabelFontSize: 10, catAxisLabelRotate: 45 }
      };
    }
    if (source === 'matrice_competences') {
      const rows = (await this.pg.query<any>(
        `SELECT COALESCE(note->>'nom', note->>'critere', note->>'categorie', 'Critère') AS label,
                ROUND(AVG((note->>'note')::numeric), 2)::float AS value
           FROM evaluations e CROSS JOIN LATERAL jsonb_array_elements(e.notations_json) AS note
          WHERE e.statut = 'valide' AND note->>'note' IS NOT NULL
          GROUP BY 1 ORDER BY value ASC LIMIT 10`,
      )) ?? [];
      return { 
        title: 'Matrice des compétences : moyenne par axe', 
        type: 'bar', 
        data: [{ name: 'Moyenne / 5', labels: rows.map((row) => {
          const label = String(row.label);
          return label.length > 18 ? label.substring(0, 15) + '...' : label;
        }), values: rows.map((row) => Number(row.value ?? 0)) }], 
        min: 0, 
        max: 5,
        chartOptions: { catAxisLabelFontSize: 8, valAxisLabelFontSize: 10, catAxisLabelRotate: 45, showValue: true, catAxisLabelMaxCharLength: 15 }
      };
    }
    return null;
  }

  private async addGeneralAssessmentSlide(pptx: PptxGenJS): Promise<void> {
    const rows = (await this.pg.query<any>(
      `SELECT COALESCE(note->>'nom', note->>'critere', note->>'categorie', 'Critère') AS label,
              ROUND(AVG((note->>'note')::numeric), 2)::float AS value,
              COUNT(*)::int AS count
         FROM evaluations e CROSS JOIN LATERAL jsonb_array_elements(e.notations_json) AS note
        WHERE e.statut = 'valide' AND note->>'note' IS NOT NULL
        GROUP BY 1 HAVING AVG((note->>'note')::numeric) < 3.5 ORDER BY value ASC LIMIT 8`,
    )) ?? [];
    const slide = pptx.addSlide();
    slide.addShape('rect' as any, { x: 0, y: 0, w: '100%', h: 0.9, fill: { color: 'E53E3E' } });
    slide.addText('Bilan général et formations à programmer', { x: 0.3, y: 0.1, w: 9.4, h: 0.7, fontSize: 18, bold: true, color: 'FFFFFF' });
    if (rows.length === 0) {
      slide.addText('Aucun axe prioritaire identifié sur les évaluations validées.', { x: 0.5, y: 1.35, w: 12, h: 0.45, fontSize: 13, color: '333333' });
      return;
    }

    slide.addText('Axes présentant une moyenne inférieure à 3,5/5. A programmer en priorité :', { x: 0.5, y: 1.05, w: 12, h: 0.4, fontSize: 12, color: '333333' });
    const tableRows = [
      [
        { text: 'Compétence / axe', options: { bold: true, color: 'FFFFFF' } },
        { text: 'Moyenne', options: { bold: true, color: 'FFFFFF', align: 'center' } },
        { text: 'Priorité', options: { bold: true, color: 'FFFFFF', align: 'center' } },
        { text: 'Formation recommandée', options: { bold: true, color: 'FFFFFF' } },
      ],
      ...rows.map((row) => {
        const label = String(row.label);
        const score = Number(row.value);
        return [
          label,
          `${score.toFixed(2)}/5`,
          score < 2.5 ? 'Haute' : 'Moyenne',
          `Renforcer ${label.toLowerCase()} avec un accompagnement pratique.`,
        ];
      }),
    ];
    slide.addTable(tableRows as any, {
      x: 0.45,
      y: 1.65,
      w: 12.4,
      h: 4.9,
      colW: [3.1, 1.25, 1.35, 6.7],
      rowH: 0.52,
      fontFace: 'Aptos',
      fontSize: 11,
      color: '333333',
      border: { type: 'solid', color: 'D9D9D9', pt: 1 },
      fill: 'FFFFFF',
      margin: 0.08,
      valign: 'mid',
      bold: false,
      autoFit: false,
      breakLine: false,
      cellProps: (rowIndex: number, colIndex: number) => ({
        fill: rowIndex === 0 ? 'C62828' : rowIndex % 2 === 0 ? 'F8F8F8' : 'FFFFFF',
        align: colIndex === 1 || colIndex === 2 ? 'center' : 'left',
      }),
    } as any);
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
