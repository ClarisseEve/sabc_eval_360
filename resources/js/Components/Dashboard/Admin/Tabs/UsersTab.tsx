import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { Input } from '@/Components/UI/Input/Input';
import { Label } from '@/Components/UI/Label/Label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/UI/Dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/Components/UI/DropdownMenu';
import { MoreVertical, Edit, Trash2, UserCheck, UserX, Plus, Filter, ChevronDown, X, Check, Search, Loader2 } from 'lucide-react';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/Components/UI/Pagination';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/Components/UI/Select';
import { Checkbox } from '@/Components/UI/Checkbox';
import { SearchFilter, FilterOption } from '@/Components/UI/SearchFilter/SearchFilter';
import { cn } from '@/utils/helpers';

/**
 * Composant pour l'onglet de gestion des utilisateurs
 * 
 * Spécifications selon les règles métier SABC :
 * - CRUD complet pour les utilisateurs
 * - Attribution des rôles
 * - Activation/désactivation des comptes
 */
const UsersTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Options de filtres basées sur les règles métier SABC
  const filterOptions: FilterOption[] = [
    {
      id: 'role',
      label: 'Rôle',
      options: [
        { value: 'dr', label: 'Directeur Régional (DR)' },
        { value: 'cdtt', label: 'Chef Département Trade (CDTT)' },
        { value: 'csc', label: 'Chef Service Commercial (CSC)' },
        { value: 'cdv', label: 'Chef District Vente (CDV)' },
        { value: 'cds', label: 'Chef de Secteur (CDS)' },
        { value: 'rtm', label: 'Regional Trade Marketing (RTM)' },
        { value: 'tmo', label: 'Trade Marketing Operator (TMO)' },
        { value: 'srmo', label: 'Superviseur Regional Marketing Operation (SRMO)' },
        { value: 'ss', label: 'Superviseur Sponsoring (SS)' },
        { value: 'as', label: 'Assistant Superviseur Sponsoring (AS)' },
      ],
      isMulti: true
    },
    {
      id: 'region',
      label: 'Région',
      options: [
        { value: 'littoral', label: 'Littoral (Tanière)' },
        { value: 'centre', label: 'Centre (Tanière)' },
        { value: 'ouest', label: 'Ouest (Non-Tanière)' },
        { value: 'nord', label: 'Nord (Non-Tanière)' },
      ],
      isMulti: true
    },
    {
      id: 'branche',
      label: 'Branche',
      options: [
        { value: 'commercial', label: 'Commercial' },
        { value: 'marketing', label: 'Marketing' },
      ],
      isMulti: false
    },
    {
      id: 'statut',
      label: 'Statut',
      options: [
        { value: 'actif', label: 'Actif' },
        { value: 'inactif', label: 'Inactif' },
      ],
      isMulti: false
    }
  ];
  const [searchTerm, setSearchTerm] = useState('');
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  // Données de démonstration pour les utilisateurs
  const users = [
    { id: '1', name: 'Thomas Mbarga', username: 'tmbarga', matricule: 'M12345', role: 'CDS', region: 'Littoral', categorie: 'Commercial', status: 'actif' },
    { id: '2', name: 'Marie Fouda', username: 'mfouda', matricule: 'M23456', role: 'TMO', region: 'Centre', categorie: 'Marketing', status: 'actif' },
    { id: '3', name: 'Jean Ekambi', username: 'jekambi', matricule: 'M34567', role: 'CSC', region: 'Ouest', categorie: 'Commercial', status: 'inactif' },
    { id: '4', name: 'Sophie Ndongo', username: 'sndongo', matricule: 'M45678', role: 'RTM', region: 'Nord', categorie: 'Marketing', status: 'actif' },
    { id: '5', name: 'Pierre Kamto', username: 'pkamto', matricule: 'M56789', role: 'DR', region: 'Littoral', categorie: null, status: 'actif' },
    { id: '6', name: 'Alice Ndom', username: 'andom', matricule: 'M67890', role: 'CDTT', region: 'Centre', categorie: null, status: 'actif' },
  ];
  
  // Filtrer les utilisateurs en fonction du terme de recherche
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.region.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Logique de pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  
  // Changer de page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  // Ouvrir le modal pour créer un nouvel utilisateur
  const handleCreate = () => {
    setSelectedUser(null);
    setIsAddUserDialogOpen(true);
  };
  
  // Ouvrir le modal pour éditer un utilisateur existant
  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setIsAddUserDialogOpen(true);
  };
  
  // Ouvrir le modal de confirmation de suppression
  const handleDelete = (user: any) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };
  
  // Fonction pour supprimer un utilisateur
  const confirmDelete = () => {
    // Logique de suppression à implémenter
    console.log(`Suppression de l'utilisateur ${selectedUser?.name}`);
    setIsDeleteDialogOpen(false);
  };
  
  // Fonction pour activer/désactiver un utilisateur
  const handleToggleStatus = (user: any) => {
    console.log(`Changement de statut pour ${user.name} : ${user.status === 'actif' ? 'inactif' : 'actif'}`);
    // Logique de changement de statut à implémenter
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-sabc-gray-700 dark:text-sabc-gray-300">Gestion des Utilisateurs</h2>
      </div>
      
      {/* Barre de recherche et filtres */}
      <div className="flex items-center justify-between mb-4">
        <div className="w-full max-w-3xl">
          <SearchFilter
            placeholder="Rechercher un utilisateur..."
            filters={filterOptions}
            onSearch={setSearchQuery}
            onFilterChange={(filterId, values) => {
              setActiveFilters(prev => ({
                ...prev,
                [filterId]: values
              }));
            }}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsAddUserDialogOpen(true)} className="whitespace-nowrap">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un utilisateur
          </Button>
        </div>
      </div>
      
      {/* Tableau des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
          <CardDescription>
            {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matricule</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Nom d'utilisateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Région</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.matricule}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.region}</TableCell>
                  <TableCell>{user.categorie || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge className={user.status === 'actif' ? 'bg-sabc-success text-white' : 'bg-sabc-gray-400 text-white'}>
                      {user.status === 'actif' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                          <span className="sr-only">Ouvrir menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Éditer
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleToggleStatus(user)}
                          className={user.status === 'actif' ? 'text-sabc-warning' : 'text-sabc-success'}
                        >
                          {user.status === 'actif' ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              Désactiver
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activer
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(user)}
                          className="text-sabc-error"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Pagination */}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => currentPage > 1 && paginate(currentPage - 1)}
              className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink 
                isActive={page === currentPage}
                onClick={() => paginate(page)}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => currentPage < totalPages && paginate(currentPage + 1)}
              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      
      {/* Formulaire d'ajout/édition d'utilisateur */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'Modifier un utilisateur' : 'Ajouter un utilisateur'}</DialogTitle>
            <DialogDescription>
              {selectedUser 
                ? 'Modifiez les informations de l\'utilisateur ci-dessous.'
                : 'Remplissez le formulaire pour ajouter un nouvel utilisateur.'}
            </DialogDescription>
          </DialogHeader>
          
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Prénom</Label>
                <Input id="firstName" defaultValue={selectedUser?.firstName || ''} />
              </div>
              <div>
                <Label htmlFor="lastName">Nom</Label>
                <Input id="lastName" defaultValue={selectedUser?.lastName || ''} />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={selectedUser?.email || ''} />
            </div>
            
            <div>
              <Label htmlFor="role">Rôle</Label>
              <Select defaultValue={selectedUser?.role || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dr">Directeur Régional (DR)</SelectItem>
                  <SelectItem value="cdtt">Chef Département Trade (CDTT)</SelectItem>
                  <SelectItem value="csc">Chef Service Commercial (CSC)</SelectItem>
                  <SelectItem value="cdv">Chef District Vente (CDV)</SelectItem>
                  <SelectItem value="cds">Chef de Secteur (CDS)</SelectItem>
                  <SelectItem value="rtm">Regional Trade Marketing (RTM)</SelectItem>
                  <SelectItem value="tmo">Trade Marketing Operator (TMO)</SelectItem>
                  <SelectItem value="srmo">Superviseur Regional Marketing Operation (SRMO)</SelectItem>
                  <SelectItem value="ss">Superviseur Sponsoring (SS)</SelectItem>
                  <SelectItem value="as">Assistant Superviseur Sponsoring (AS)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="region">Région</Label>
              <Select defaultValue={selectedUser?.region || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une région" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="littoral">Littoral (Tanière)</SelectItem>
                  <SelectItem value="centre">Centre (Tanière)</SelectItem>
                  <SelectItem value="ouest">Ouest (Non-Tanière)</SelectItem>
                  <SelectItem value="nord">Nord (Non-Tanière)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="branche">Branche</Label>
              <Select defaultValue={selectedUser?.branche || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une branche" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Modal de confirmation de suppression */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'utilisateur {selectedUser?.name} ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={confirmDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersTab;
