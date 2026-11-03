import { useQuery } from '@tanstack/react-query';
import { Label } from '@/Components/UI/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select';
import { adminApi } from '@/Services/api';

type AssignmentValues = {
    id_role: string;
    id_region: string;
    manager_matricule: string;
    id_service: string;
    id_district: string;
    id_secteur: string;
};

type AssignmentField = 'manager_matricule' | 'id_service' | 'id_district' | 'id_secteur';

type UserAssignmentFieldsProps = {
    values: AssignmentValues;
    onChange: (field: AssignmentField, value: string) => void;
};

export function UserAssignmentFields({ values, onChange }: UserAssignmentFieldsProps) {
    const servicesQuery = useQuery({
        queryKey: ['admin', 'structure', 'services'],
        queryFn: () => adminApi.structure.services().then((response) => response.data),
    });
    const districtsQuery = useQuery({
        queryKey: ['admin', 'structure', 'districts'],
        queryFn: () => adminApi.structure.districts().then((response) => response.data),
    });
    const secteursQuery = useQuery({
        queryKey: ['admin', 'structure', 'secteurs'],
        queryFn: () => adminApi.structure.secteurs().then((response) => response.data),
    });
    const managersQuery = useQuery({
        queryKey: ['admin', 'eligible-managers', values.id_role, values.id_region],
        queryFn: () => adminApi.users.eligibleManagers(values.id_role, values.id_region).then((response) => response.data),
        enabled: Boolean(values.id_role && values.id_region),
    });

    const services = Array.isArray(servicesQuery.data) ? servicesQuery.data : [];
    const districts = Array.isArray(districtsQuery.data) ? districtsQuery.data : [];
    const secteurs = Array.isArray(secteursQuery.data) ? secteursQuery.data : [];
    const managers = Array.isArray(managersQuery.data) ? managersQuery.data : [];
    const availableServices = services.filter((service: any) => service.id_region === values.id_region);
    const availableDistricts = districts.filter((district: any) => district.id_service === values.id_service);
    const availableSecteurs = secteurs.filter((secteur: any) =>
        secteur.id_service === values.id_service
        && (!values.id_district || !secteur.id_district || secteur.id_district === values.id_district),
    );
    const structuresLoading = servicesQuery.isPending || districtsQuery.isPending || secteursQuery.isPending;
    const structuresError = servicesQuery.isError || districtsQuery.isError || secteursQuery.isError;

    return (
        <>
            <div className="space-y-1">
                <Label htmlFor="assignment-service">Service</Label>
                <Select
                    value={values.id_service || '__none__'}
                    onValueChange={(value) => {
                        onChange('id_service', value === '__none__' ? '' : value);
                        onChange('id_district', '');
                        onChange('id_secteur', '');
                    }}
                    disabled={!values.id_region || structuresLoading || structuresError}
                >
                    <SelectTrigger id="assignment-service"><SelectValue placeholder="Aucun service" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__none__">Aucun service</SelectItem>
                        {availableServices.map((service: any) => (
                            <SelectItem key={service.id_service} value={service.id_service}>
                                {service.nom_service}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1">
                <Label htmlFor="assignment-district">District</Label>
                <Select
                    value={values.id_district || '__none__'}
                    onValueChange={(value) => {
                        onChange('id_district', value === '__none__' ? '' : value);
                        onChange('id_secteur', '');
                    }}
                    disabled={!values.id_service || structuresLoading || structuresError}
                >
                    <SelectTrigger id="assignment-district"><SelectValue placeholder="Aucun district" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__none__">Aucun district</SelectItem>
                        {availableDistricts.map((district: any) => (
                            <SelectItem key={district.id_district} value={district.id_district}>
                                {district.nom_district}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1">
                <Label htmlFor="assignment-secteur">Secteur</Label>
                <Select
                    value={values.id_secteur || '__none__'}
                    onValueChange={(value) => {
                        const idSecteur = value === '__none__' ? '' : value;
                        const selected = secteurs.find((secteur: any) => secteur.id_secteur === idSecteur);
                        if (selected?.id_district && selected.id_district !== values.id_district) {
                            onChange('id_district', selected.id_district);
                        }
                        onChange('id_secteur', idSecteur);
                    }}
                    disabled={!values.id_service || structuresLoading || structuresError}
                >
                    <SelectTrigger id="assignment-secteur"><SelectValue placeholder="Aucun secteur" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__none__">Aucun secteur</SelectItem>
                        {availableSecteurs.map((secteur: any) => (
                            <SelectItem key={secteur.id_secteur} value={secteur.id_secteur}>
                                {secteur.nom_secteur}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1">
                <Label htmlFor="assignment-manager">Manager direct (facultatif)</Label>
                <Select
                    value={values.manager_matricule || '__none__'}
                    onValueChange={(value) => onChange('manager_matricule', value === '__none__' ? '' : value)}
                    disabled={!values.id_role || !values.id_region || managersQuery.isPending || managersQuery.isError}
                >
                    <SelectTrigger id="assignment-manager"><SelectValue placeholder="Aucun manager" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__none__">Aucun manager</SelectItem>
                        {managers.map((manager: any) => (
                            <SelectItem key={manager.matricule} value={manager.matricule}>
                                {[manager.prenom, manager.nom].filter(Boolean).join(' ')} · {manager.role_nom || manager.role} · {manager.matricule}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className={`text-xs ${managersQuery.isError ? 'text-red-700' : 'text-sabc-gray-500'}`}>
                    {!values.id_role || !values.id_region
                        ? 'Sélectionnez d’abord le rôle et la région.'
                        : managersQuery.isError
                          ? 'Impossible de charger les managers éligibles.'
                          : managersQuery.isPending
                            ? 'Recherche des managers…'
                            : managers.length === 0
                              ? 'Aucun manager actif éligible dans cette région.'
                              : 'Seuls les managers actifs du niveau hiérarchique supérieur sont proposés.'}
                </p>
            </div>

            {structuresError ? (
                <p role="alert" className="text-sm text-red-700 md:col-span-2">
                    Impossible de charger les services, districts et secteurs. Réessayez avant de choisir un rattachement.
                </p>
            ) : structuresLoading ? (
                <p className="text-xs text-sabc-gray-500 md:col-span-2">Chargement des structures…</p>
            ) : null}
        </>
    );
}
