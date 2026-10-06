import React from 'react';
import { ChevronDown, Download, FileImage, FileSpreadsheet, FileText, LoaderCircle } from 'lucide-react';
import { useToast } from '@/Contexts/ToastContext';
import { Button } from '@/Components/UI/Button/Button';
import { Card, CardContent } from '@/Components/UI/Card/Card';
import { cn } from '@/utils/helpers';

type DashboardExportMenuProps = {
  targetRef: React.RefObject<HTMLElement | null>;
  filename: string;
  captureSelector?: string;
  onRawExport?: (format: 'excel' | 'csv') => void;
  isRawExporting?: boolean;
  className?: string;
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function oklabChannelsToRgb(lightness: number, a: number, b: number, alphaChannel?: string): string {
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linearRgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const rgb = linearRgb.map((channel) => {
    const bounded = Math.min(1, Math.max(0, channel));
    const encoded = bounded <= 0.0031308
      ? 12.92 * bounded
      : 1.055 * bounded ** (1 / 2.4) - 0.055;
    return Math.round(encoded * 255);
  });
  const alpha = alphaChannel?.trim();
  if (!alpha) return `rgb(${rgb.join(', ')})`;
  const alphaValue = Number.parseFloat(alpha) / (alpha.endsWith('%') ? 100 : 1);
  return `rgba(${rgb.join(', ')}, ${Math.min(1, Math.max(0, alphaValue))})`;
}

function parseColorChannel(value: string): number {
  return value.trim().toLowerCase() === 'none' ? 0 : Number.parseFloat(value);
}

function oklabToRgb(match: string): string {
  const [channels, alphaChannel] = match.slice(match.indexOf('(') + 1, -1).split('/');
  const [lightnessValue, aValue, bValue] = channels.trim().split(/\s+/);
  if (!lightnessValue || !aValue || !bValue) return match;
  const lightness = parseColorChannel(lightnessValue) / (lightnessValue.endsWith('%') ? 100 : 1);
  const a = parseColorChannel(aValue);
  const b = parseColorChannel(bValue);
  if (![lightness, a, b].every(Number.isFinite)) return match;
  return oklabChannelsToRgb(lightness, a, b, alphaChannel);
}

function oklchToRgb(match: string): string {
  const [channels, alphaChannel] = match.slice(match.indexOf('(') + 1, -1).split('/');
  const [lightnessValue, chromaValue, hueValue] = channels.trim().split(/\s+/);
  if (!lightnessValue || !chromaValue || !hueValue) return match;

  const lightness = parseColorChannel(lightnessValue) / (lightnessValue.endsWith('%') ? 100 : 1);
  const chroma = parseColorChannel(chromaValue) * (chromaValue.endsWith('%') ? 0.004 : 1);
  const hueNumber = parseColorChannel(hueValue);
  const hue = hueValue.endsWith('turn')
    ? hueNumber * 360
    : hueValue.endsWith('rad')
      ? hueNumber * (180 / Math.PI)
      : hueValue.endsWith('grad')
        ? hueNumber * 0.9
        : hueNumber;
  if (![lightness, chroma, hue].every(Number.isFinite)) return match;

  const angle = (hue * Math.PI) / 180;
  return oklabChannelsToRgb(
    lightness,
    chroma * Math.cos(angle),
    chroma * Math.sin(angle),
    alphaChannel,
  );
}

const COLOR_STYLE_PROPERTIES = [
  'color',
  'background-color',
  'background-image',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-block-start-color',
  'border-block-end-color',
  'border-inline-start-color',
  'border-inline-end-color',
  'outline-color',
  'text-decoration-color',
  'text-emphasis-color',
  '-webkit-text-fill-color',
  '-webkit-text-stroke-color',
  'caret-color',
  'column-rule-color',
  'row-rule-color',
  'fill',
  'stroke',
  'flood-color',
  'lighting-color',
  'stop-color',
  'accent-color',
  'box-shadow',
  'text-shadow',
];
const COLOR_STYLE_PROPERTY_SET = new Set(COLOR_STYLE_PROPERTIES);

function makeColorsHtml2CanvasCompatible(root: Element, clonedDocument: Document) {
  const cloneWindow = clonedDocument.defaultView;
  if (!cloneWindow) return;

  [root, ...root.querySelectorAll('*')].forEach((element) => {
    const computedStyle = cloneWindow.getComputedStyle(element);
    const incompatibleStyles: Array<[string, string]> = [];
    for (let index = 0; index < computedStyle.length; index += 1) {
      const property = computedStyle[index];
      if (!property.startsWith('--') && !COLOR_STYLE_PROPERTY_SET.has(property)) continue;
      const value = computedStyle.getPropertyValue(property);
      if (/color-mix\(/i.test(value)) {
        incompatibleStyles.push([property, /shadow|image/i.test(property) ? 'none' : 'transparent']);
      } else if (/oklch\(|oklab\(/i.test(value)) {
        incompatibleStyles.push([property, value]);
      }
    }

    incompatibleStyles.forEach(([property, value]) => {
      const compatibleValue = value
        .replace(/oklch\([^)]*\)/gi, oklchToRgb)
        .replace(/oklab\([^)]*\)/gi, oklabToRgb);
      (element as HTMLElement | SVGElement).style.setProperty(property, compatibleValue, 'important');
    });
  });
}

export function DashboardExportMenu({
  targetRef,
  filename,
  captureSelector,
  onRawExport,
  isRawExporting = false,
  className,
}: DashboardExportMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const { error } = useToast();
  const isLoading = exporting || isRawExporting;
  const safeFilename = filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/^-|-$/g, '') || 'tableau-de-bord';

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCaptureTarget = () => {
    const captureRoot = targetRef.current;
    const target = captureSelector ? captureRoot?.querySelector(captureSelector) : captureRoot;
    return target instanceof HTMLElement ? target : null;
  };

  const captureElement = async (target: HTMLElement) => {
    await document.fonts?.ready;
    const { default: html2canvas } = await import('html2canvas');
    const captureId = `dashboard-capture-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    target.setAttribute('data-dashboard-capture-id', captureId);
    try {
      return await html2canvas(target, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: Math.max(target.scrollWidth, document.documentElement.clientWidth),
        onclone: (clonedDocument: Document) => {
          clonedDocument.querySelectorAll('[data-html2canvas-ignore="true"]').forEach((element: Element) => element.remove());
          const clonedTarget = clonedDocument.querySelector(`[data-dashboard-capture-id="${captureId}"]`);
          if (clonedTarget) makeColorsHtml2CanvasCompatible(clonedTarget, clonedDocument);
        },
      });
    } finally {
      target.removeAttribute('data-dashboard-capture-id');
    }
  };

  const captureDashboard = async () => {
    const target = getCaptureTarget();
    if (!target) {
      error("Le tableau de bord n'est pas prêt à être exporté.");
      return null;
    }
    return captureElement(target);
  };

  const exportDashboard = async (format: 'png' | 'jpeg' | 'pdf') => {
    setOpen(false);
    setExporting(true);
    try {
      const date = new Date().toISOString().slice(0, 10);

      if (format === 'pdf') {
        const target = getCaptureTarget();
        if (!target) throw new Error("Le tableau de bord n'est pas prêt à être exporté.");

        const markedSections = Array.from(target.querySelectorAll<HTMLElement>('[data-dashboard-export-section]'));
        const sections = markedSections.length > 0 ? markedSections : [target];
        const { default: JsPDF } = await import('jspdf');
        const pdf = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const availableWidth = pageWidth - margin * 2;
        const availableHeight = pageHeight - margin * 2;

        for (const [index, section] of sections.entries()) {
          const canvas = await captureElement(section);
          if (index > 0) pdf.addPage();
          const fitScale = Math.min(availableWidth / canvas.width, availableHeight / canvas.height);
          const imageWidth = canvas.width * fitScale;
          const imageHeight = canvas.height * fitScale;
          const x = (pageWidth - imageWidth) / 2;
          const y = (pageHeight - imageHeight) / 2;
          pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', x, y, imageWidth, imageHeight);
        }

        pdf.save(`${safeFilename}-${date}.pdf`);
        return;
      }

      const canvas = await captureDashboard();
      if (!canvas) return;
      if (format === 'png' || format === 'jpeg') {
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mimeType, 0.92));
        if (!blob) throw new Error("La création de l'image a échoué.");
        downloadBlob(blob, `${safeFilename}-${date}.${format}`);
        return;
      }

    } catch (exportError) {
      error(exportError instanceof Error ? exportError.message : "L'export du tableau de bord a échoué.");
    } finally {
      setExporting(false);
    }
  };

  const exportOptions = [
    ...(onRawExport
      ? [
          { id: 'excel', label: 'Données brutes en Excel (.xlsx)', icon: <FileSpreadsheet className="h-4 w-4" /> },
          { id: 'csv', label: 'Données brutes en CSV (.csv)', icon: <FileText className="h-4 w-4" /> },
        ]
      : []),
    { id: 'png', label: 'Tableau de bord en image (.png)', icon: <FileImage className="h-4 w-4" /> },
    { id: 'jpeg', label: 'Tableau de bord en image (.jpeg)', icon: <FileImage className="h-4 w-4" /> },
    { id: 'pdf', label: 'Tableau de bord en PDF (.pdf)', icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <div className={cn('relative', className)} ref={menuRef} data-html2canvas-ignore="true">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((value) => !value)}
        disabled={isLoading}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
        Exporter
        <ChevronDown className={cn('ml-2 h-4 w-4 transition-transform', open && 'rotate-180')} />
      </Button>

      {open && (
        <Card className="absolute right-0 top-full z-50 mt-2 w-max min-w-64 shadow-lg">
          <CardContent className="p-2">
            <div className="space-y-1" role="menu">
              {exportOptions.map((option, index) => (
                <React.Fragment key={option.id}>
                  {onRawExport && index === 2 && <div className="my-1 border-t border-sabc-gray-200" />}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      if (option.id === 'excel' || option.id === 'csv') {
                        onRawExport?.(option.id);
                        setOpen(false);
                      } else {
                        void exportDashboard(option.id as 'png' | 'jpeg' | 'pdf');
                      }
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-sabc-gray-700 hover:bg-sabc-gray-100 dark:text-sabc-gray-300 dark:hover:bg-sabc-gray-800"
                  >
                    {option.icon}
                    <span>{option.label}</span>
                  </button>
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
