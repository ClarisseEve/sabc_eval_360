import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type {
  RatingSheetCategory,
  RatingSheetCompetence,
  RatingSheetCategoryResult,
  RatingSheetMention,
  RatingSheetSnapshot,
} from './rating-sheet-calculation';

const CATEGORY_LABELS: Record<string, string> = {
  auto: 'Auto-évaluation',
  pairs: 'Évaluation par les pairs',
  descendante: 'Évaluation descendante',
  admin: 'Évaluation de l’admin',
};

const MENTION_STYLES: Record<
  RatingSheetMention,
  { color: string; font: string }
> = {
  Acquis: { color: '#15803d', font: 'Helvetica-Bold' },
  'Non acquis': { color: '#b91c1c', font: 'Helvetica-Bold' },
  'Presque acquis': { color: '#222222', font: 'Helvetica-Oblique' },
};

const EVALUATION_NOTE_CATEGORIES: RatingSheetCategory[] = [
  'auto',
  'pairs',
  'descendante',
];

export function formatRatingSheetDate(value: string): string {
  const dateOnly = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return dateOnly?.[1] ?? value;
}

export function getRatingSheetPeriodHeader(period: {
  nom: string;
  code: string;
}): { cycle: string; semestre: string } {
  const nameParts = period.nom.match(
    /(?:cycle\s*)?(20\d{2}).*?\bsem(?:estre)?\s*([12])\b/i,
  );
  if (nameParts) {
    return { cycle: nameParts[1], semestre: nameParts[2] };
  }

  const codeParts = period.code.match(/^P?(\d{2})0?([12])$/i);
  if (codeParts) {
    return { cycle: `20${codeParts[1]}`, semestre: codeParts[2] };
  }

  const year = period.nom.match(/20\d{2}/)?.[0];
  return {
    cycle: year ?? period.nom,
    semestre: '—',
  };
}

function formatIssuedDate(value: string): string {
  return new Date(value).toLocaleDateString('fr-FR', { timeZone: 'UTC' });
}

export function hasAllEvaluationTypes(
  categories: RatingSheetCategoryResult[],
): boolean {
  return EVALUATION_NOTE_CATEGORIES.every((type) =>
    categories.some((category) => category.type === type && category.complete),
  );
}

