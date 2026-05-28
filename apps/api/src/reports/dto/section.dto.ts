import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export type SectionType =
  | 'executive_summary'
  | 'kpis'
  | 'tendances'
  | 'recommandations'
  | 'texte_libre';

export interface RapportSection {
  id: string;
  type: SectionType;
  titre: string;
  contenu: {
    texte?: string;
    graphes?: Array<{
      id: string;
      type: string;
      titre: string;
      donnees_source: string;
      config?: Record<string, unknown>;
    }>;
  };
  ordre: number;
}

export interface RapportRow {
  id_rapport: string;
  titre: string;
  createur_matricule: string;
  sections_json: RapportSection[];
  statut: string;
  created_at: Date;
  updated_at: Date;
}

export class AddSectionDto {
  @IsIn(['executive_summary', 'kpis', 'tendances', 'recommandations', 'texte_libre'])
  type: SectionType;

  @IsString()
  @Length(1, 100)
  titre: string;

  @IsOptional()
  contenu?: { texte?: string; graphes?: any[] };
}

export class ReorderDto {
  orderedIds: string[];
}
