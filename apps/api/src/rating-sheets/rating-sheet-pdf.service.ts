import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type { RatingSheetSnapshot } from './rating-sheet-calculation';

const CATEGORY_LABELS: Record<string, string> = {
  auto: 'Auto-évaluation',
  pairs: 'Évaluation par les pairs',
  descendante: 'Évaluation descendante',
  admin: 'Évaluation de l’admin',
};

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
    document.moveDown(1.7);
    document
      .fillColor('#222222')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('Fiche de notation');
    document.moveDown(0.3);
    document
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#555555')
      .text(
        `${snapshot.personne.role} · ${snapshot.periode.nom} · émise le ${new Date(snapshot.emise_le).toLocaleDateString('fr-FR')}`,
      );
    document.moveDown(1);
    document
      .fontSize(11)
      .fillColor('#222222')
      .text(
        `${snapshot.personne.prenom} ${snapshot.personne.nom} — ${snapshot.personne.role}`,
      );
    document
      .fontSize(9)
      .fillColor('#555555')
      .text(`Matricule : ${snapshot.personne.matricule}`);
    document
      .fontSize(9)
      .fillColor('#555555')
      .text(
        `Période : ${snapshot.periode.date_debut} au ${snapshot.periode.date_fin}`,
      )
      .text(
        `État : ${snapshot.statut === 'complete' ? 'Complète' : 'Partielle'}`,
      )
      .text(
        `Note générale : ${snapshot.note_generale_sur_20 === null ? 'Non disponible' : `${snapshot.note_generale_sur_20}/20`}`,
      );
    document.moveDown();

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
      document
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#333333')
        .text(title, { indent: 8 });
    }

    document.moveDown();
    document
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#222222')
      .text('Bilan des compétences');
    document.moveDown(0.4);
    for (const competence of snapshot.competences) {
      if (document.y > 730) document.addPage();
      const categoryText = snapshot.categories
        .map((category) => {
          const note = competence.notes_par_categorie[category.type];
          const mention = competence.mentions_par_categorie[category.type];
          return note === null || note === undefined
            ? null
            : `${CATEGORY_LABELS[category.type] ?? category.type}: ${note}/5 (${mention})`;
        })
        .filter(Boolean)
        .join(' · ');
      const scoreText =
        competence.score === null
          ? 'Non évaluée'
          : `${competence.score}/5 · ${competence.mention}`;
      document
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#222222')
        .text(`${competence.libelle} — ${scoreText}`);
      if (categoryText) {
        document
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#555555')
          .text(categoryText, { indent: 10 });
      }
      document.moveDown(0.35);
    }

    document.moveDown(0.5);
    document
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#222222')
      .text('Compétences à renforcer');
    document.moveDown(0.35);
    if (!snapshot.lacunes.length) {
      document
        .font('Helvetica')
        .fontSize(9)
        .text('Aucune compétence non acquise ou presque acquise identifiée.');
    } else {
      for (const competence of snapshot.lacunes) {
        if (document.y > 740) document.addPage();
        document
          .font('Helvetica')
          .fontSize(9)
          .text(
            `${competence.libelle} — ${competence.mention}${competence.axe ? ` : ${competence.axe}` : ''}`,
          );
      }
    }

    document.moveDown();
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

    document.end();
    return finished;
  }
}
