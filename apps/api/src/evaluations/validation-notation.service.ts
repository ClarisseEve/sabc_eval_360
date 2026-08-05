import { Injectable } from '@nestjs/common';

export type CanonicalEvaluationNote = {
  critere_id: string;
  note: number;
  commentaire?: string | null;
};

type SubmissionCriterion = {
  id?: string | number | null;
  critere_id?: string | number | null;
  poids?: number | null;
  commentaire_requis_si_note_lt?: number | null;
  echelle?: {
    min?: number | null;
    max?: number | null;
  } | null;
};

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

  validateBornes(notes: Array<{ note: number; [key: string]: any }>): {
    valid: boolean;
    errors: string[];
  } {
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
    notes: Array<{ critere_id?: unknown; [key: string]: any }>,
    criteres: Array<{ id?: unknown; critere_id?: unknown; [key: string]: any }>,
  ): { complete: boolean; rated: number; total: number; missing: number } {
    const total = criteres.length;
    const notedIds = new Set(
      notes
        .map((n) => n.critere_id)
        .filter((id) => id !== undefined && id !== null)
        .map((id) => String(id)),
    );
    const rated = criteres.filter((c) => {
      const id = c.id ?? c.critere_id;
      return id !== undefined && id !== null && notedIds.has(String(id));
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
    notes: CanonicalEvaluationNote[],
    criteres: SubmissionCriterion[],
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const criterionById = new Map<string, SubmissionCriterion>();

    if (criteres.length === 0) {
      errors.push("La règle d'évaluation ne contient aucun critère.");
    }

    criteres.forEach((critere, index) => {
      const rawId = critere.id ?? critere.critere_id;
      const id =
        rawId === undefined || rawId === null ? '' : String(rawId).trim();
      if (!id) {
        errors.push(
          `La règle contient un critère sans identifiant à l'index ${index}.`,
        );
        return;
      }
      if (criterionById.has(id)) {
        errors.push(
          `La règle contient plusieurs critères avec l'identifiant « ${id} ».`,
        );
        return;
      }
      criterionById.set(id, critere);

      const weight = Number(critere.poids);
      if (!Number.isFinite(weight) || weight <= 0) {
        errors.push(
          `La pondération serveur du critère « ${id} » est invalide.`,
        );
      }
    });

    const seenIds = new Set<string>();
    notes.forEach((note, index) => {
      const id = String(note.critere_id ?? '').trim();
      if (!id) {
        errors.push(`La note à l'index ${index} ne référence aucun critère.`);
        return;
      }
      if (seenIds.has(id)) {
        errors.push(
          `Le critère « ${id} » est présent plusieurs fois dans les notes.`,
        );
        return;
      }
      seenIds.add(id);

      const critere = criterionById.get(id);
      if (!critere) {
        errors.push(
          `Le critère « ${id} » n'appartient pas à la règle de cette évaluation.`,
        );
        return;
      }

      const serverMin = critere.echelle?.min;
      const serverMax = critere.echelle?.max;
      const min =
        typeof serverMin === 'number' && Number.isFinite(serverMin)
          ? serverMin
          : 1;
      const max =
        typeof serverMax === 'number' && Number.isFinite(serverMax)
          ? serverMax
          : 5;
      if (!Number.isInteger(note.note) || note.note < min || note.note > max) {
        errors.push(
          `La note du critère « ${id} » (${note.note}) est invalide. Valeur attendue : entier entre ${min} et ${max}.`,
        );
      }

      const threshold = critere.commentaire_requis_si_note_lt;
      if (
        typeof threshold === 'number' &&
        Number.isFinite(threshold) &&
        note.note < threshold
      ) {
        const hasComment =
          typeof note.commentaire === 'string' &&
          note.commentaire.trim().length > 0;
        if (!hasComment) {
          errors.push(
            `critère « ${id} » : Un commentaire est obligatoire pour une note inférieure à ${threshold}.`,
          );
        }
      }
    });

    const completudeResult = this.validateCompletude(notes, criteres);

    if (!completudeResult.complete) {
      errors.push(
        `Évaluation incomplète : ${completudeResult.rated} critère(s) noté(s) sur ${completudeResult.total}. Il manque ${completudeResult.missing} note(s).`,
      );
    }

    return { valid: errors.length === 0, errors };
  }

  normaliserNotes(rawNotes: unknown): {
    notes: CanonicalEvaluationNote[];
    errors: string[];
  } {
    if (!Array.isArray(rawNotes)) {
      return {
        notes: [],
        errors: ["Le format des notes de l'évaluation est invalide."],
      };
    }

    const errors: string[] = [];
    const notes: CanonicalEvaluationNote[] = [];

    rawNotes.forEach((rawNote, index) => {
      if (!rawNote || typeof rawNote !== 'object' || Array.isArray(rawNote)) {
        errors.push(`La note à l'index ${index} est invalide.`);
        return;
      }

      const record = rawNote as Record<string, unknown>;
      const rawId = record.critere_id ?? record.id_critere ?? record.id;
      const critereId =
        rawId === undefined || rawId === null ? '' : String(rawId).trim();
      if (!critereId) {
        errors.push(`La note à l'index ${index} ne référence aucun critère.`);
        return;
      }

      if (
        record.commentaire !== undefined &&
        record.commentaire !== null &&
        typeof record.commentaire !== 'string'
      ) {
        errors.push(`Le commentaire du critère « ${critereId} » est invalide.`);
        return;
      }

      const note =
        typeof record.note === 'number'
          ? record.note
          : typeof record.note === 'string' && record.note.trim().length > 0
            ? Number(record.note)
            : Number.NaN;
      notes.push({
        critere_id: critereId,
        note,
        ...(record.commentaire !== undefined
          ? { commentaire: record.commentaire as string | null }
          : {}),
      });
    });

    return { notes, errors };
  }

  calculerProgression(notes: any[], totalCriteres: number): number {
    if (totalCriteres === 0) {
      return 0;
    }
    const raw = Math.floor((notes.length / totalCriteres) * 100);
    return Math.min(100, Math.max(0, raw));
  }

  calculerNoteGlobale(
    notes: CanonicalEvaluationNote[],
    criteres: SubmissionCriterion[],
  ): number | null {
    if (notes.length === 0 || criteres.length === 0) {
      return null;
    }

    const criterionById = new Map(
      criteres
        .map((critere) => {
          const rawId = critere.id ?? critere.critere_id;
          return rawId === undefined || rawId === null
            ? null
            : ([String(rawId).trim(), critere] as const);
        })
        .filter(
          (entry): entry is readonly [string, SubmissionCriterion] =>
            entry !== null,
        ),
    );

    let weightedSum = 0;
    let totalWeight = 0;
    for (const note of notes) {
      const critere = criterionById.get(String(note.critere_id));
      if (!critere) continue;
      const weight = Number(critere.poids);
      if (!Number.isFinite(weight) || weight <= 0) continue;
      weightedSum += note.note * weight;
      totalWeight += weight;
    }
    if (totalWeight === 0) {
      return null;
    }
    return Math.round((weightedSum / totalWeight) * 100) / 100;
  }
}
