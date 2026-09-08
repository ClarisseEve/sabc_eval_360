import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, ChevronDown } from 'lucide-react';
import { useToast } from '@/Contexts/ToastContext';

interface Props {
  chartRef: React.RefObject<HTMLDivElement | null>;
  filename?: string;
}

function getExportSvg(chartContainer: HTMLDivElement): SVGSVGElement | null {
  const svg = chartContainer.querySelector('svg');
  if (!svg) return null;

  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(chartContainer.clientWidth || 800));
  clone.setAttribute('height', String(chartContainer.clientHeight || 300));

  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = `
    .recharts-cartesian-grid-horizontal line, .recharts-cartesian-grid-vertical line { stroke: rgba(148, 163, 184, 0.6); stroke-dasharray: 3 3; }
    .recharts-text { font-family: Arial, sans-serif; fill: #4b5563; }
    .recharts-legend-item text { font-size: 12px; fill: #334155; }
    .recharts-default-tooltip { font-family: Arial, sans-serif; }
  `;
  clone.insertBefore(style, clone.firstChild);

  return clone;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
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
      if (svg) {
        const serializer = new XMLSerializer();
        const source = serializer.serializeToString(svg);
        const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = chartRef.current!.clientWidth * 2 || 1200;
          canvas.height = chartRef.current!.clientHeight * 2 || 800;
          const ctx = canvas.getContext('2d');
          ctx?.fillStyle = '#ffffff';
          ctx?.fillRect(0, 0, canvas.width, canvas.height);
          ctx?.drawImage(image, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((pngBlob) => {
            if (pngBlob) triggerDownload(pngBlob, `${baseName}.png`);
            setOpen(false);
          }, 'image/png');
          URL.revokeObjectURL(url);
        };
        image.src = url;
        return;
      }

      const canvas = await html2canvas(chartRef.current, { backgroundColor: '#ffffff', scale: 2 });
      canvas.toBlob((pngBlob) => {
        if (pngBlob) triggerDownload(pngBlob, `${baseName}.png`);
        setOpen(false);
      }, 'image/png');
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
      if (!svg) {
        const canvas = await html2canvas(chartRef.current, { backgroundColor: '#ffffff', scale: 2 });
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
        return;
      }

      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svg);
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const width = chartRef.current?.clientWidth || 1200;
        const height = chartRef.current?.clientHeight || 600;
        canvas.width = width * 2;
        canvas.height = height * 2;
        const ctx = canvas.getContext('2d');
        ctx?.fillStyle = '#ffffff';
        ctx?.fillRect(0, 0, canvas.width, canvas.height);
        ctx?.drawImage(image, 0, 0, canvas.width, canvas.height);
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
        URL.revokeObjectURL(url);
      };
      image.src = url;
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
