import React from 'react';
import { useForm } from '@/lib/inertia-shim';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/Components/UI/Dialog';
import { Button } from '@/Components/UI/Button';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    periode: {
        id_periode: number;
        nom_periode: string;
    };
}

export default function DeleteConfirmModal({ isOpen, onClose, periode }: DeleteConfirmModalProps) {
    const { delete: destroy, processing } = useForm({});

    const handleDelete = () => {
        destroy(`/admin/evaluations/periodes/${periode.id_periode}`, {
            onSuccess: () => {
                onClose();
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-sabc-error/10 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-sabc-error" />
                        </div>
                        <DialogTitle className="text-lg font-semibold text-sabc-gray-900 font-poppins">
                            Confirmer la suppression
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-sabc-gray-600 mt-3">
                        Êtes-vous sûr de vouloir supprimer la période <strong className="text-sabc-gray-900">{periode.nom_periode}</strong> ?
                        <br />
                        <span className="text-sm text-sabc-error mt-2 block">
                            Cette action est irréversible et supprimera toutes les données associées.
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex justify-end space-x-3 mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={processing}
                    >
                        Annuler
                    </Button>
                    <Button
                        type="button"
                        onClick={handleDelete}
                        className="bg-sabc-error hover:bg-red-700"
                        disabled={processing}
                    >
                        {processing ? 'Suppression...' : 'Supprimer'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