@Injectable()
export class RatingSheetPdfService {
  async create(snapshot: RatingSheetSnapshot): Promise<Buffer> {
    const document = new PDFDocument({
      size: 'A4',
      margin: 40,
      bufferPages: true,
    });
    const chunks: Buffer[] = [];
    document.on('data', (chunk: Buffer) => chunks.push(chunk));
    const finished = new Promise<Buffer>((resolve, reject) => {
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.on('error', reject);
    });

    document.fillColor('#c91f32').rect(40, 34, 515, 7).fill();
    document.moveDown(2);
    document
      .fillColor('#222222')
      .font('Helvetica-Bold')
      .fontSize(18)
      .text('FICHE DE NOTATION', {
        align: 'center',
        underline: true,
        characterSpacing: 0.3,
      });
    const periodHeader = getRatingSheetPeriodHeader(snapshot.periode);
    document.moveDown(1.2);
    const headerRows = [
      `Poste : ${snapshot.personne.role}     Cycle : ${periodHeader.cycle}     Semestre : ${periodHeader.semestre}     Émise le : ${formatIssuedDate(snapshot.emise_le)}`,
      `Nom et prénom : ${snapshot.personne.prenom} ${snapshot.personne.nom}     Matricule : ${snapshot.personne.matricule}`,
      `Période : ${formatRatingSheetDate(snapshot.periode.date_debut)} au ${formatRatingSheetDate(snapshot.periode.date_fin)}`,
      `Service : ${snapshot.personne.service ?? '—'}     District : ${snapshot.personne.district ?? '—'}     Région : ${snapshot.personne.region ?? '—'}`,
    ];
    for (const row of headerRows) {
      document
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#333333')
        .text(row, document.page.margins.left, document.y, {
          width:
            document.page.width -
            document.page.margins.left -
            document.page.margins.right,
        });
      document.moveDown(0.3);
    }
    document.moveDown(0.5);

    document
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#222222')
      .text('Résultats par catégorie');
    document.moveDown(0.4);
    for (const category of snapshot.categories) {
      const title = `${CATEGORY_LABELS[category.type] ?? category.type} — ${category.complete ? 'reçue' : 'manquante'} — ${
        category.note_sur_20 === null
          ? 'note indisponible'
          : `${category.note_sur_20}/20`
      }`;
      document.font('Helvetica').fontSize(9).fillColor('#333333').text(title);
    }

    document.moveDown();
    const showCategoryNotes = hasAllEvaluationTypes(snapshot.categories);
    const tableColumns = showCategoryNotes
      ? [
          {
            label: 'Compétence',
            width: 180,
            value: (item: RatingSheetCompetence) => item.libelle,
          },
          {
            label: 'Niveau requis',
            width: 72,
            value: (item: RatingSheetCompetence) => `${item.niveau_requis}/5`,
          },
          ...EVALUATION_NOTE_CATEGORIES.map((type) => ({
            label:
              type === 'auto'
                ? 'Auto'
                : type === 'pairs'
                  ? 'Pair'
                  : 'Descendante',
            width: type === 'descendante' ? 72 : 48,
            value: (item: RatingSheetCompetence) => {
              const score = item.notes_par_categorie[type];
              return score === null || score === undefined ? '—' : `${score}/5`;
            },
          })),
          {
            label: 'Mention / statut',
            width: 95,
            value: (item: RatingSheetCompetence) => item.mention ?? '—',
            mention: true,
          },
        ]
      : [
          {
            label: 'Compétence',
            width: 205,
            value: (item: RatingSheetCompetence) => item.libelle,
          },
          {
            label: 'Note',
            width: 55,
            value: (item: RatingSheetCompetence) =>
              item.score === null ? '—' : `${item.score}/5`,
          },
          {
            label: 'Niveau requis',
            width: 80,
            value: (item: RatingSheetCompetence) => `${item.niveau_requis}/5`,
          },
          {
            label: 'Mention / statut',
            width: 175,
            value: (item: RatingSheetCompetence) => item.mention ?? '—',
            mention: true,
          },
        ];
    const tableX = document.page.margins.left;
    const tableWidth = tableColumns.reduce(
      (total, column) => total + column.width,
      0,
    );
    const bottomY = document.page.height - document.page.margins.bottom;
    const drawTableHeader = () => {
      const y = document.y;
      const height = 24;
      document.rect(tableX, y, tableWidth, height).fill('#f1f2f4');
      let x = tableX;
      for (const column of tableColumns) {
        document
          .font('Helvetica-Bold')
          .fontSize(8)
          .fillColor('#333333')
          .text(column.label, x + 4, y + 7, {
            width: column.width - 8,
            height: height - 10,
          });
        x += column.width;
      }
      document.y = y + height;
    };
    const drawCompetenceRow = (competence: RatingSheetCompetence) => {
      const mention = competence.mention;
      const cells = tableColumns.map((column) => column.value(competence));
      const height =
        Math.max(
          ...cells.map((cell, index) => {
            const column = tableColumns[index];
            const style =
              column.mention && mention ? MENTION_STYLES[mention] : null;
            document.font(style?.font ?? 'Helvetica').fontSize(8);
            return document.heightOfString(cell, {
              width: column.width - 8,
            });
          }),
          10,
        ) + 8;
      if (document.y + height > bottomY) {
        document.addPage();
        drawTableHeader();
      }
      const y = document.y;
      let x = tableX;
      cells.forEach((cell, index) => {
        const column = tableColumns[index];
        const style =
          column.mention && mention ? MENTION_STYLES[mention] : null;
        document
          .font(style?.font ?? 'Helvetica')
          .fontSize(8)
          .fillColor(style?.color ?? '#333333')
          .text(cell, x + 4, y + 4, {
            width: column.width - 8,
            height: height - 6,
          });
        x += column.width;
      });
      document
        .moveTo(tableX, y + height)
        .lineTo(tableX + tableWidth, y + height)
        .lineWidth(0.4)
        .strokeColor('#d1d5db')
        .stroke();
      document.y = y + height;
    };

    if (document.y + 52 > bottomY) document.addPage();
    document
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#222222')
      .text('Bilan des compétences');
    document.moveDown(0.4);
    if (!snapshot.competences.length) {
      document
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#555555')
        .text('Aucune compétence évaluée pour le moment.');
    } else {
      drawTableHeader();
      for (const competence of snapshot.competences) {
        drawCompetenceRow(competence);
      }
    }

    document.moveDown(0.5);
    if (document.y + 40 > bottomY) document.addPage();
    document.font('Helvetica-Bold').fontSize(12).text('Principales forces');
    document.moveDown(0.35);
    document
      .font('Helvetica')
      .fontSize(9)
      .text(
        snapshot.forces.length
          ? snapshot.forces
              .map(
                (competence) => `${competence.libelle} (${competence.score}/5)`,
              )
              .join(' · ')
          : 'Aucune force calculable pour le moment.',
      );

    document.moveDown();
    if (document.y + 40 > bottomY) document.addPage();
    document
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('Compétences à améliorer');
    document.moveDown(0.35);
    if (!snapshot.lacunes.length) {
      document
        .font('Helvetica')
        .fontSize(9)
        .text('Aucune compétence non acquise ou presque acquise identifiée.');
    } else {
      for (const competence of snapshot.lacunes) {
        if (document.y + 24 > bottomY) document.addPage();
        const style = competence.mention
          ? MENTION_STYLES[competence.mention]
          : null;
        document
          .font(style?.font ?? 'Helvetica')
          .fontSize(9)
          .fillColor(style?.color ?? '#333333')
          .text(
            `${competence.libelle} — ${competence.mention ?? 'Non évaluée'}${competence.axe ? ` : ${competence.axe}` : ''}`,
          );
      }
    }

    document.end();
    return finished;
  }
}
