@extends('layouts.app')

@section('title', 'Modifier un remplacement temporaire')

@section('content')
<div class="container-fluid px-4">
    <h1 class="mt-4">Modifier un remplacement temporaire</h1>
    
    <div class="card mb-4">
        <div class="card-header">
            <i class="fas fa-exchange-alt me-1"></i>
            Modification du remplacement
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
            
            <form action="{{ route('admin.remplacements.update', $remplacement->id_remplacement) }}" method="POST">
                @csrf
                @method('PUT')
                
                <div class="row mb-4">
                    <div class="col-md-6">
                        <div class="card border-danger">
                            <div class="card-header bg-danger text-white">
                                <i class="fas fa-user-tie me-1"></i> Titulaire à remplacer
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label class="form-label">Titulaire (non modifiable)</label>
                                    <input type="text" class="form-control" value="{{ $remplacement->titulaire->nom }} {{ $remplacement->titulaire->prenom }} ({{ $remplacement->titulaire->matricule }})" readonly>
                                </div>
                                
                                <div class="alert alert-info">
                                    <div class="mb-2"><strong>Rôle:</strong> {{ $remplacement->role_remplace }}</div>
                                    <div class="mb-2"><strong>Région:</strong> {{ $remplacement->region_remplacement }}</div>
                                </div>
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
                                    <label class="form-label">Remplaçant (non modifiable)</label>
                                    <input type="text" class="form-control" value="{{ $remplacement->remplacant->nom }} {{ $remplacement->remplacant->prenom }} ({{ $remplacement->remplacant->matricule }})" readonly>
                                </div>
                                
                                <div class="alert alert-info">
                                    <div class="mb-2"><strong>Rôle actuel:</strong> {{ $remplacement->remplacant->role->nom_role }}</div>
                                    <div class="mb-2"><strong>Région:</strong> {{ $remplacement->remplacant->region->nom_region }}</div>
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
                                    <input type="date" class="form-control" id="date_debut" name="date_debut" value="{{ old('date_debut', $remplacement->date_debut) }}" required>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="date_fin" class="form-label">Date de fin (optionnelle)</label>
                                    <input type="date" class="form-control" id="date_fin" name="date_fin" value="{{ old('date_fin', $remplacement->date_fin) }}">
                                    <div class="form-text">Laissez vide si la date de fin est indéterminée</div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="duree_prevue_jours" class="form-label">Durée prévue (jours)</label>
                                    <input type="number" class="form-control" id="duree_prevue_jours" name="duree_prevue_jours" value="{{ old('duree_prevue_jours', $remplacement->duree_prevue_jours) }}" min="30" required>
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
                                        <option value="Congé maladie" {{ $remplacement->motif == 'Congé maladie' ? 'selected' : '' }}>Congé maladie</option>
                                        <option value="Congé maternité" {{ $remplacement->motif == 'Congé maternité' ? 'selected' : '' }}>Congé maternité</option>
                                        <option value="Congé sabbatique" {{ $remplacement->motif == 'Congé sabbatique' ? 'selected' : '' }}>Congé sabbatique</option>
                                        <option value="Formation longue durée" {{ $remplacement->motif == 'Formation longue durée' ? 'selected' : '' }}>Formation longue durée</option>
                                        <option value="Mission spéciale" {{ $remplacement->motif == 'Mission spéciale' ? 'selected' : '' }}>Mission spéciale</option>
                                        <option value="Absence temporaire" {{ $remplacement->motif == 'Absence temporaire' ? 'selected' : '' }}>Absence temporaire</option>
                                        <option value="Autre" {{ $remplacement->motif == 'Autre' ? 'selected' : '' }}>Autre</option>
                                    </select>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="service_remplacement" class="form-label">Service concerné (optionnel)</label>
                                    <input type="text" class="form-control" id="service_remplacement" name="service_remplacement" value="{{ old('service_remplacement', $remplacement->service_remplacement) }}">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="d-flex justify-content-between">
                    <a href="{{ route('admin.remplacements.show', $remplacement->id_remplacement) }}" class="btn btn-secondary">
                        <i class="fas fa-arrow-left me-1"></i> Retour
                    </a>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save me-1"></i> Enregistrer les modifications
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
