import * as React from 'react';
import { Head } from '@inertiajs/react';
import { AlertCircle } from 'lucide-react';
import { User } from '@/types';
import { AppLayout } from '@/Layouts';
import { RoleEvaluationForm, EvaluationRole } from '@/Components/Forms/RoleEvaluationForm';
import { EvaluationFormData } from '@/Components/Forms/EvaluationForm';

interface RoleSpecificEvaluationProps {
  auth: {
    user: User | null;
  };
  evaluatedUser: User;
}

const RoleSpecificEvaluation: React.FC<RoleSpecificEvaluationProps> = ({
  auth,
  evaluatedUser,
}) => {
  // État initial de l'évaluation
  const initialEvaluation: EvaluationFormData = {
    evaluatorId: auth.user?.id || '',
    evaluatedId: evaluatedUser.id,
    status: 'draft',
    ratings: [],
  };

  const [evaluation, setEvaluation] = React.useState<EvaluationFormData>(initialEvaluation);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // État pour les notifications
  const [notification, setNotification] = React.useState<{
    type: 'success' | 'error' | 'none';
    message: string;
  }>({ type: 'none', message: '' });

  // Fonction pour afficher une notification
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    // Effacer la notification après 3 secondes
    setTimeout(() => {
      setNotification({ type: 'none', message: '' });
    }, 3000);
  };

  // Gérer la sauvegarde du brouillon
  const handleSaveDraft = async (data: EvaluationFormData) => {
    setIsSubmitting(true);
    try {
      // Simulation d'un appel API pour sauvegarder le brouillon
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEvaluation({
        ...data,
        updatedAt: new Date().toISOString(),
      });
      showNotification('success', 'Brouillon sauvegardé avec succès');
      return Promise.resolve();
    } catch (error) {
      showNotification('error', 'Erreur lors de la sauvegarde du brouillon');
      return Promise.reject(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gérer la soumission de l'évaluation
  const handleSubmit = async (data: EvaluationFormData) => {
    setIsSubmitting(true);
    try {
      // Simulation d'un appel API pour soumettre l'évaluation
      await new Promise(resolve => setTimeout(resolve, 1500));
      setEvaluation({
        ...data,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
      });
      showNotification('success', 'Évaluation soumise avec succès');
      return Promise.resolve();
    } catch (error) {
      showNotification('error', 'Erreur lors de la soumission de l\'évaluation');
      return Promise.reject(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Vérifier si l'utilisateur peut être évalué selon les règles SABC
  const canBeEvaluated = (role: string): boolean => {
    // Selon les règles métier SABC, DR et CDTT ne peuvent pas être évalués
    const nonEvaluableRoles = ['dr', 'cdtt'];
    return !nonEvaluableRoles.includes(role.toLowerCase());
  };

  // Liste des rôles supportés pour l'évaluation
  const supportedRoles: EvaluationRole[] = ['CDS', 'CDV', 'CSC', 'CDTT', 'RTM', 'TMO', 'SRMO', 'SS', 'AS'];

  // Sélectionner le formulaire approprié en fonction du rôle de l'utilisateur évalué
  const renderEvaluationForm = () => {
    const role = evaluatedUser.role?.toUpperCase() || '';

    // Vérifier si l'utilisateur peut être évalué
    if (!canBeEvaluated(role.toLowerCase())) {
      return (
        <div className="rounded-md bg-sabc-red-light/10 border border-sabc-red-light p-4 text-sabc-red-primary">
          <div className="flex items-start">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="font-medium">Évaluation non autorisée</h3>
              <p className="mt-1 text-sm">
                Selon les règles SABC, les Directeurs Régionaux (DR) et Chefs de Département Tanière et Territoire (CDTT) ne peuvent pas être évalués.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Vérifier si le rôle est supporté
    if (supportedRoles.includes(role as EvaluationRole)) {
      return (
        <RoleEvaluationForm
          role={role as EvaluationRole}
          evaluation={evaluation}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
        />
      );
    }

    // Rôle non supporté
    return (
      <div className="rounded-md bg-sabc-accent-light/10 border border-sabc-accent-light p-4 text-sabc-accent">
        <p>Formulaire d'évaluation non disponible pour ce rôle: {evaluatedUser.role}.</p>
        <p className="mt-2 text-sm">Veuillez contacter l'administrateur pour ajouter ce rôle au système d'évaluation.</p>
      </div>
    );
  };

  // Rendu du composant de notification
  const renderNotification = () => {
    if (notification.type === 'none') return null;
    
    const bgColor = notification.type === 'success' 
      ? 'bg-sabc-success/10 border-sabc-success text-sabc-success' 
      : 'bg-sabc-red-light/10 border-sabc-red-light text-sabc-red-primary';
    
    const icon = notification.type === 'success' 
      ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      : <AlertCircle className="h-5 w-5" />;
    
    return (
      <div className={`fixed bottom-4 right-4 z-50 flex items-center rounded-md border px-4 py-3 ${bgColor}`}>
        <div className="mr-3">{icon}</div>
        <p>{notification.message}</p>
      </div>
    );
  };

  return (
    <AppLayout>
      <Head title={`Évaluation de ${evaluatedUser.name}`} />
      
      {renderNotification()}
      
      <div className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-2xl font-semibold text-sabc-gray-900 dark:text-white">
            Évaluation de {evaluatedUser.name}
          </h1>
          
          <div className="mb-6 rounded-md bg-white p-4 shadow-sm dark:bg-sabc-gray-800">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-sabc-gray-500 dark:text-sabc-gray-400">Nom</p>
                <p className="text-sabc-gray-900 dark:text-white">{evaluatedUser.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-sabc-gray-500 dark:text-sabc-gray-400">Rôle</p>
                <p className="text-sabc-gray-900 dark:text-white">{evaluatedUser.role}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-sabc-gray-500 dark:text-sabc-gray-400">Région</p>
                <p className="text-sabc-gray-900 dark:text-white">{evaluatedUser.region || 'Non spécifié'}</p>
              </div>
            </div>
          </div>
          
          {renderEvaluationForm()}
        </div>
      </div>
    </AppLayout>
  );
};

export default RoleSpecificEvaluation;
