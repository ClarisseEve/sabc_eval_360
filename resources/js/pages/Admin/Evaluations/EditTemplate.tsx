import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Input } from '@/Components/UI/Input/Input';
import { Label } from '@/Components/UI/Label/Label';
import { Textarea } from '@/Components/UI/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select';
import { Link } from '@inertiajs/react';
import SectionsCompetencesEditor from '@/Components/Evaluation/Admin/SectionsCompetencesEditor';
import { useAuth } from '@/Hooks/useAuth';
import { RoleGuard } from '@/Components/Auth/RoleGuard';

// Page d'édition de template d'évaluation
interface Props {
  template: {
    id: string;
    titre: string;
    description: string;
    categorie: string;
    est_actif: boolean;
    sections: Array<{
      id: string;
      titre: string;
      description: string;
      ordre: number;
      competences: Array<{
        id: string;
        libelle: string;
        description: string;
        niveau_requis: number;
        ordre: number;
      }>;
    }>;
  };
}

const EditTemplateAdminPage: React.FC<Props> = ({ template }) => {
  // Formulaire principal avec les données du template existant
  const { data, setData, put, processing, errors } = useForm({
    titre: template.titre,
    description: template.description,
    categorie: template.categorie,
    est_actif: template.est_actif,
    sections: template.sections
  });

  // Vérifier si le template est valide (minimum 5 compétences au total)
  const estValide = () => {
    const totalCompetences = data.sections.reduce(
      (total, section) => total + section.competences.length, 0
    );
    return totalCompetences >= 5;
  };

  // Soumettre le formulaire
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    put(`/admin/evaluation/templates/${template.id}`);
  };

  // Authentification
  const { user, isLoading } = useAuth();

  // Indicateur de chargement pendant la récupération de l'utilisateur
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sabc-red-primary"></div>
      </div>
    );
  }

  // Adapter l'utilisateur au format attendu par AppLayout
  const adaptedUser = user ? {
    name: `${user.prenom} ${user.nom}`,
    email: user.email,
    role: user.role_nom,
    avatar: user.avatar
  } : {
    name: 'Utilisateur',
    email: 'utilisateur@sabc.cm',
    role: 'Invité'
  };

  return (
    <RoleGuard allowed={["ADMIN"]} userRoleName={user?.role_nom}>
    <AppLayout user={adaptedUser}>
      <Head title="Modifier un template d'évaluation | SABC Eval360" />
      
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-sabc-gray-900">Modifier un template d'évaluation</h1>
          <Link href="/admin/evaluation/templates">
            <Button variant="outline">
              Retour à la liste
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Informations du template</CardTitle>
              <CardDescription>
                Configurez les informations générales du template d'évaluation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="titre">Titre du template</Label>
                    <Input
                      id="titre"
                      value={data.titre}
                      onChange={(e) => setData('titre', e.target.value)}
                      placeholder="Ex: Évaluation Commerciale Standard"
                      required
                    />
                    {errors.titre && <p className="text-sabc-error text-sm mt-1">{errors.titre}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="categorie">Catégorie</Label>
                    <Select
                      value={data.categorie}
                      onValueChange={(value) => setData('categorie', value)}
                    >
                      <SelectTrigger id="categorie">
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.categorie && <p className="text-sabc-error text-sm mt-1">{errors.categorie}</p>}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={data.description}
                      onChange={(e) => setData('description', e.target.value)}
                      placeholder="Description du template d'évaluation..."
                      rows={4}
                    />
                    {errors.description && <p className="text-sabc-error text-sm mt-1">{errors.description}</p>}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="est_actif"
                      checked={data.est_actif}
                      onChange={(e) => setData('est_actif', e.target.checked)}
                      className="rounded border-sabc-gray-300"
                    />
                    <Label htmlFor="est_actif">Template actif</Label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <div>
                {!estValide() && (
                  <p className="text-sabc-error text-sm">
                    Le template doit contenir au moins 5 compétences au total.
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <Link href="/admin/evaluation/templates">
                  <Button type="button" variant="outline">
                    Annuler
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  disabled={processing || !estValide()}
                  className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white"
                >
                  Enregistrer les modifications
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          {/* Utilisation du composant SectionsCompetencesEditor pour gérer les sections et compétences */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Sections et compétences</h2>
            <SectionsCompetencesEditor 
              sections={data.sections} 
              onChange={(newSections) => setData('sections', newSections)}
              errors={errors}
            />
          </div>
        </form>
      </div>
    </AppLayout>
    </RoleGuard>
  );
};

export default EditTemplateAdminPage;
