import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Minus, Network, Plus, RotateCcw, Maximize2, ZoomIn, ZoomOut, Move, X } from 'lucide-react';
import { cn } from '@/utils/helpers';
import './HierarchyTree.css';

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
  manager?: string | null;
  manager_role?: string | null;
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
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dragOrigin = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const previousNodesRef = useRef<HierarchyNode[] | null>(null);

  const MIN_SCALE = 0.3;
  const MAX_SCALE = 2.5;
  const ZOOM_STEP = 0.1;

  const getNodeAccent = (niveau: number, currentVariant: HierarchyVariant): string => {
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

    return colorMaps[currentVariant]?.[niveau] || 'bg-sabc-red-primary';
  };

  const getRoleInitials = (role?: string | null): string => {
    if (!role) {
      return 'NA';
    }

    const normalized = role.trim().toLowerCase();
    const roleMap: Record<string, string> = {
      'directeur régional': 'DR',
      'directeur regional': 'DR',
      'chef département trade': 'CDTT',
      'chef departement trade': 'CDTT',
      'chef service commercial': 'CSC',
      'chef district vente': 'CDV',
      'chef de secteur': 'CDS',
      'regional trade marketing': 'RTM',
      'trade marketing operator': 'TMO',
      'superviseur régional marketing opérationnel': 'SRMO',
      'superviseur regional marketing operationnel': 'SRMO',
      'superviseur sponsoring': 'SS',
      'assistant superviseur sponsoring': 'AS',
    };

    if (roleMap[normalized]) {
      return roleMap[normalized];
    }

    const initials = normalized
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join('')
      .toUpperCase();

    return initials || role.toUpperCase().slice(0, 3);
  };

  const renderNode = (node: HierarchyNode, depth = 0, path = 'root'): React.ReactElement => {
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const accentClass = getNodeAccent(node.niveau, variant);
    const nodeKey = `${path}-${node.id}-${depth}`;
    const isRoot = depth === 0;

    const managerLabel = node.manager ? node.manager : 'Poste vacant';
    const managerRole = node.manager_role ? node.manager_role : undefined;
    const roleInitials = getRoleInitials(managerRole);

    const nodeClasses = cn('org-node', {
      'org-node-root': isRoot,
      'org-node-region': isRoot,
    });
    const displayName = !isRoot ? node.nom : null;
    const description = !isRoot ? node.description : undefined;

    const nodeCard = (
      <div className="org-card">
        <div className={cn('org-avatar', accentClass)}>
          <span className="org-avatar-initials">{roleInitials}</span>
        </div>
        <div className="org-info">
          {displayName && <span className="org-name">{displayName}</span>}
          <div className="org-responsable">
            <span className={cn('org-person', !node.manager && 'org-person-empty')}>
              {managerLabel}
            </span>
          </div>
          {description && <span className="org-description">{description}</span>}
        </div>
      </div>
    );

    const childrenList = hasChildren ? (
      <ul className="org-level">
        {node.children!.map((child, index) =>
          renderNode(child, depth + 1, `${nodeKey}-${index}`)
        )}
      </ul>
    ) : null;

    const statusLabel = node.metadata?.statut
      ? node.metadata.statut.charAt(0).toUpperCase() + node.metadata.statut.slice(1)
      : null;

    const regionHeader = isRoot ? (
      <header className="org-region-header">
        <span className="org-region-title">{node.nom}</span>
        {statusLabel && (
          <span
            className={cn('org-region-badge', {
              'taniere': statusLabel.toLowerCase().includes('tani'),
              'non-taniere': !statusLabel.toLowerCase().includes('tani'),
            })}
          >
            {statusLabel}
          </span>
        )}
      </header>
    ) : null;

    const content = (
      <>
        {regionHeader}
        {nodeCard}
        {childrenList}
      </>
    );

    return (
      <li
        key={nodeKey}
        className={nodeClasses}
      >
        {isRoot ? <div className="org-region-frame">{content}</div> : content}
      </li>
    );
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    setHasInteracted(true);
    setDragging(true);
    dragOrigin.current = {
      x: event.clientX - pan.x,
      y: event.clientY - pan.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setHasInteracted(true);
    setPan({
      x: event.clientX - dragOrigin.current.x,
      y: event.clientY - dragOrigin.current.y,
    });
  };

  const stopDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch (error) {
      // ignore
    }
  };

  const clampScale = useCallback(
    (value: number) => Math.min(Math.max(value, MIN_SCALE), MAX_SCALE),
    [MIN_SCALE, MAX_SCALE]
  );

  const adjustScale = useCallback(
    (direction: number, anchor?: { x: number; y: number }) => {
      setHasInteracted(true);
      const scaleDelta = direction * ZOOM_STEP;
      setScale((previousScale) => {
        const nextScale = clampScale(previousScale + scaleDelta);
        const scaleChanged = nextScale !== previousScale;

        if (scaleChanged && containerRef.current) {
          const fallbackAnchor = anchor
            ? undefined
            : {
                x: containerRef.current.clientWidth / 2,
                y: containerRef.current.clientHeight / 2,
              };
          const effectiveAnchor = anchor ?? fallbackAnchor;

          if (effectiveAnchor) {
            const { x, y } = effectiveAnchor;
            setPan((previousPan) => {
              const contentX = (x - previousPan.x) / previousScale;
              const contentY = (y - previousPan.y) / previousScale;
              return {
                x: x - contentX * nextScale,
                y: y - contentY * nextScale,
              };
            });
          }
        }

        return nextScale;
      });
    },
    [clampScale, ZOOM_STEP]
  );

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (!containerRef.current) {
        return;
      }

      if (!event.cancelable) {
        return;
      }

      const isZoomGesture = event.ctrlKey || event.metaKey;
      if (isZoomGesture) {
        event.preventDefault();
        const rect = containerRef.current.getBoundingClientRect();
        const anchor = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };
        const direction = event.deltaY < 0 ? 1 : -1;
        const intensity = Math.min(Math.abs(event.deltaY) / 120, 4);
        adjustScale(direction * (1 + intensity), anchor);
        return;
      }

      event.preventDefault();
      setHasInteracted(true);
      setPan((previousPan) => ({
        x: previousPan.x - event.deltaX,
        y: previousPan.y - event.deltaY,
      }));
    },
    [adjustScale]
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    element.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      element.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  const handleZoomIn = () => adjustScale(1);
  const handleZoomOut = () => adjustScale(-1);
  const handleResetView = () => {
    setPan({ x: 0, y: 0 });
    setScale(1);
    setHasInteracted(false);
  };

  const wrapperClass = cn('org-tree-wrapper', { 
    dragging: isDragging,
    fullscreen: isFullscreen
  });
  const zoomPercentage = Math.round(scale * 100);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setHasInteracted(false); // Reset pour recentrer
  };

  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isFullscreen]);

  const fitContentToContainer = useCallback(() => {
    const container = containerRef.current;
    const content = contentRef.current;

    if (!container || !content) {
      return;
    }

    const contentWidth = content.offsetWidth;
    const contentHeight = content.offsetHeight;

    if (contentWidth === 0 || contentHeight === 0) {
      return;
    }

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const padding = 48;
    const availableWidth = Math.max(containerWidth - padding, 0);
    const availableHeight = Math.max(containerHeight - padding, 0);

    const scaleX = availableWidth / contentWidth;
    const scaleY = availableHeight / contentHeight;
    const baseScale = Math.min(scaleX, scaleY, 1);
    const adjustedBase = baseScale * 0.9;
    const targetScale = clampScale(adjustedBase);

    setScale((previousScale) =>
      Math.abs(previousScale - targetScale) > 0.001 ? targetScale : previousScale
    );

    const nextPan = {
      x: (containerWidth - contentWidth * targetScale) / 2,
      y: (containerHeight - contentHeight * targetScale) / 2,
    };

    setPan((previousPan) => {
      const deltaX = Math.abs(previousPan.x - nextPan.x);
      const deltaY = Math.abs(previousPan.y - nextPan.y);

      if (deltaX > 0.5 || deltaY > 0.5) {
        return nextPan;
      }

      return previousPan;
    });
  }, [clampScale]);

  useLayoutEffect(() => {
    if (previousNodesRef.current !== nodes) {
      previousNodesRef.current = nodes;
      setHasInteracted(false);
    }
  }, [nodes]);

  useLayoutEffect(() => {
    if (hasInteracted) {
      return;
    }

    fitContentToContainer();
  }, [fitContentToContainer, hasInteracted, nodes]);

  useLayoutEffect(() => {
    if (typeof ResizeObserver === 'undefined') {
      if (!hasInteracted) {
        fitContentToContainer();
      }
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const observer = new ResizeObserver(() => {
      if (!hasInteracted) {
        fitContentToContainer();
      }
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [fitContentToContainer, hasInteracted]);

  const renderCanvas = () => (
    <div
      ref={containerRef}
      className={wrapperClass}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerLeave={stopDragging}
      onPointerCancel={stopDragging}
    >
      {/* Titre flottant sticky */}
      <div className="org-title">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-sabc-red-primary" />
          <div>
            <h3 className="text-base font-bold text-sabc-gray-900 dark:text-white">{title}</h3>
            {subtitle && (
              <p className="text-xs text-sabc-gray-600 dark:text-sabc-gray-400">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contrôles avec pointer-events */}
      <div className="org-controls" onPointerDown={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="org-control-btn group relative"
          onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Zoom arrière"
          title="Zoom arrière"
        >
          <ZoomOut className="h-4 w-4" />
          <span className="org-tooltip">Zoom arrière</span>
        </button>
        <span className="org-control-scale">{zoomPercentage}%</span>
        <button
          type="button"
          className="org-control-btn group relative"
          onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Zoom avant"
          title="Zoom avant"
        >
          <ZoomIn className="h-4 w-4" />
          <span className="org-tooltip">Zoom avant</span>
        </button>
        <button
          type="button"
          className="org-control-btn reset group relative"
          onClick={(e) => { e.stopPropagation(); handleResetView(); }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Réinitialiser"
          title="Réinitialiser la vue"
        >
          <RotateCcw className="h-4 w-4" />
          <span className="org-tooltip">Réinitialiser</span>
        </button>
        <button
          type="button"
          className={cn("org-control-btn group relative", isFullscreen && "bg-sabc-red-primary/10")}
          onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={isFullscreen ? "Fermer plein écran" : "Plein écran"}
          title={isFullscreen ? "Fermer plein écran" : "Afficher en plein écran"}
        >
          {isFullscreen ? (
            <>
              <X className="h-4 w-4 text-sabc-red-primary" />
              <span className="org-tooltip">Fermer</span>
            </>
          ) : (
            <>
              <Maximize2 className="h-4 w-4" />
              <span className="org-tooltip">Plein écran</span>
            </>
          )}
        </button>
      </div>
      <div className="org-instructions">
        <Move className="h-4 w-4" />
        <span>Glissez pour déplacer • Ctrl/Cmd + Molette pour zoomer</span>
      </div>
      <div
        className="org-tree"
        style={{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0)` }}
      >
        <div
          className="org-tree-content"
          ref={contentRef}
          style={{ transform: `scale(${scale})` }}
        >
          <ul className="org-level org-root">
            {nodes.map((node, index) => renderNode(node, 0, `root-${index}`))}
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Card className={cn('overflow-hidden max-w-full', className)}>
        <CardContent className="p-0">
          {renderCanvas()}
        </CardContent>
      </Card>

      {/* Modal Plein écran */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md">
          <div className="h-full w-full p-4">
            <div className="h-full w-full bg-white dark:bg-sabc-gray-900 rounded-lg overflow-hidden">
              {renderCanvas()}
            </div>
          </div>
        </div>
      )}
    </>
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
      description: 'Structure pilote',
      manager: 'Poste vacant',
      manager_role: 'Directeur Régional',
      badge_variant: 'destructive' as const,
      children: [
        {
          id: 'cdtt',
          nom: 'CDTT - Chef Département Trade',
          niveau: 2,
          type: 'role' as const,
          description: 'Département',
          manager: 'Poste vacant',
          manager_role: 'Chef Département Trade',
          badge_variant: 'default' as const,
          children: [
            {
              id: 'csc',
              nom: 'CSC - Chef Service Commercial',
              niveau: 3,
              type: 'role' as const,
              description: 'Service',
              manager: 'Poste vacant',
              manager_role: 'Chef Service Commercial',
              badge_variant: 'outline' as const,
              children: [
                {
                  id: 'cdv',
                  nom: 'CDV - Chef District Vente',
                  niveau: 4,
                  type: 'role' as const,
                  description: 'District',
                  manager: 'Poste vacant',
                  manager_role: 'Chef District Vente',
                  badge_variant: 'secondary' as const,
                  children: [
                    {
                      id: 'cds',
                      nom: 'CDS - Chef de Secteur',
                      niveau: 5,
                      type: 'role' as const,
                      description: 'Secteur',
                      manager: 'Poste vacant',
                      manager_role: 'Chef de Secteur',
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
              description: 'Marketing régional',
              manager: 'Poste vacant',
              manager_role: 'Regional Trade Marketing',
              badge_variant: 'outline' as const,
              children: [
                {
                  id: 'tmo',
                  nom: 'TMO - Trade Marketing Operator',
                  niveau: 4,
                  type: 'role' as const,
                  description: 'Opérations terrain',
                  manager: 'Poste vacant',
                  manager_role: 'Trade Marketing Operator',
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
