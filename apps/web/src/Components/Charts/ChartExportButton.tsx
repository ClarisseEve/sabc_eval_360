import React, { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import { Download, ChevronDown } from 'lucide-react';
import { useToast } from '@/Contexts/ToastContext';

interface Props {
  chartRef: React.RefObject<HTMLDivElement | null>;
  filename?: string;
}

function getExportSvg(chartContainer: HTMLDivElement): SVGSVGElement | null {
  const sourceSvg = chartContainer.querySelector('svg');
  if (!sourceSvg) return null;

  const width = chartContainer.clientWidth || 1200;
  const height = chartContainer.clientHeight || 500;

  const root = sourceSvg.cloneNode(true) as SVGSVGElement;
  root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  root.setAttribute('width', String(width));
  root.setAttribute('height', String(height));
  root.setAttribute('viewBox', `0 0 ${width} ${height}`);

  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = `
    .recharts-cartesian-grid-horizontal line, .recharts-cartesian-grid-vertical line { stroke: rgba(148, 163, 184, 0.6); stroke-dasharray: 3 3; }
    .recharts-text { font-family: Arial, sans-serif; fill: #4b5563; }
    .recharts-legend-item text { font-size: 12px; fill: #334155; }
    .recharts-default-tooltip { font-family: Arial, sans-serif; }
    text { font-family: Arial, sans-serif; }
  `;
  root.insertBefore(style, root.firstChild);

  const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  background.setAttribute('width', String(width));
  background.setAttribute('height', String(height));
  background.setAttribute('fill', '#ffffff');
  root.insertBefore(background, root.firstChild);

  return root;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function svgToCanvas(svg: SVGSVGElement, scale = 2): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const serializer = new XMLSerializer();
    const svgUrl = URL.createObjectURL(
      new Blob([serializer.serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' }),
    );
    const image = new Image();
    image.onload = () => {
      const width = Number(svg.getAttribute('width')) || 1200;
      const height = Number(svg.getAttribute('height')) || 500;
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const context = canvas.getContext('2d');
      if (!context) {
        URL.revokeObjectURL(svgUrl);
        reject(new Error('Impossible de préparer le canevas PNG.'));
        return;
      }
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(svgUrl);
      resolve(canvas);
    };
    image.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      reject(new Error('Impossible de convertir le graphe en PNG.'));
    };
    image.src = svgUrl;
  });
}

export function ChartExportButton({ chartRef, filename = 'sabc-chart' }: Props) {
  const { error } = useToast();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const today = new Date().toISOString().split('T')[0];
  const baseName = `${filename}-${today}`;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const exportPNG = async () => {
    if (!chartRef.current) return;
    try {
      const svg = getExportSvg(chartRef.current);
      if (!svg) throw new Error('Aucun SVG trouvé dans ce graphe.');
      const canvas = await svgToCanvas(svg);
      canvas.toBlob((pngBlob: Blob | null) => {
        if (pngBlob) triggerDownload(pngBlob, `${baseName}.png`);
        setOpen(false);
      }, 'image/png');
    } catch (exportError) {
      error(exportError instanceof Error ? exportError.message : 'Export PNG impossible.');
      setOpen(false);
    } finally {
      if (!open) setOpen(false);
    }
  };

  const exportSVG = () => {
    if (!chartRef.current) return;
    const svgEl = getExportSvg(chartRef.current);
    if (!svgEl) {
      error('Aucun SVG trouvé dans ce graphe.');
      setOpen(false);
      return;
    }
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    triggerDownload(new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' }), `${baseName}.svg`);
    setOpen(false);
  };

  const exportPDF = async () => {
    if (!chartRef.current) return;
    try {
      const svg = getExportSvg(chartRef.current);
      if (!svg) throw new Error('Aucun SVG trouvé dans ce graphe.');
      const canvas = await svgToCanvas(svg);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW - 20;
      const imgH = (canvas.height / canvas.width) * imgW;
      const y = imgH < pageH - 20 ? (pageH - imgH) / 2 : 10;
      pdf.addImage(imgData, 'PNG', 10, y, imgW, Math.min(imgH, pageH - 20));
      pdf.save(`${baseName}.pdf`);
      setOpen(false);
    } catch (exportError) {
      error(exportError instanceof Error ? exportError.message : 'Export PDF impossible.');
      setOpen(false);
    } finally {
      if (!open) setOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs px-2 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600 transition-colors"
        title="Exporter ce graphe"
      >
        <Download size={12} />
        <span>Exporter</span>
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 min-w-[100px]">
          <button onClick={() => { void exportPNG(); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">PNG</button>
          <button onClick={exportSVG} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">SVG</button>
          <button onClick={() => { void exportPDF(); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">PDF</button>
        </div>
      )}
    </div>
  );
}
