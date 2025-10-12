import { useCallback, useMemo } from 'react';
import type { RefObject } from 'react';
import type { AnalyticsDataset } from './types';

const HTML_TO_IMAGE_CDN = 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/+esm';
const JSPDF_CDN = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm';
const XLSX_CDN = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm';

let htmlToImageModule: any;
let jsPdfModule: any;
let xlsxModule: any;

async function ensureHtmlToImage() {
  if (!htmlToImageModule) {
    htmlToImageModule = await import(/* @vite-ignore */ HTML_TO_IMAGE_CDN);
  }
  return htmlToImageModule;
}

async function ensureJsPdf() {
  if (!jsPdfModule) {
    jsPdfModule = await import(/* @vite-ignore */ JSPDF_CDN);
  }
  return jsPdfModule;
}

async function ensureXLSX() {
  if (!xlsxModule) {
    xlsxModule = await import(/* @vite-ignore */ XLSX_CDN);
  }
  return xlsxModule;
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

interface UseAnalyticsExportOptions {
  targetRef: RefObject<HTMLElement | null>;
  dataset: AnalyticsDataset;
  fileName?: string;
}

export const useAnalyticsExport = ({ targetRef, dataset, fileName }: UseAnalyticsExportOptions) => {
  const baseFileName = useMemo(() => fileName ?? 'analytics-dashboard', [fileName]);

  const exportAsPNG = useCallback(async () => {
    if (!targetRef.current) return;
    try {
      const htmlToImage = await ensureHtmlToImage();
      const dataUrl = await htmlToImage.toPng(targetRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      downloadDataUrl(dataUrl, `${baseFileName}.png`);
    } catch (error) {
      console.error('Export PNG échoué', error);
    }
  }, [baseFileName, targetRef]);

  const exportAsJPEG = useCallback(async () => {
    if (!targetRef.current) return;
    try {
      const htmlToImage = await ensureHtmlToImage();
      const dataUrl = await htmlToImage.toJpeg(targetRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        quality: 0.95,
      });
      downloadDataUrl(dataUrl, `${baseFileName}.jpeg`);
    } catch (error) {
      console.error('Export JPEG échoué', error);
    }
  }, [baseFileName, targetRef]);

  const exportAsPDF = useCallback(async () => {
    if (!targetRef.current) return;
    const element = targetRef.current;
    const rect = element.getBoundingClientRect();
    const scale = 2;

    try {
      const htmlToImage = await ensureHtmlToImage();
      const dataUrl = await htmlToImage.toPng(element, {
        cacheBust: true,
        pixelRatio: scale,
      });

      const { jsPDF } = await ensureJsPdf();
      const orientation = rect.width > rect.height ? 'l' : 'p';
      const pdf = new jsPDF({ orientation, unit: 'px', format: [rect.width, rect.height] });

      pdf.addImage(dataUrl, 'PNG', 0, 0, rect.width, rect.height);
      pdf.save(`${baseFileName}.pdf`);
    } catch (error) {
      console.error('Export PDF échoué', error);
    }
  }, [baseFileName, targetRef]);

  const exportAsExcel = useCallback(async () => {
    try {
      const XLSX = await ensureXLSX();
      const workbook = XLSX.utils.book_new();

      const kpiSheet = XLSX.utils.aoa_to_sheet([
        ['KPI', 'Valeur', 'Global', 'Variation'],
        ...dataset.kpis.map((kpi) => [
          kpi.label,
          kpi.value,
          kpi.globalValue ?? '',
          kpi.variation ?? '',
        ]),
      ]);

      const statusSheet = XLSX.utils.aoa_to_sheet([
        ['Statut', 'Filtré', 'Global'],
        ...dataset.evaluationStatusDistribution.map((status) => [
          status.label,
          status.filteredCount,
          status.globalCount ?? '',
        ]),
      ]);

      const competencySheet = XLSX.utils.aoa_to_sheet([
        ['Rôle', 'Famille', 'Score', 'Cible', 'Écart'],
        ...dataset.competencyHeatmap.map((cell) => [
          cell.role,
          cell.family,
          cell.score,
          cell.target,
          Number((cell.score - cell.target).toFixed(2)),
        ]),
      ]);

      XLSX.utils.book_append_sheet(workbook, kpiSheet, 'Synthese');
      XLSX.utils.book_append_sheet(workbook, statusSheet, 'Statuts');
      XLSX.utils.book_append_sheet(workbook, competencySheet, 'Competences');

      XLSX.writeFile(workbook, `${baseFileName}.xlsx`);
    } catch (error) {
      console.error('Export Excel échoué', error);
    }
  }, [baseFileName, dataset]);

  return {
    exportAsPNG,
    exportAsJPEG,
    exportAsPDF,
    exportAsExcel,
  };
};

export default useAnalyticsExport;
