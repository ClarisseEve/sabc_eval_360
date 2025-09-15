import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/UI/Tabs/Tabs';
import { WelcomeMessage } from '@/Components/UI/WelcomeMessage';

// Import des composants d'onglets
import DashboardTab from '@/Components/Dashboard/Admin/Tabs/DashboardTab';
import UsersTab from '@/Components/Dashboard/Admin/Tabs/UsersTab';
import RegionsTab from '@/Components/Dashboard/Admin/Tabs/RegionsTab';
import RolesTab from '@/Components/Dashboard/Admin/Tabs/RolesTab';
import EvaluationsTab from '@/Components/Dashboard/Admin/Tabs/EvaluationsTab';

/**
 * Tableau de bord Administrateur
 * 
 * Spécifications selon les règles métier SABC :
 * - Gestion des utilisateurs et des rôles
 * - Configuration du système
 * - Supervision globale des évaluations
 */
const AdminDashboard: React.FC = () => {
  // État pour suivre l'onglet actif
  const [activeTab, setActiveTab] = useState("dashboard");
  // Simuler un utilisateur administrateur pour la démo
  const mockUser = {
    name: 'Admin SABC',
    email: 'admin@sabc.cm',
    role: 'ADMIN',
    avatar: undefined
  };
  
  // Données de démonstration pour les statistiques système
  const systemStats = [
    { name: 'Utilisateurs actifs', value: 45, total: 50, icon: 'users' },
    { name: 'Évaluations complétées', value: 120, total: 200, icon: 'check-circle' },
    { name: 'Régions configurées', value: 4, total: 4, icon: 'map' },
    { name: 'Taux d\'utilisation', value: 78, total: 100, icon: 'activity' }
  ];
  
  // Données de démonstration pour les dernières activités
  const recentActivities = [
    { id: '1', user: 'DR Littoral', action: 'Connexion au système', time: '10:25', date: 'Aujourd\'hui' },
    { id: '2', user: 'CDTT Centre', action: 'Évaluation soumise', time: '09:15', date: 'Aujourd\'hui' },
    { id: '3', user: 'CSC Ouest', action: 'Compte créé', time: '16:30', date: 'Hier' },
    { id: '4', user: 'RTM Nord', action: 'Mot de passe modifié', time: '14:20', date: 'Hier' },
    { id: '5', user: 'CDS Littoral', action: 'Évaluation rejetée', time: '11:05', date: '02/06/2025' }
  ];
  
  // Données de démonstration pour les utilisateurs
  const users = [
    { id: '1', name: 'Thomas Mbarga', username: 'tmbarga', matricule: 'M12345', role: 'CDS', region: 'Littoral', status: 'actif' },
    { id: '2', name: 'Marie Fouda', username: 'mfouda', matricule: 'M23456', role: 'TMO', region: 'Centre', status: 'actif' },
    { id: '3', name: 'Jean Ekambi', username: 'jekambi', matricule: 'M34567', role: 'CSC', region: 'Ouest', status: 'inactif' },
    { id: '4', name: 'Sophie Ndongo', username: 'sndongo', matricule: 'M45678', role: 'RTM', region: 'Nord', status: 'actif' },
    { id: '5', name: 'Pierre Kamto', username: 'pkamto', matricule: 'M56789', role: 'DR', region: 'Littoral', status: 'actif' },
    { id: '6', name: 'Alice Ndom', username: 'andom', matricule: 'M67890', role: 'CDTT', region: 'Centre', status: 'actif' },
  ];
  
  // Données de démonstration pour les utilisateurs récemment actifs
  const recentUsers = [
    { id: '1', name: 'Thomas Mbarga', role: 'CDS', region: 'Littoral', status: 'actif', lastLogin: 'Il y a 5 min' },
    { id: '2', name: 'Marie Fouda', role: 'TMO', region: 'Centre', status: 'actif', lastLogin: 'Il y a 20 min' },
    { id: '3', name: 'Jean Ekambi', role: 'CSC', region: 'Ouest', status: 'actif', lastLogin: 'Il y a 1 heure' },
    { id: '4', name: 'Sophie Ndongo', role: 'RTM', region: 'Nord', status: 'actif', lastLogin: 'Il y a 2 heures' }
  ];
  
  // Données de démonstration pour les régions
  const regions = [
    { id: '1', nom: 'Littoral', est_taniere: true },
    { id: '2', nom: 'Centre', est_taniere: true },
    { id: '3', nom: 'Ouest', est_taniere: false },
    { id: '4', nom: 'Nord', est_taniere: false },
  ];
  
  // Données de démonstration pour les rôles
  const roles = [
    { id: '1', nom: 'ADMIN', description: 'Administrateur système', niveau: 0, categorie: 'Administration' },
    { id: '2', nom: 'DR', description: 'Directeur Régional', niveau: 1, categorie: null },
    { id: '3', nom: 'CDTT', description: 'Chef Département Trade', niveau: 2, categorie: null },
    { id: '4', nom: 'CSC', description: 'Chef Service Commercial', niveau: 3, categorie: 'Commercial' },
    { id: '5', nom: 'CDV', description: 'Chef District Vente', niveau: 4, categorie: 'Commercial' },
    { id: '6', nom: 'CDS', description: 'Chef de Secteur', niveau: 5, categorie: 'Commercial' },
    { id: '7', nom: 'RTM', description: 'Regional Trade Marketing', niveau: 3, categorie: 'Marketing' },
    { id: '8', nom: 'SRMO', description: 'Superviseur Regional Marketing Operation', niveau: 3, categorie: 'Marketing' },
    { id: '9', nom: 'TMO', description: 'Trade Marketing Operator', niveau: 4, categorie: 'Marketing' },
    { id: '10', nom: 'SS', description: 'Superviseur Sponsoring', niveau: 4, categorie: 'Marketing' },
    { id: '11', nom: 'AS', description: 'Assistant Superviseur Sponsoring', niveau: 5, categorie: 'Marketing' },
  ];
  
  // Données de démonstration pour les évaluations
  const evaluations = [
    { id: '1', evaluateur: 'Thomas Mbarga', evalue: 'Marie Fouda', type: 'Pair', date: '01/06/2025', statut: 'Validé' },
    { id: '2', evaluateur: 'Pierre Kamto', evalue: 'Jean Ekambi', type: 'Descendante', date: '31/05/2025', statut: 'Validé' },
    { id: '3', evaluateur: 'Sophie Ndongo', evalue: 'Sophie Ndongo', type: 'Auto', date: '30/05/2025', statut: 'Soumis' },
    { id: '4', evaluateur: 'Alice Ndom', evalue: 'Pierre Kamto', type: 'Descendante', date: '29/05/2025', statut: 'Rejeté' },
    { id: '5', evaluateur: 'Jean Ekambi', evalue: 'Jean Ekambi', type: 'Auto', date: '28/05/2025', statut: 'Brouillon' },
  ];

  return (
    <AppLayout
      user={mockUser}
      pageTitle="Tableau de bord"
      notifications={[{
        id: '1',
        title: 'Configuration requise',
        message: 'Veuillez compléter la configuration des compétences',
        status: 'info',
        read: false,
        createdAt: new Date().toISOString()
      }]}
    >
      <Head title="Tableau de bord Administrateur- SABC Évaluation 360°" />
      
      <div className="container mx-auto px-4 py-6">
        {/* Utilisation du composant WelcomeMessage */}
        <WelcomeMessage userName={mockUser.name} className="mb-8" />
        
        
        {/* Navigation par onglets */}
        <Tabs defaultValue="dashboard" className="mb-6" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="regions">Régions</TabsTrigger>
            <TabsTrigger value="roles">Rôles</TabsTrigger>
            <TabsTrigger value="evaluations">Évaluations</TabsTrigger>
          </TabsList>
          
          {/* Contenu des onglets avec les composants importés */}
          <TabsContent value="dashboard">
            <DashboardTab />
          </TabsContent>
          
          {/* Contenu de l'onglet Utilisateurs */}
          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
          
          {/* Contenu de l'onglet Régions */}
          <TabsContent value="regions">
            <RegionsTab />
          </TabsContent>
          
          {/* Contenu de l'onglet Rôles */}
          <TabsContent value="roles">
            <RolesTab />
          </TabsContent>
          
          {/* Contenu de l'onglet Évaluations */}
          <TabsContent value="evaluations">
            <EvaluationsTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
