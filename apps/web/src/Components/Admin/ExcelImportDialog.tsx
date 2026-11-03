import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import { Button } from '@/Components/UI/Button/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/UI/Dialog/Dialog';
import { Input } from '@/Components/UI/Input';
import { Label } from '@/Components/UI/Label';
import { useToast } from '@/Contexts/ToastContext';
import {
  adminApi,
  type ExcelImportPreview,
  type ExcelImportResult,
  type ImportIssue,
} from '@/Services/api';

type ImportKind = 'users' | 'templates';
type PreviewReport = ExcelImportPreview & {
  users?: Array<{ row: number; matricule: string; nom: string; prenom: string; email: string }>;
  templates?: Array<{ key: string; row: number; titre: string; categorie: string; competences: number }>;
};

const errorMessage = (cause: unknown) =>
  cause instanceof Error ? cause.message : 'Une erreur inattendue a empêché l’opération.';

export function ExcelImportDialog({
  kind,
  open,
  onOpenChange,
}: {
  kind: ImportKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [initialPassword, setInitialPassword] = useState('');
  const [preview, setPreview] = useState<PreviewReport | null>(null);
  const [result, setResult] = useState<ExcelImportResult | null>(null);
  const [pending, setPending] = useState<'preview' | 'import' | 'download' | null>(null);
  const isUsers = kind === 'users';
  const title = isUsers ? 'Importer des utilisateurs' : 'Importer des templates';

  const close = () => {
    setFile(null);
    setInitialPassword('');
    setPreview(null);
    setResult(null);
    onOpenChange(false);
  };

  const downloadTemplate = async () => {
    setPending('download');
    try {
      const response = isUsers
        ? await adminApi.imports.usersTemplate()
        : await adminApi.imports.templatesTemplate();
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = isUsers ? 'modele-utilisateurs.xlsx' : 'modele-templates-evaluation.xlsx';
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) {
      error(errorMessage(cause));
    } finally {
      setPending(null);
    }
  };

  const runPreview = async () => {
    if (!file) return;
    setPending('preview');
    setResult(null);
    try {
      const response = isUsers
        ? await adminApi.imports.previewUsers(file, initialPassword)
        : await adminApi.imports.previewTemplates(file);
      setPreview(response.data);
    } catch (cause) {
      setPreview(null);
      error(errorMessage(cause));
    } finally {
      setPending(null);
    }
  };

  const runImport = async () => {
    if (!file || !preview || preview.valid_count === 0) return;
    setPending('import');
    try {
      const response = isUsers
        ? await adminApi.imports.importUsers(file, initialPassword)
        : await adminApi.imports.importTemplates(file);
      setResult(response.data);
      setPreview(null);
      await queryClient.invalidateQueries({ queryKey: isUsers ? ['admin', 'users'] : ['templates'] });
      success(`${response.data.imported_count} élément(s) importé(s).`);
    } catch (cause) {
      error(errorMessage(cause));
    } finally {
      setPending(null);
    }
  };

  const onFileChange = (nextFile: File | null) => {
    setFile(nextFile);
    setPreview(null);
    setResult(null);
  };

  const issues: ImportIssue[] = result?.errors ?? preview?.errors ?? [];

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Télécharge le modèle Excel, complète-le puis vérifie l’aperçu. Les doublons et lignes invalides seront ignorés sans modifier les enregistrements existants.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button type="button" variant="outline" onClick={() => void downloadTemplate()} disabled={pending !== null}>
            <Download className="mr-2 h-4 w-4" />
            {pending === 'download' ? 'Préparation…' : 'Télécharger le modèle Excel'}
          </Button>

          <div className="space-y-2">
            <Label htmlFor={`excel-import-${kind}`}>Fichier Excel (.xlsx)</Label>
            <Input
              id={`excel-import-${kind}`}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            />
          </div>

          {isUsers ? (
            <div className="space-y-2">
              <Label htmlFor="excel-import-initial-password">Mot de passe initial</Label>
              <Input
                id="excel-import-initial-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={initialPassword}
                onChange={(event) => setInitialPassword(event.target.value)}
              />
              <p className="text-xs text-sabc-gray-500">
                Il ne sera pas inscrit dans le classeur. Les utilisateurs devront le modifier à leur première connexion.
              </p>
            </div>
          ) : null}

          {preview ? (
            <div className="rounded-lg border border-sabc-gray-200 p-3 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <FileSpreadsheet className="h-4 w-4" />
                Aperçu : {preview.valid_count} prêt(s), {preview.skipped_count} ignoré(s), {preview.total} ligne(s) analysée(s).
              </div>
              {preview.users?.length ? (
                <p className="mt-2 text-sabc-gray-600">
                  Exemple : {preview.users.slice(0, 3).map((user) => `${user.matricule} · ${user.prenom} ${user.nom}`).join(' ; ')}
                </p>
              ) : null}
              {preview.templates?.length ? (
                <p className="mt-2 text-sabc-gray-600">
                  {preview.templates.slice(0, 3).map((template) => `${template.titre} · ${template.competences} compétence(s)`).join(' ; ')}
                </p>
              ) : null}
            </div>
          ) : null}

          {result ? (
            <div className="rounded-lg border border-sabc-gray-200 p-3 text-sm" role="status">
              Import terminé : {result.imported_count} importé(s), {result.skipped_count} ignoré(s).
            </div>
          ) : null}

          {issues.length > 0 ? (
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="status">
              {issues.map((issue, index) => (
                <p key={`${issue.row}-${index}`}>Ligne {issue.row} : {issue.message}</p>
              ))}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>Fermer</Button>
          {result ? null : preview ? (
            <Button type="button" onClick={() => void runImport()} disabled={pending !== null || preview.valid_count === 0}>
              <Upload className="mr-2 h-4 w-4" />
              {pending === 'import' ? 'Import en cours…' : 'Importer les éléments valides'}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => void runPreview()}
              disabled={pending !== null || !file || (isUsers && initialPassword.length < 8)}
            >
              {pending === 'preview' ? 'Vérification…' : 'Vérifier le fichier'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
