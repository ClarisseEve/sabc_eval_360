import React from 'react';
import { Badge } from '@/Components/UI/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Network } from 'lucide-react';

export interface HierarchyNode {
  id: string;
  nom: string;
  niveau: number;
  type: 'role' | 'user' | 'structure';
  description?: string;
  badge_variant?: 'default' | 'destructive' | 'secondary' | 'outline';
  children?: HierarchyNode[];
  metadata?: {
    utilisateurs_count?: number;
    region?: string;
    branche?: string;
    statut?: string;
  };
}

export interface HierarchyTreeProps {
  title: string;
  subtitle?: string;
  nodes: HierarchyNode[];
  showMetadata?: boolean;
  variant?: 'taniere' | 'non-taniere' | 'roles' | 'users';
  className?: string;
}

type HierarchyVariant = 'taniere' | 'non-taniere' | 'roles' | 'users';

const HierarchyTree: React.FC<HierarchyTreeProps> = ({
  title,
  subtitle,
  nodes,
  showMetadata = false,
  variant = 'roles',
  className = ''
}) => {
  const getNodeColor = (niveau: number, variant: HierarchyVariant): string => {
    const colorMaps: Record<HierarchyVariant, Partial<Record<number, string>>> = {
      taniere: {
        1: 'bg-sabc-red-primary',
        2: 'bg-sabc-accent',
        3: 'bg-sabc-success',
        4: 'bg-sabc-info',
        5: 'bg-sabc-gray-600'
      },
      'non-taniere': {
        1: 'bg-sabc-red-primary',
        2: 'bg-sabc-success',
        3: 'bg-sabc-gray-600'
      },
      roles: {
        1: 'bg-sabc-red-primary',
        2: 'bg-sabc-accent',
        3: 'bg-sabc-success',
        4: 'bg-sabc-info',
        5: 'bg-sabc-gray-600'
      },
      users: {
        1: 'bg-sabc-red-primary',
        2: 'bg-sabc-accent',
        3: 'bg-sabc-success',
        4: 'bg-sabc-info',
        5: 'bg-sabc-gray-600'
      }
    };

    return colorMaps[variant]?.[niveau] || 'bg-sabc-gray-400';
  };

  const getIndentation = (niveau: number): string => {
    return `ml-${Math.max(0, (niveau - 1) * 5)}`;
  };

  const renderNode = (node: HierarchyNode, depth: number = 0): React.ReactElement => {
    const indentationClass = depth > 0 ? `ml-${Math.min(depth * 6, 24)}` : '';
    const colorClass = getNodeColor(node.niveau, variant);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="relative">
        {/* Ligne de connexion verticale */}
        {depth > 0 && (
          <div className="absolute left-[-12px] top-0 bottom-0 w-px bg-sabc-gray-200"></div>
        )}
        
        {/* Ligne de connexion horizontale */}
        {depth > 0 && (
          <div className="absolute left-[-12px] top-6 w-3 h-px bg-sabc-gray-200"></div>
        )}

        <div className={`relative ${indentationClass} mb-4`}>
          {/* Card moderne pour chaque nœud */}
          <div className="group relative bg-white rounded-xl border border-sabc-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-4">
            {/* Indicateur de niveau avec gradient */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${colorClass} rounded-l-xl`}></div>
            
            {/* Contenu principal */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Icône de niveau avec animation */}
                <div className={`w-8 h-8 ${colorClass} rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                  {node.niveau}
                </div>
                
                {/* Informations du rôle */}
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={node.badge_variant || 'default'} className="font-medium">
                      {node.nom}
                    </Badge>
                    {hasChildren && (
                      <div className="flex items-center text-sabc-gray-400">
                        <span className="text-xs">({node.children!.length} sous-rôles)</span>
                      </div>
                    )}
                  </div>
                  {node.description && (
                    <p className="text-sm text-sabc-gray-600 mt-1">{node.description}</p>
                  )}
                </div>
              </div>

              {/* Métadonnées avec design amélioré */}
              {showMetadata && node.metadata && (
                <div className="flex items-center gap-2">
                  {node.metadata.utilisateurs_count !== undefined && (
                    <div className="bg-sabc-gray-50 px-3 py-1 rounded-full">
                      <span className="text-xs font-medium text-sabc-gray-700">
                        {node.metadata.utilisateurs_count} utilisateurs
                      </span>
                    </div>
                  )}
                  {node.metadata.statut && (
                    <Badge 
                      variant={node.metadata.statut === 'actif' ? 'default' : 'secondary'} 
                      className="text-xs"
                    >
                      {node.metadata.statut}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Rendu récursif des enfants avec espacement amélioré */}
        {hasChildren && (
          <div className="ml-6 space-y-0">
            {node.children!.map((child, index) => (
              <div key={`${node.id}-child-${child.id}-${index}`}>
                {renderNode(child, depth + 1)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const getBackgroundClass = (): string => {
    switch (variant) {
      case 'taniere':
        return 'bg-sabc-gray-50';
      case 'non-taniere':
        return 'bg-sabc-accent-light';
      case 'roles':
        return 'bg-sabc-gray-50';
      case 'users':
        return 'bg-sabc-red-light';
      default:
        return 'bg-sabc-gray-50';
    }
  };

  return (
    <Card className={`${className} overflow-hidden`}>
      <CardHeader className="bg-gradient-to-r from-sabc-red-primary to-sabc-accent text-white">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Network className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">{title}</h3>
            {subtitle && (
              <p className="text-sm text-white/90 mt-1">{subtitle}</p>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className={`${getBackgroundClass()} p-6 min-h-[400px]`}>
          <div className="space-y-0">
            {nodes.map((node, index) => (
              <div key={`root-${node.id}-${index}`}>
                {renderNode(node)}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Données prédéfinies pour les hiérarchies SABC
export const SABC_HIERARCHY_DATA = {
  roles_taniere: [
    {
      id: 'dr',
      nom: 'DR - Directeur Régional',
      niveau: 1,
      type: 'role' as const,
      description: 'Niveau 1',
      badge_variant: 'destructive' as const,
      children: [
        {
          id: 'cdtt',
          nom: 'CDTT - Chef Département Trade',
          niveau: 2,
          type: 'role' as const,
          description: 'Niveau 2',
          badge_variant: 'default' as const,
          children: [
            {
              id: 'csc',
              nom: 'CSC - Chef Service Commercial',
              niveau: 3,
              type: 'role' as const,
              description: 'Niveau 3',
              badge_variant: 'outline' as const,
              children: [
                {
                  id: 'cdv',
                  nom: 'CDV - Chef District Vente',
                  niveau: 4,
                  type: 'role' as const,
                  description: 'Niveau 4',
                  badge_variant: 'secondary' as const,
                  children: [
                    {
                      id: 'cds',
                      nom: 'CDS - Chef de Secteur',
                      niveau: 5,
                      type: 'role' as const,
                      description: 'Niveau 5',
                      badge_variant: 'outline' as const
                    }
                  ]
                }
              ]
            },
            {
              id: 'rtm',
              nom: 'RTM - Regional Trade Marketing',
              niveau: 3,
              type: 'role' as const,
              description: 'Niveau 3',
              badge_variant: 'outline' as const,
              children: [
                {
                  id: 'tmo',
                  nom: 'TMO - Trade Marketing Operator',
                  niveau: 4,
                  type: 'role' as const,
                  description: 'Niveau 4',
                  badge_variant: 'secondary' as const
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  roles_non_taniere: [
    {
      id: 'dr-nt',
      nom: 'DR - Directeur Régional',
      niveau: 1,
      type: 'role' as const,
      description: 'Niveau 1',
      badge_variant: 'destructive' as const,
      children: [
        {
          id: 'csc-nt',
          nom: 'CSC - Chef Service Commercial',
          niveau: 2,
          type: 'role' as const,
          description: 'Niveau 2',
          badge_variant: 'outline' as const,
          children: [
            {
              id: 'cds-nt',
              nom: 'CDS - Chef de Secteur',
              niveau: 3,
              type: 'role' as const,
              description: 'Niveau 3',
              badge_variant: 'outline' as const
            }
          ]
        },
        {
          id: 'srmo',
          nom: 'SRMO - Superviseur Régional Marketing',
          niveau: 2,
          type: 'role' as const,
          description: 'Niveau 2',
          badge_variant: 'outline' as const,
          children: [
            {
              id: 'tmo-nt',
              nom: 'TMO - Trade Marketing Operator',
              niveau: 3,
              type: 'role' as const,
              description: 'Niveau 3',
              badge_variant: 'outline' as const
            }
          ]
        }
      ]
    }
  ]
};

export default HierarchyTree;
