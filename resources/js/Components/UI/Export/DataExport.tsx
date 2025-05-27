import * as React from 'react';
import { Download, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { Button } from '@/Components/UI/Button/Button';
import { Card, CardContent } from '@/Components/UI/Card/Card';
import { cn } from '@/utils/helpers';

export interface ExportFormat {
  id: string;
  label: string;
  extension: string;
  icon: React.ReactNode;
  mimeType: string;
}

export interface DataExportProps {
  onExport: (format: string) => void;
  formats?: ExportFormat[];
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const DataExport: React.FC<DataExportProps> = ({
  onExport,
  formats = [
    {
      id: 'csv',
      label: 'CSV',
      extension: '.csv',
      icon: <FileText className="h-4 w-4" />,
      mimeType: 'text/csv'
    },
    {
      id: 'excel',
      label: 'Excel',
      extension: '.xlsx',
      icon: <FileSpreadsheet className="h-4 w-4" />,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    },
    {
      id: 'pdf',
      label: 'PDF',
      extension: '.pdf',
      icon: <FileText className="h-4 w-4" />,
      mimeType: 'application/pdf'
    }
  ],
  isLoading = false,
  disabled = false,
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const handleExport = (format: string) => {
    onExport(format);
    setIsOpen(false);
  };
  
  return (
    <div className={cn("relative", className)}>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className="flex items-center"
      >
        <Download className="mr-2 h-4 w-4" />
        Exporter
        <ChevronDown className={cn(
          "ml-2 h-4 w-4 transition-transform",
          isOpen && "rotate-180"
        )} />
      </Button>
      
      {isOpen && (
        <Card className="absolute right-0 top-full z-50 mt-2 w-48 shadow-lg">
          <CardContent className="p-2">
            <div className="space-y-1">
              {formats.map(format => (
                <button
                  key={format.id}
                  onClick={() => handleExport(format.id)}
                  className="flex w-full items-center rounded-md p-2 text-sm text-sabc-gray-700 hover:bg-sabc-gray-100 dark:text-sabc-gray-300 dark:hover:bg-sabc-gray-800"
                >
                  {format.icon}
                  <span className="ml-2">{format.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Fonction utilitaire pour générer des fichiers d'exportation
export const generateExportFile = (data: any[], format: string, filename: string = 'export') => {
  const formats = {
    csv: {
      extension: '.csv',
      mimeType: 'text/csv',
      transform: (data: any[]) => {
        // Convertir les données en CSV
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [
          headers.join(','),
          ...data.map(row => 
            headers.map(header => {
              const cell = row[header] ?? '';
              // Échapper les virgules et les guillemets
              return typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))
                ? `"${cell.replace(/"/g, '""')}"`
                : cell;
            }).join(',')
          )
        ];
        
        return csvRows.join('\n');
      }
    },
    excel: {
      extension: '.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      transform: (data: any[]) => {
        // Pour Excel, nous retournons simplement les données JSON
        // Dans une implémentation réelle, vous utiliseriez une bibliothèque comme exceljs
        return JSON.stringify(data);
      }
    },
    pdf: {
      extension: '.pdf',
      mimeType: 'application/pdf',
      transform: (data: any[]) => {
        // Pour PDF, nous retournons simplement les données JSON
        // Dans une implémentation réelle, vous utiliseriez une bibliothèque comme jspdf
        return JSON.stringify(data);
      }
    }
  };
  
  const formatConfig = formats[format as keyof typeof formats];
  if (!formatConfig) throw new Error(`Format d'exportation non pris en charge: ${format}`);
  
  const content = formatConfig.transform(data);
  const blob = new Blob([content], { type: formatConfig.mimeType });
  const url = URL.createObjectURL(blob);
  
  // Créer un lien de téléchargement et cliquer dessus
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}${formatConfig.extension}`;
  document.body.appendChild(link);
  link.click();
  
  // Nettoyer
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default DataExport;
