@extends('layouts.app')

@section('title', 'Créer un remplacement temporaire')

@section('content')
<div class="container-fluid px-4">
    <h1 class="mt-4">Créer un remplacement temporaire</h1>
    
    <div class="card mb-4">
        <div class="card-header">
            <i class="fas fa-exchange-alt me-1"></i>
            Nouveau remplacement
        </div>
        <div class="card-body">
            @if ($errors->any())
                <div class="alert alert-danger">
                    <ul class="mb-0">
                        @foreach ($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif
            
            <form action="{{ route('admin.remplacements.store') }}" method="POST">
                @csrf
                
                <div class="row mb-4">
                    <div class="col-md-6">
                        <div class="card border-danger">
                            <div class="card-header bg-danger text-white">
                                <i class="fas fa-user-tie me-1"></i> Titulaire à remplacer
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label for="titulaire_matricule" class="form-label">Sélectionner le titulaire</label>
                                    <select class="form-select" id="titulaire_matricule" name="titulaire_matricule" required>
                                        <option value="">-- Sélectionner un titulaire --</option>
                                        @foreach($utilisateurs as $utilisateur)
                                            @if($utilisateur->id_role && !$utilisateur->estIndisponible())
                                                <option value="{{ $utilisateur->matricule }}" data-id="{{ $utilisateur->id_utilisateur }}">
                                                    {{ $utilisateur->nom }} {{ $utilisateur->prenom }} ({{ $utilisateur->matricule }})
                                                </option>
                                            @endif
                                        @endforeach
                                    </select>
                                </div>
                                
                                <div id="titulaire_info" class="d-none">
                                    <div class="alert alert-info">
                                        <div class="mb-2"><strong>Rôle:</strong> <span id="titulaire_role"></span></div>
                                        <div class="mb-2"><strong>Région:</strong> <span id="titulaire_region"></span></div>
                                    </div>
                                </div>
                                
                                <input type="hidden" id="role_remplace" name="role_remplace">
                                <input type="hidden" id="region_remplacement" name="region_remplacement">
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="card border-success">
                            <div class="card-header bg-success text-white">
                                <i class="fas fa-user-plus me-1"></i> Remplaçant temporaire
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label for="remplacant_matricule" class="form-label">Sélectionner le remplaçant</label>
                                    <select class="form-select" id="remplacant_matricule" name="remplacant_matricule" required disabled>
                                        <option value="">-- Sélectionner d'abord un titulaire --</option>
                                    </select>
                                </div>
                                
                                <div id="remplacant_info" class="d-none">
                                    <div class="alert alert-info">
                                        <div class="mb-2"><strong>Rôle actuel:</strong> <span id="remplacant_role"></span></div>
                                        <div class="mb-2"><strong>Région:</strong> <span id="remplacant_region"></span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row mb-4">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <i class="fas fa-calendar-alt me-1"></i> Période de remplacement
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label for="date_debut" class="form-label">Date de début</label>
                                    <input type="date" class="form-control" id="date_debut" name="date_debut" value="{{ old('date_debut', date('Y-m-d')) }}" required>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="date_fin" class="form-label">Date de fin (optionnelle)</label>
                                    <input type="date" class="form-control" id="date_fin" name="date_fin" value="{{ old('date_fin') }}">
                                    <div class="form-text">Laissez vide si la date de fin est indéterminée</div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="duree_prevue_jours" class="form-label">Durée prévue (jours)</label>
                                    <input type="number" class="form-control" id="duree_prevue_jours" name="duree_prevue_jours" value="{{ old('duree_prevue_jours', 30) }}" min="30" required>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <i class="fas fa-info-circle me-1"></i> Informations complémentaires
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label for="motif" class="form-label">Motif du remplacement</label>
                                    <select class="form-select" id="motif" name="motif" required>
                                        <option value="">-- Sélectionner un motif --</option>
                                        <option value="Congé maladie">Congé maladie</option>
                                        <option value="Congé maternité">Congé maternité</option>
                                        <option value="Congé sabbatique">Congé sabbatique</option>
                                        <option value="Formation longue durée">Formation longue durée</option>
                                        <option value="Mission spéciale">Mission spéciale</option>
                                        <option value="Absence temporaire">Absence temporaire</option>
                                        <option value="Autre">Autre</option>
                                    </select>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="service_remplacement" class="form-label">Service concerné (optionnel)</label>
                                    <input type="text" class="form-control" id="service_remplacement" name="service_remplacement" value="{{ old('service_remplacement') }}">
                                </div>
                                
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="notifier_equipe" name="notifier_equipe" checked>
                                    <label class="form-check-label" for="notifier_equipe">
                                        Notifier l'équipe du titulaire
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="d-flex justify-content-between">
                    <a href="{{ route('admin.remplacements.index') }}" class="btn btn-secondary">
                        <i class="fas fa-arrow-left me-1"></i> Retour
                    </a>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save me-1"></i> Enregistrer le remplacement
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function() {
        const titulaireSelect = document.getElementById('titulaire_matricule');
        const remplacantSelect = document.getElementById('remplacant_matricule');
        const titulaireInfo = document.getElementById('titulaire_info');
        const remplacantInfo = document.getElementById('remplacant_info');
        const roleRemplace = document.getElementById('role_remplace');
        const regionRemplacement = document.getElementById('region_remplacement');
        
        // Lorsqu'un titulaire est sélectionné
        titulaireSelect.addEventListener('change', function() {
            const matricule = this.value;
            
            if (!matricule) {
                titulaireInfo.classList.add('d-none');
                remplacantSelect.disabled = true;
                remplacantSelect.innerHTML = '<option value="">-- Sélectionner d\'abord un titulaire --</option>';
                return;
            }
            
            // Récupérer les informations du titulaire via AJAX
            fetch(`{{ route('admin.remplacements.utilisateur.info') }}?matricule=${matricule}`)
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        console.error(data.error);
                        return;
                    }
                    
                    // Afficher les informations du titulaire
                    document.getElementById('titulaire_role').textContent = data.role;
                    document.getElementById('titulaire_region').textContent = data.region;
                    titulaireInfo.classList.remove('d-none');
                    
                    // Mettre à jour les champs cachés
                    roleRemplace.value = data.role;
                    regionRemplacement.value = data.region;
                    
                    // Activer et remplir le select des remplaçants
                    remplacantSelect.disabled = false;
                    remplacantSelect.innerHTML = '<option value="">-- Sélectionner un remplaçant --</option>';
                    
                    // Récupérer la liste des remplaçants potentiels
                    fetch(`{{ url('/api/utilisateurs') }}?exclude=${data.id_utilisateur}&statut=Actif`)
                        .then(response => response.json())
                        .then(utilisateurs => {
                            utilisateurs.forEach(user => {
                                if (!user.est_indisponible && !user.est_remplacant) {
                                    const option = document.createElement('option');
                                    option.value = user.matricule;
                                    option.textContent = `${user.nom} ${user.prenom} (${user.matricule})`;
                                    remplacantSelect.appendChild(option);
                                }
                            });
                        })
                        .catch(error => console.error('Erreur lors de la récupération des remplaçants:', error));
                })
                .catch(error => console.error('Erreur lors de la récupération des informations du titulaire:', error));
        });
        
        // Lorsqu'un remplaçant est sélectionné
        remplacantSelect.addEventListener('change', function() {
            const matricule = this.value;
            
            if (!matricule) {
                remplacantInfo.classList.add('d-none');
                return;
            }
            
            // Récupérer les informations du remplaçant via AJAX
            fetch(`{{ route('admin.remplacements.utilisateur.info') }}?matricule=${matricule}`)
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        console.error(data.error);
                        return;
                    }
                    
                    // Afficher les informations du remplaçant
                    document.getElementById('remplacant_role').textContent = data.role;
                    document.getElementById('remplacant_region').textContent = data.region;
                    remplacantInfo.classList.remove('d-none');
                })
                .catch(error => console.error('Erreur lors de la récupération des informations du remplaçant:', error));
        });
        
        // Mise à jour de la date de fin en fonction de la durée
        const dateDebut = document.getElementById('date_debut');
        const dateFin = document.getElementById('date_fin');
        const dureePrevue = document.getElementById('duree_prevue_jours');
        
        dateDebut.addEventListener('change', updateDateFin);
        dureePrevue.addEventListener('change', updateDateFin);
        
        function updateDateFin() {
            if (dateDebut.value && dureePrevue.value) {
                const debut = new Date(dateDebut.value);
                const fin = new Date(debut);
                fin.setDate(debut.getDate() + parseInt(dureePrevue.value));
                
                // Format YYYY-MM-DD
                const year = fin.getFullYear();
                const month = String(fin.getMonth() + 1).padStart(2, '0');
                const day = String(fin.getDate()).padStart(2, '0');
                dateFin.value = `${year}-${month}-${day}`;
            }
        }
    });
</script>
@endsection
