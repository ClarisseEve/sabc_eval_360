import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, ChevronDown } from 'lucide-react';

interface Props {
  chartRef: React.RefObject<HTMLDivElement | null>;
  filename?: string; // sans extension, ex: "sabc-tendances"
}

export function ChartExportButton({ chartRef, filename = 'sabc-chart' }: Props) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const today = new Date().toISOString().split('T')[0];
  const baseName = `${filename}-${today}`;

  // Fermer en cliquant ailleurs
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const exportPNG = async () => {
    if (!chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current, { backgroundColor: '#ffffff', scale: 2 });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${baseName}.png`;
      link.click();
    } finally {
      setOpen(false);
    }
  };

  const exportSVG = () => {
    if (!chartRef.current) return;
    const svgEl = chartRef.current.querySelector('svg');
    if (!svgEl) {
      alert('Aucun SVG trouvé dans ce graphe');
      return;
    }
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(clone);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${baseName}.svg`;
    link.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const exportPDF = async () => {
    if (!chartRef.current) return;
    try {
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
    } finally {
      setOpen(false);
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
          <button
            onClick={() => { void exportPNG(); }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            PNG
          </button>
          <button
            onClick={exportSVG}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            SVG
          </button>
          <button
            onClick={() => { void exportPDF(); }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            PDF
          </button>
        </div>
      )}
    </div>
  );
}
