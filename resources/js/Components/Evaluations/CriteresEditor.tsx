import { useState, useEffect } from 'react';
import { Button } from '@/Components/UI/Button/Button';
import { Input } from '@/Components/UI/Input/Input';
import { Label } from '@/Components/UI/Label/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select';
import { Trash2, Plus } from 'lucide-react';

interface Critere {
    id?: string;
    nom: string;
    description: string;
    ponderation: number;
    echelle: {
        min: number;
        max: number;
    };
    categorie: string;
}

interface CriteresEditorProps {
    value: Critere[];
    onChange: (criteres: Critere[]) => void;
    categories: string[];
    errors?: string;
}

export default function CriteresEditor({ value, onChange, categories, errors }: CriteresEditorProps) {
    const [criteres, setCriteres] = useState<Critere[]>(value || []);
    
    useEffect(() => {
        onChange(criteres);
    }, [criteres]);
    
    const totalPonderation = criteres.reduce((sum, c) => sum + (Number(c.ponderation) || 0), 0);
    const isValid = totalPonderation === 100 && criteres.length >= 5;
    
    const addCritere = () => {
        setCriteres([
            ...criteres,
            {
                nom: '',
                description: '',
                ponderation: 0,
                echelle: { min: 1, max: 5 },
                categorie: categories[0] || '',
            },
        ]);
    };
    
    const removeCritere = (index: number) => {
        setCriteres(criteres.filter((_, i) => i !== index));
    };
    
    const updateCritere = (index: number, field: string, value: any) => {
        const updated = [...criteres];
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            updated[index] = {
                ...updated[index],
                [parent]: {
                    ...(updated[index][parent as keyof Critere] as any),
                    [child]: value,
                },
            };
        } else {
            updated[index] = { ...updated[index], [field]: value };
        }
        setCriteres(updated);
    };
    
    return (
        <div className="space-y-4">
            {/* Indicateur progression pondérations */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-sabc-gray-800">
                            Total Pondérations
                        </span>
                        <span className={`text-lg font-bold ${
                            totalPonderation === 100 ? 'text-sabc-success' : 'text-sabc-error'
                        }`}>
                            {totalPonderation}%
                        </span>
                    </div>
                    
                    <div className="w-full bg-sabc-gray-200 rounded-full h-3">
                        <div 
                            className={`h-3 rounded-full transition-all ${
                                totalPonderation === 100 ? 'bg-sabc-success' : 
                                totalPonderation > 100 ? 'bg-sabc-error' : 'bg-sabc-accent'
                            }`}
                            style={{ width: `${Math.min(totalPonderation, 100)}%` }}
                        />
                    </div>
                    
                    {criteres.length < 5 && (
                        <p className="text-sm text-sabc-error mt-2">
                            Minimum 5 critères requis (actuellement : {criteres.length})
                        </p>
                    )}
                    
                    {totalPonderation !== 100 && criteres.length >= 5 && (
                        <p className="text-sm text-sabc-error mt-2">
                            La somme des pondérations doit être égale à 100%
                        </p>
                    )}
                </CardContent>
            </Card>
            
            {/* Liste critères */}
            {criteres.map((critere, index) => (
                <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-lg font-semibold text-sabc-gray-900">
                            Critère {index + 1}
                        </CardTitle>
                        <Button
                            type="button"
                            onClick={() => removeCritere(index)}
                            variant="destructive"
                            size="sm"
                            disabled={criteres.length <= 5}
                        >
                            <Trash2 size={16} />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor={`nom-${index}`}>Nom du critère</Label>
                                <Input
                                    id={`nom-${index}`}
                                    type="text"
                                    value={critere.nom}
                                    onChange={(e) => updateCritere(index, 'nom', e.target.value)}
                                    required
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor={`categorie-${index}`}>Catégorie</Label>
                                <Select
                                    value={critere.categorie}
                                    onValueChange={(value) => updateCritere(index, 'categorie', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner une catégorie" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="md:col-span-2">
                                <Label htmlFor={`description-${index}`}>Description</Label>
                                <textarea
                                    id={`description-${index}`}
                                    value={critere.description}
                                    onChange={(e) => updateCritere(index, 'description', e.target.value)}
                                    className="w-full border border-sabc-gray-200 rounded-lg p-2 min-h-[80px]"
                                    required
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor={`ponderation-${index}`}>Pondération (%)</Label>
                                <Input
                                    id={`ponderation-${index}`}
                                    type="number"
                                    value={critere.ponderation}
                                    onChange={(e) => updateCritere(index, 'ponderation', Number(e.target.value))}
                                    min={1}
                                    max={100}
                                    required
                                />
                            </div>
                            
                            <div>
                                <Label>Échelle de notation</Label>
                                <div className="flex items-center space-x-2">
                                    <Input type="number" value={1} disabled className="w-20" />
                                    <span>à</span>
                                    <Input type="number" value={5} disabled className="w-20" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
            
            {/* Bouton ajouter critère */}
            <Button
                type="button"
                onClick={addCritere}
                className="w-full bg-sabc-accent hover:bg-sabc-accent-light text-white"
            >
                <Plus size={16} className="mr-2" />
                Ajouter un critère
            </Button>
            
            {errors && (
                <p className="text-sm text-sabc-error">{errors}</p>
            )}
        </div>
    );
}
