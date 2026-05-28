import { Injectable } from '@nestjs/common';

@Injectable()
export class ValidationNotationService {
  validateNote(note: number): boolean {
    return Number.isInteger(note) && note >= 1 && note <= 5;
  }

  validateCommentaireObligatoire(
    note: number,
    commentaire: string | null | undefined,
    seuil = 3,
  ): { valid: boolean; error?: string } {
    if (note < seuil) {
      const isEmpty =
        commentaire === null ||
        commentaire === undefined ||
        commentaire.trim() === '';
      if (isEmpty) {
        return {
          valid: false,
          error: `Un commentaire est obligatoire pour une note inférieure à ${seuil}.`,
        };
      }
    }
    return { valid: true };
  }

  validateBornes(
    notes: Array<{ note: number; [key: string]: any }>,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    notes.forEach((n, index) => {
      if (!this.validateNote(n.note)) {
        const label =
          n.critere_id != null
            ? `critère « ${n.critere_id} »`
            : `note à l'index ${index}`;
        errors.push(
          `La note du ${label} (${n.note}) est invalide. Valeur attendue : entier entre 1 et 5.`,
        );
      }
    });
    return { valid: errors.length === 0, errors };
  }

  validateCompletude(
    notes: Array<{ critere_id?: string; [key: string]: any }>,
    criteres: Array<{ id?: string; critere_id?: string; [key: string]: any }>,
  ): { complete: boolean; rated: number; total: number; missing: number } {
    const total = criteres.length;
    const notedIds = new Set(
      notes
        .map((n) => n.critere_id)
        .filter((id): id is string => id !== undefined && id !== null),
    );
    const rated = criteres.filter((c) => {
      const id = c.id ?? c.critere_id;
      return id !== undefined && id !== null && notedIds.has(id);
    }).length;
    const missing = total - rated;
    return { complete: missing === 0, rated, total, missing };
  }

  validateCommentaires(
    notes: Array<{
      note: number;
      critere_id?: string;
      commentaire?: string | null;
      seuil?: number;
      [key: string]: any;
    }>,
    seuil = 3,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    notes.forEach((n, index) => {
      const effectiveSeuil = n.seuil ?? seuil;
      const result = this.validateCommentaireObligatoire(
        n.note,
        n.commentaire,
        effectiveSeuil,
      );
      if (!result.valid) {
        const label =
          n.critere_id != null
            ? `critère « ${n.critere_id} »`
            : `note à l'index ${index}`;
        errors.push(`${label} : ${result.error}`);
      }
    });
    return { valid: errors.length === 0, errors };
  }

  validatePourSoumission(
    notes: any[],
    criteres: any[],
  ): { valid: boolean; errors: string[] } {
    const bornesResult = this.validateBornes(notes);
    const completudeResult = this.validateCompletude(notes, criteres);
    const commentairesResult = this.validateCommentaires(notes);

    const errors: string[] = [...bornesResult.errors];

    if (!completudeResult.complete) {
      errors.push(
        `Évaluation incomplète : ${completudeResult.rated} critère(s) noté(s) sur ${completudeResult.total}. Il manque ${completudeResult.missing} note(s).`,
      );
    }

    errors.push(...commentairesResult.errors);

    return { valid: errors.length === 0, errors };
  }

  calculerProgression(notes: any[], totalCriteres: number): number {
    if (totalCriteres === 0) {
      return 0;
    }
    const raw = Math.floor((notes.length / totalCriteres) * 100);
    return Math.min(100, Math.max(0, raw));
  }

  calculerNoteGlobale(
    notes: Array<{
      note: number;
      poids?: number;
      ponderation?: number;
      [key: string]: any;
    }>,
  ): number | null {
    const validNotes = notes.filter((n) => n.note >= 1 && n.note <= 5);
    if (validNotes.length === 0) {
      return null;
    }
    let weightedSum = 0;
    let totalWeight = 0;
    for (const n of validNotes) {
      const weight = n.poids ?? n.ponderation ?? 1;
      weightedSum += n.note * weight;
      totalWeight += weight;
    }
    if (totalWeight === 0) {
      return null;
    }
    return Math.round((weightedSum / totalWeight) * 100) / 100;
  }
}
