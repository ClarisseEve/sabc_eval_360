import React from 'react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { useAuthContext } from '@/Contexts/AuthContext';
import { normalizePublishedRule, getRuleSummary } from '@/utils/rules';
import type { PublishedRule } from '@/types/rules';

export function useEvaluationLayoutUser(fallbackRole = 'Utilisateur') {
  const { user } = useAuthContext();

  return {
    authUser: user,
    layoutUser: {
      name: user ? [user.prenom, user.nom].filter(Boolean).join(' ') || 'Utilisateur' : 'Utilisateur',
      email: user?.email || '',
      role: user?.role_nom || user?.role || fallbackRole,
      avatar: user?.avatar,
    },
  };
}

export function EvaluationPageLayout({
  children,
  pageTitle,
}: {
  children: React.ReactNode;
  pageTitle?: string;
}) {
  const { layoutUser } = useEvaluationLayoutUser();

  return (
    <AppLayout user={layoutUser} pageTitle={pageTitle} notifications={[]}>
      {children}
    </AppLayout>
  );
}

export const formatDisplayName = (userLike: Record<string, any>) => {
  if (userLike?.prenom || userLike?.nom) {
    return `${userLike?.prenom ?? ''} ${userLike?.nom ?? ''}`.trim();
  }
  if (userLike?.name) return userLike.name;
  return userLike?.matricule ?? 'Utilisateur';
};

export const formatRole = (userLike: Record<string, any>) =>
  userLike?.role_nom || userLike?.role || 'Rôle non renseigné';

type RawEvaluationNote = {
  id?: string | number | null;
  note?: number | null;
  commentaire?: string | null;
  critere_nom?: string;
};

export type EvaluationCriterionView = {
  id: string | number;
  libelle: string;
  description: string | null;
  section: string;
  poids: number | null;
  commentaireRequisSiNoteLt: number | null;
  note: number | null;
  commentaire: string;
};

export function parseEvaluationNotes(raw: unknown): RawEvaluationNote[] {
  if (Array.isArray(raw)) return raw as RawEvaluationNote[];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed as RawEvaluationNote[] : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function buildEvaluationCriteria(evaluation: Record<string, any>): EvaluationCriterionView[] {
  const normalizedRule = normalizePublishedRule(evaluation?.regle ?? {});
  const rawNotes = parseEvaluationNotes(evaluation?.notations_json);

  if (!normalizedRule.criteres || normalizedRule.criteres.length === 0) {
    return rawNotes.map((note, index) => ({
      id: note.id ?? index,
      libelle: note.critere_nom ?? `Critère ${index + 1}`,
      description: null,
      section: 'Compétences',
      poids: null,
      commentaireRequisSiNoteLt: 3,
      note: note.note ?? null,
      commentaire: note.commentaire ?? '',
    }));
  }

  return normalizedRule.criteres.map((critere, index) => {
    const matched = rawNotes.find((note, noteIndex) => {
      if (!note) return false;
      if (note.id != null && critere.id != null) {
        return String(note.id) === String(critere.id);
      }
      return index === noteIndex;
    });

    return {
      id: critere.id ?? index,
      libelle: critere.libelle ?? `Critère ${index + 1}`,
      description: critere.description ?? null,
      section: critere.section_label ?? 'Compétences',
      poids: critere.poids ?? null,
      commentaireRequisSiNoteLt: critere.commentaire_requis_si_note_lt ?? 3,
      note: matched?.note ?? null,
      commentaire: matched?.commentaire ?? '',
    };
  });
}

export function buildEvaluationContext(evaluation: Record<string, any>) {
  const rule = normalizePublishedRule(evaluation?.regle ?? {});
  const summary = getRuleSummary(evaluation?.regle ?? {});
  const criteria = buildEvaluationCriteria(evaluation);
  const periodLabel = evaluation?.periode?.nom_periode ?? evaluation?.periode?.code_periode ?? 'Période active';
  const periodRange = evaluation?.periode?.date_debut && evaluation?.periode?.date_fin
    ? {
        start: evaluation.periode.date_debut,
        end: evaluation.periode.date_fin,
      }
    : null;

  return {
    rule,
    summary,
    criteria,
    periodLabel,
    periodRange,
    visibilityDetail: rule.visibility_policy?.detail ?? 'aggregated',
    sections: summary.sections ?? [],
    criteriaCount: summary.criteresCount ?? criteria.length,
    axesCount: Array.isArray(summary.axes) ? summary.axes.length : 0,
  };
}

export function isCriterionCommentRequired(
  criterion: Pick<EvaluationCriterionView, 'note' | 'commentaire' | 'commentaireRequisSiNoteLt'>,
) {
  const threshold = criterion.commentaireRequisSiNoteLt ?? 3;
  const note = criterion.note ?? 0;
  return note < threshold && (!criterion.commentaire || criterion.commentaire.trim().length === 0);
}

export function getPublishedRuleForEvaluation(evaluation: Record<string, any>): PublishedRule {
  return normalizePublishedRule(evaluation?.regle ?? {});
}
