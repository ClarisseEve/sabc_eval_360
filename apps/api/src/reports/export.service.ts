import { Injectable, NotFoundException } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Document, HeadingLevel, ImageRun, Packer, Paragraph, TextRun, WidthType } from 'docx';
import ExcelJS from 'exceljs';
import PptxGenJS from 'pptxgenjs';
import { DatabasePgService } from '../database/database-pg.service';
import { PrismaService } from '../prisma/prisma.service';
import { RapportRow, RapportSection } from './dto/section.dto';

@Injectable()
export class ExportService {
  constructor(
    private readonly pg: DatabasePgService,
    private readonly prisma?: PrismaService,
  ) {}

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
    pptx.author = 'SABC Eval360';
    pptx.company = 'Boissons du Cameroun';
    pptx.subject = 'Rapport d’évaluation 360°';
    pptx.title = rapport.titre;

    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: 'FFFFFF' };
    const logo = this.readBrandLogo();
    if (logo.length > 0) {
      titleSlide.addImage({
        data: `data:image/png;base64,${logo.toString('base64')}`,
        x: 0.8, y: 0.45, w: 2.35, h: 0.95,
      });
    }
    titleSlide.addText('Boissons du Cameroun', {
      x: 0.8, y: 1.45, w: 3.2, h: 0.4,
      fontSize: 15, bold: true, color: 'C62828', margin: 0,
    });
    titleSlide.addText(rapport.sous_titre || 'SABC — Évaluation 360°', {
      x: 0.8, y: 1.9, w: 8.5, h: 0.45,
      fontSize: 12, color: '6B7280', italic: true,
    });
    titleSlide.addText(rapport.titre, {
      x: 1.2, y: 2.1, w: 8.2, h: 0.9,
      fontSize: 26, bold: true, color: 'C62828', align: 'left',
    });
    titleSlide.addText('Axes d’analyse • performance • alertes • recommandations', {
      x: 1.2, y: 3.1, w: 7.8, h: 0.45,
      fontSize: 15, color: '2F3542', italic: true,
    });
    titleSlide.addText(new Date().toLocaleDateString('fr-FR'), {
      x: 1.2, y: 4.3, w: 2.5, h: 0.3,
      fontSize: 11, color: '6B7280',
    });
    titleSlide.addShape('roundRect', { x: 10.15, y: 1.2, w: 1.9, h: 1.9, fill: { color: 'C62828' }, line: { color: 'C62828', pt: 0 } });
    titleSlide.addText('01', { x: 10.3, y: 1.7, w: 1.5, h: 0.7, fontSize: 24, bold: true, color: 'FFFFFF', align: 'center' });

    const sections = (rapport.sections_json as RapportSection[]);
    for (const section of sections) {
      const slide = pptx.addSlide();
      slide.background = { color: 'FFFFFF' };
      slide.addShape('rect', { x: 0, y: 0, w: 13.3, h: 0.7, fill: { color: 'C62828' } });
      slide.addText(section.titre, {
        x: 0.45, y: 0.14, w: 9.2, h: 0.4,
        fontSize: 20, bold: true, color: 'FFFFFF',
      });
      slide.addText('Sous-titre analytique • axes annotés • proportions et alertes', {
        x: 9.8, y: 0.15, w: 3.1, h: 0.28,
        fontSize: 8, color: 'F5F5F5', italic: true, align: 'right',
      });

      const selectedCharts = section.contenu?.graphes ?? [];
      let currentY = 1.05;

      if (section.contenu?.texte) {
        const textHeight = 1.0;
        slide.addText(section.contenu.texte, {
          x: 0.55, y: currentY, w: 12.1, h: textHeight,
          fontSize: 11, color: '333333', align: 'left', valign: 'top',
          wrap: true,
        });
        currentY += textHeight + 0.15;
      }

      const charts = await Promise.all(
        selectedCharts.map((graphe) => this.getChartData(graphe.donnees_source)),
      );
      charts.forEach((chart, index) => {
        if (!chart || chart.data.length === 0) return;
        const y = currentY + Math.floor(index / 2) * 2.85;
        const x = 0.55 + (index % 2) * 6.4;
        slide.addShape('roundRect', {
          x, y, w: 5.9, h: 0.32, fill: { color: 'FCE4E4' }, line: { color: 'E53E3E', pt: 0.5 },
        });
        slide.addText(chart.title, { x: x + 0.15, y: y + 0.04, w: 5.3, h: 0.24, fontSize: 13, bold: true, color: 'C62828' });
        slide.addText('Axe horizontal = périmètre; Axe vertical = score / proportion', {
          x, y: y + 2.76, w: 5.9, h: 0.2, fontSize: 10, color: '6B7280', italic: true,
        });
        const chartOpts = {
          x, y: y + 0.39, w: 5.9, h: 2.35,
          showLegend: chart.type === 'pie',
          legendFontSize: 11,
          showTitle: false,
          dataLabelColor: '333333',
          dataLabelFontSize: 12,
          catAxisLabelFontSize: 11,
          valAxisLabelFontSize: 11,
          valAxisMinVal: chart.min,
          valAxisMaxVal: chart.max,
          valGridLine: { color: 'D9D9D9', width: 1 },
          catAxisLine: { color: 'B8B8B8', width: 1 },
          valAxisLine: { color: 'B8B8B8', width: 1 },
          ...chart.chartOptions,
        };
        if (chart.type !== 'pie') {
          Object.assign(chartOpts, { showValue: true, showCategoryName: true, dataLabelFormatCode: '0.00', dataLabelPosition: 'outEnd' });
        } else {
          Object.assign(chartOpts, { showCategoryName: true, showPercent: true, dataLabelPosition: 'bestFit', dataLabelFormatCode: '0%' });
        }
        slide.addChart(chart.type as any, chart.data as any, chartOpts as any);
      });
    }

    await this.addGeneralAssessmentSlide(pptx);

    return pptx.write({ outputType: 'nodebuffer' }) as unknown as Promise<Buffer>;
  }

  private readBrandLogo(): Buffer {
    const candidates = [
      resolve(process.cwd(), 'assets/sabc-logo.png'),
      resolve(process.cwd(), '../web/public/images/logos/sabc-logo.png'),
      resolve(__dirname, '../../../../web/public/images/logos/sabc-logo.png'),
      resolve(__dirname, '../../../web/public/images/logos/sabc-logo.png'),
      resolve(process.cwd(), 'public/images/logos/sabc-logo.png'),
    ];

    for (const candidate of candidates) {
      try {
        return readFileSync(candidate);
      } catch {
        // continue trying the next candidate
      }
    }

    return Buffer.from('');
  }

  async exportDOCX(idRapport: string): Promise<Buffer> {
    const rapport = await this.findRapport(idRapport);
    const logo = this.readBrandLogo();

    const children = [
      new Paragraph({
        alignment: 'center',
        spacing: { after: 200 },
        children: [
          new ImageRun({
            data: logo,
            transformation: { width: 180, height: 120 },
            type: 'png',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({ text: 'Boissons du Cameroun', bold: true, size: 26, color: 'C62828' }),
        ],
      }),
      new Paragraph({
        spacing: { after: 240 },
        children: [
          new TextRun({ text: rapport.sous_titre || 'SABC — Évaluation 360°', italics: true, size: 22, color: '6B7280' }),
        ],
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({ text: rapport.titre, bold: true, size: 32, color: 'C62828' }),
        ],
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({ text: 'Axes d’analyse • performance • alertes • recommandations', size: 20, color: '2F3542' }),
        ],
      }),
    ];

    for (const section of rapport.sections_json ?? []) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
          children: [new TextRun({ text: section.titre, bold: true, color: 'C62828' })],
        }),
      );

      const textValue = typeof section.contenu?.texte === 'string' ? section.contenu.texte : '';
      if (textValue) {
        children.push(
          new Paragraph({
            spacing: { after: 100 },
            children: [new TextRun({ text: textValue, size: 20, color: '333333' })],
          }),
        );
      }

      for (const graph of section.contenu?.graphes ?? []) {
        children.push(
          new Paragraph({
            spacing: { before: 80, after: 40 },
            children: [new TextRun({ text: `• ${graph.titre ?? 'Graphique'}`, bold: true, size: 18, color: '333333' })],
          }),
        );
      }
    }

    const document = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children,
      }],
    });

    return Buffer.from(await Packer.toBuffer(document));
  }

  private async getUserDirectory(): Promise<Map<string, { metier: string; region: string; district: string }>> {
    if (!this.prisma) return new Map();
    const users = await this.prisma.utilisateur.findMany({
      select: { matricule: true, role_nom: true, role: true, region_nom: true, id_district: true },
    });
    return new Map(users.map((user) => [
      user.matricule,
      {
        metier: user.role_nom || user.role || 'Métier non renseigné',
        region: user.region_nom || 'Région non renseignée',
        district: user.id_district || 'District non renseigné',
      },
    ]));
  }

  private async getCompetencyRows(): Promise<Array<{ matricule: string; label: string; value: number }>> {
    return (await this.pg.query<any>(
      `SELECT e.evalue_matricule AS matricule,
              COALESCE(note->>'nom', note->>'critere', note->>'categorie', 'Critère') AS label,
              ROUND(AVG((note->>'note')::numeric), 2)::float AS value
         FROM evaluations e
         CROSS JOIN LATERAL jsonb_array_elements(e.notations_json) AS note
        WHERE e.statut = 'valide' AND note->>'note' IS NOT NULL
        GROUP BY e.evalue_matricule, 2`,
    )) ?? [];
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
        chartOptions: { catAxisLabelFontSize: 11, valAxisLabelFontSize: 10, catAxisLabelRotate: 0 },
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
        chartOptions: { dataLabelPosition: 'ctr', dataLabelFontSize: 10, showLegend: true, legendPos: 'b' },
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
        title: 'Évolution du score moyen',
        type: 'line',
        data: [{ name: 'Score moyen', labels: rows.map((row) => String(row.label)), values: rows.map((row) => Number(row.value ?? 0)) }],
        min: 0,
        max: 5,
        chartOptions: { catAxisLabelFontSize: 10, valAxisLabelFontSize: 10, catAxisLabelRotate: 45 },
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
        chartOptions: { catAxisLabelFontSize: 8, valAxisLabelFontSize: 10, catAxisLabelRotate: 45, showValue: true, catAxisLabelMaxCharLength: 15 },
      };
    }
    if (source === 'competences_faibles_metier') {
      const rows = await this.getCompetencyRows();
      const directory = await this.getUserDirectory();
      const globalAverages = new Map<string, number[]>();
      rows.forEach((row) => globalAverages.set(row.label, [...(globalAverages.get(row.label) ?? []), row.value]));
      const labels = [...globalAverages.entries()]
        .map(([label, values]) => ({ label, value: values.reduce((sum, value) => sum + value, 0) / values.length }))
        .filter((row) => row.value < 3.5)
        .sort((a, b) => a.value - b.value)
        .slice(0, 8)
        .map((row) => row.label);
      const métiers = [...new Set(rows.map((row) => directory.get(row.matricule)?.metier ?? 'Métier non renseigné'))];
      return {
        title: 'Compétences faiblement acquises par métier',
        type: 'radar',
        data: métiers.map((metier) => {
          const weakPeopleCount = new Set(rows
            .filter((row) => row.value < 3.5 && (directory.get(row.matricule)?.metier ?? 'Métier non renseigné') === metier)
            .map((row) => row.matricule)).size;
          return {
          name: `${metier} (${weakPeopleCount} non acquis)`,
          labels,
          values: labels.map((label) => {
            const values = rows.filter((row) => row.label === label && (directory.get(row.matricule)?.metier ?? 'Métier non renseigné') === metier).map((row) => row.value);
            return values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)) : 0;
          }),
          };
        }),
        min: 0,
        max: 5,
        chartOptions: { showLegend: true, legendPos: 'b', catAxisLabelFontSize: 9, valAxisLabelFontSize: 8, showValue: true },
      };
    }
    if (source === 'competences_faibles_region' || source === 'competences_faibles_district') {
      const rows = await this.getCompetencyRows();
      const directory = await this.getUserDirectory();
      const dimension = source === 'competences_faibles_region' ? 'region' : 'district';
      const grouped = new Map<string, number[]>();
      rows.forEach((row) => {
        const key = directory.get(row.matricule)?.[dimension] ?? `${dimension === 'region' ? 'Région' : 'District'} non renseigné`;
        grouped.set(`${key}::${row.label}`, [...(grouped.get(`${key}::${row.label}`) ?? []), row.value]);
      });
      const labels = [...new Set(rows.map((row) => row.label))].slice(0, 8);
      const dimensions = [...new Set(rows.map((row) => directory.get(row.matricule)?.[dimension] ?? 'Non renseigné'))];
      return {
        title: source === 'competences_faibles_region' ? 'Compétences faibles par région' : 'Compétences faibles par district',
        type: 'bar',
        data: [{
          name: 'Moyenne / 5',
          labels: dimensions.map((item) => `${item} — ${labels[0] ?? 'Compétence'}`),
          values: dimensions.map((item) => {
            const values = grouped.get(`${item}::${labels[0]}`) ?? [];
            return values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)) : 0;
          }),
        }],
        min: 0,
        max: 5,
        chartOptions: { barDir: 'bar', catAxisLabelFontSize: 9, valAxisLabelFontSize: 10, showValue: true, catAxisLabelMaxCharLength: 40 },
      };
    }
    if (source === 'classement_competences_metier') {
      const rows = (await this.pg.query<any>(
        `SELECT COALESCE(note->>'nom', note->>'critere', note->>'categorie', 'Critère') AS label,
                ROUND(AVG((note->>'note')::numeric), 2)::float AS value
           FROM evaluations e CROSS JOIN LATERAL jsonb_array_elements(e.notations_json) AS note
          WHERE e.statut = 'valide' AND note->>'note' IS NOT NULL
          GROUP BY 1 ORDER BY value DESC LIMIT 10`,
      )) ?? [];
      return { title: 'Classement des compétences', type: 'bar', data: [{ name: 'Moyenne / 5', labels: rows.map((row) => String(row.label)), values: rows.map((row) => Number(row.value ?? 0)) }], min: 0, max: 5, chartOptions: { barDir: 'bar', catAxisLabelFontSize: 9, valAxisLabelFontSize: 10, showValue: true, catAxisLabelMaxCharLength: 40 } };
    }
    if (source === 'top_performers') {
      const rows = (await this.pg.query<any>(
        `SELECT e.evalue_matricule AS label, ROUND(AVG(e.note_globale) FILTER (WHERE e.note_globale IS NOT NULL)::numeric, 2)::float AS value
           FROM evaluations e WHERE e.statut = 'valide' GROUP BY e.evalue_matricule ORDER BY value DESC LIMIT 10`,
      )) ?? [];
      return { title: 'Top 10 meilleurs performers', type: 'bar', data: [{ name: 'Score moyen / 5', labels: rows.map((row) => String(row.label)), values: rows.map((row) => Number(row.value ?? 0)) }], min: 0, max: 5, chartOptions: { barDir: 'bar', catAxisLabelFontSize: 9, valAxisLabelFontSize: 10, showValue: true } };
    }
    if (source === 'alertes_faiblesses') {
      const rows = (await this.pg.query<any>(
        `SELECT COALESCE(note->>'nom', note->>'critere', note->>'categorie', 'Critère') AS label, COUNT(DISTINCT e.evalue_matricule)::int AS value
           FROM evaluations e CROSS JOIN LATERAL jsonb_array_elements(e.notations_json) AS note
          WHERE e.statut = 'valide' AND note->>'note' IS NOT NULL AND (note->>'note')::numeric < 3.5
          GROUP BY 1 ORDER BY value DESC LIMIT 8`,
      )) ?? [];
      return { title: 'Alerte : collaborateurs n’ayant pas acquis la compétence', type: 'pie', data: [{ name: 'Collaborateurs concernés', labels: rows.map((row) => String(row.label)), values: rows.map((row) => Number(row.value ?? 0)) }], chartOptions: { dataLabelPosition: 'ctr', dataLabelFontSize: 9, showLegend: true, legendPos: 'b' } };
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
