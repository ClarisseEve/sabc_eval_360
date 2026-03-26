import React, { useState, useEffect } from 'react';
import { useForm } from '@/lib/inertia-shim';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/Components/UI/Dialog';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { Label } from '@/Components/UI/Label';
import { Textarea } from '@/Components/UI/Textarea';
import { Calendar } from 'lucide-react';

interface PeriodeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    periode?: {
        id_periode: number;
        titre: string;
        description?: string;
        date_debut: string;
        date_fin: string;
        id_regle?: string;
        dates_rappels?: {
            j_moins_7: string;
            j_moins_3: string;
            j_moins_1: string;
        };
    };
    regles?: Array<{
        id_regle: string;
        nom_regle: string;
    }>;
    mode: 'create' | 'edit';
}

export default function PeriodeFormModal({ isOpen, onClose, periode, regles = [], mode }: PeriodeFormModalProps) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        titre: periode?.titre || '',
        description: periode?.description || '',
        date_debut: periode?.date_debut || '',
        date_fin: periode?.date_fin || '',
        id_regle: periode?.id_regle || (regles[0]?.id_regle || ''),
        dates_rappels: periode?.dates_rappels || {
            j_moins_7: '',
            j_moins_3: '',
            j_moins_1: '',
        },
    });

    useEffect(() => {
        if (periode) {
            setData({
                titre: periode.titre || '',
                description: periode.description || '',
                date_debut: periode.date_debut || '',
                date_fin: periode.date_fin || '',
                id_regle: periode.id_regle || (regles[0]?.id_regle || ''),
                dates_rappels: periode.dates_rappels || {
                    j_moins_7: '',
                    j_moins_3: '',
                    j_moins_1: '',
                },
            });
        }
    }, [periode]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (mode === 'create') {
            post('/admin/evaluations/periodes', {
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        } else if (periode) {
            put(`/admin/evaluations/periodes/${periode.id_periode}`, {
                onSuccess: () => {
                    onClose();
                },
            });
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-sabc-gray-900 font-poppins">
                        {mode === 'create' ? 'Créer une Période d\'Évaluation' : 'Modifier la Période d\'Évaluation'}
                    </DialogTitle>
                    <DialogDescription className="text-sabc-gray-600">
                        {mode === 'create' 
                            ? 'Définissez les dates et paramètres de la nouvelle période d\'évaluation'
                            : 'Modifiez les informations de la période (uniquement si non ouverte)'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    {/* Informations générales */}
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="titre" className="text-sm font-medium text-sabc-gray-800">
                                Nom de la période *
                            </Label>
                            <Input
                                id="titre"
                                type="text"
                                value={data.titre}
                                onChange={(e) => setData('titre', e.target.value)}
                                placeholder="Ex: 2025-S1"
                                required
                                className="mt-1"
                            />
                            {errors.titre && (
                                <p className="text-sm text-sabc-error mt-1">{errors.titre}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="description" className="text-sm font-medium text-sabc-gray-800">
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Description de la période..."
                                rows={3}
                                className="mt-1"
                            />
                            {errors.description && (
                                <p className="text-sm text-sabc-error mt-1">{errors.description}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="date_debut" className="text-sm font-medium text-sabc-gray-800">
                                    Date de début *
                                </Label>
                                <div className="relative mt-1">
                                    <Input
                                        id="date_debut"
                                        type="date"
                                        value={data.date_debut}
                                        onChange={(e) => setData('date_debut', e.target.value)}
                                        required
                                    />
                                    <Calendar 
                                        size={16} 
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sabc-gray-400 pointer-events-none"
                                    />
                                </div>
                                {errors.date_debut && (
                                    <p className="text-sm text-sabc-error mt-1">{errors.date_debut}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="date_fin" className="text-sm font-medium text-sabc-gray-800">
                                    Date de fin *
                                </Label>
                                <div className="relative mt-1">
                                    <Input
                                        id="date_fin"
                                        type="date"
                                        value={data.date_fin}
                                        onChange={(e) => setData('date_fin', e.target.value)}
                                        required
                                    />
                                    <Calendar 
                                        size={16} 
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sabc-gray-400 pointer-events-none"
                                    />
                                </div>
                                {errors.date_fin && (
                                    <p className="text-sm text-sabc-error mt-1">{errors.date_fin}</p>
                                )}
                            </div>
                        </div>

                        {regles.length > 0 && (
                            <div>
                                <Label htmlFor="id_regle" className="text-sm font-medium text-sabc-gray-800">
                                    Règle d'évaluation *
                                </Label>
                                <select
                                    id="id_regle"
                                    value={data.id_regle}
                                    onChange={(e) => setData('id_regle', e.target.value)}
                                    required
                                    className="mt-1 w-full rounded-md border border-sabc-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sabc-red-primary"
                                >
                                    {regles.map((regle) => (
                                        <option key={regle.id_regle} value={regle.id_regle}>
                                            {regle.nom_regle}
                                        </option>
                                    ))}
                                </select>
                                {errors.id_regle && (
                                    <p className="text-sm text-sabc-error mt-1">{errors.id_regle}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Dates de rappels */}
                    <div className="border-t border-sabc-gray-200 pt-4">
                        <h4 className="text-sm font-semibold text-sabc-gray-900 mb-3">
                            Dates de Rappels (optionnel)
                        </h4>
                        <p className="text-xs text-sabc-gray-600 mb-4">
                            Les dates seront calculées automatiquement si non spécifiées
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="j_moins_7" className="text-xs font-medium text-sabc-gray-800">
                                    J-7 (7 jours avant fin)
                                </Label>
                                <Input
                                    id="j_moins_7"
                                    type="date"
                                    value={data.dates_rappels.j_moins_7}
                                    onChange={(e) => setData('dates_rappels', {
                                        ...data.dates_rappels,
                                        j_moins_7: e.target.value
                                    })}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="j_moins_3" className="text-xs font-medium text-sabc-gray-800">
                                    J-3 (3 jours avant fin)
                                </Label>
                                <Input
                                    id="j_moins_3"
                                    type="date"
                                    value={data.dates_rappels.j_moins_3}
                                    onChange={(e) => setData('dates_rappels', {
                                        ...data.dates_rappels,
                                        j_moins_3: e.target.value
                                    })}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="j_moins_1" className="text-xs font-medium text-sabc-gray-800">
                                    J-1 (1 jour avant fin)
                                </Label>
                                <Input
                                    id="j_moins_1"
                                    type="date"
                                    value={data.dates_rappels.j_moins_1}
                                    onChange={(e) => setData('dates_rappels', {
                                        ...data.dates_rappels,
                                        j_moins_1: e.target.value
                                    })}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-sabc-gray-200">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={processing}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            className="bg-sabc-red-primary hover:bg-sabc-red-dark"
                            disabled={processing}
                        >
                            {processing ? 'En cours...' : (mode === 'create' ? 'Créer' : 'Mettre à jour')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
