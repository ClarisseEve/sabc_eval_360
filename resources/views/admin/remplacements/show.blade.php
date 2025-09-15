@extends('layouts.app')

@section('title', 'Détails du remplacement')

@section('content')
<div class="container-fluid px-4">
    <h1 class="mt-4">Détails du remplacement</h1>
    
    <div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
            <div>
                <i class="fas fa-exchange-alt me-1"></i>
                Informations du remplacement
            </div>
            <div>
                @if($remplacement->est_actif)
                    @if($remplacement->date_debut > date('Y-m-d'))
                        <a href="{{ route('admin.remplacements.edit', $remplacement->id_remplacement) }}" class="btn btn-warning btn-sm">
                            <i class="fas fa-edit"></i> Modifier
                        </a>
                    @endif
                    <button type="button" class="btn btn-danger btn-sm" data-bs-toggle="modal" data-bs-target="#terminerModal">
                        <i class="fas fa-times"></i> {{ $remplacement->date_debut > date('Y-m-d') ? 'Annuler' : 'Terminer' }}
                    </button>
                @endif
            </div>
        </div>
        <div class="card-body">
            @if(session('success'))
                <div class="alert alert-success">
                    {{ session('success') }}
                </div>
            @endif
            
            @if(session('error'))
                <div class="alert alert-danger">
                    {{ session('error') }}
                </div>
            @endif
            
            <div class="row">
                <div class="col-md-6">
                    <div class="card mb-4">
                        <div class="card-header bg-danger text-white">
                            <i class="fas fa-user-tie me-1"></i> Titulaire remplacé
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Nom complet:</div>
                                <div class="col-md-8">{{ $remplacement->titulaire->nom }} {{ $remplacement->titulaire->prenom }}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Matricule:</div>
                                <div class="col-md-8">{{ $remplacement->titulaire->matricule }}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Rôle:</div>
                                <div class="col-md-8">{{ $remplacement->role_remplace }}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Région:</div>
                                <div class="col-md-8">{{ $remplacement->region_remplacement }}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Service:</div>
                                <div class="col-md-8">{{ $remplacement->service_remplacement ?: 'Non spécifié' }}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Statut actuel:</div>
                                <div class="col-md-8">
                                    @if($remplacement->titulaire->estIndisponible())
                                        <span class="badge bg-danger">Indisponible</span>
                                    @else
                                        <span class="badge bg-success">Disponible</span>
                                    @endif
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card mb-4">
                        <div class="card-header bg-success text-white">
                            <i class="fas fa-user-plus me-1"></i> Remplaçant temporaire
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Nom complet:</div>
                                <div class="col-md-8">{{ $remplacement->remplacant->nom }} {{ $remplacement->remplacant->prenom }}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Matricule:</div>
                                <div class="col-md-8">{{ $remplacement->remplacant->matricule }}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Rôle d'origine:</div>
                                <div class="col-md-8">{{ $remplacement->remplacant->role->nom_role }}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Région d'origine:</div>
                                <div class="col-md-8">{{ $remplacement->remplacant->region->nom_region }}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Statut actuel:</div>
                                <div class="col-md-8">
                                    @if($remplacement->remplacant->estRemplacantActif())
                                        <span class="badge bg-warning">Remplaçant actif</span>
                                    @else
                                        <span class="badge bg-success">Normal</span>
                                    @endif
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card mb-4">
                <div class="card-header">
                    <i class="fas fa-calendar-alt me-1"></i> Période et informations
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Date de début:</div>
                                <div class="col-md-8">{{ \Carbon\Carbon::parse($remplacement->date_debut)->format('d/m/Y') }}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Date de fin prévue:</div>
                                <div class="col-md-8">
                                    @if($remplacement->date_fin)
                                        {{ \Carbon\Carbon::parse($remplacement->date_fin)->format('d/m/Y') }}
                                    @else
                                        <span class="badge bg-warning">Indéterminée</span>
                                    @endif
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Date de fin effective:</div>
                                <div class="col-md-8">
                                    @if($remplacement->date_fin_effective)
                                        {{ \Carbon\Carbon::parse($remplacement->date_fin_effective)->format('d/m/Y') }}
                                    @else
                                        <span class="badge bg-secondary">Non terminé</span>
                                    @endif
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Durée prévue:</div>
                                <div class="col-md-8">{{ $remplacement->duree_prevue_jours }} jours</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Motif:</div>
                                <div class="col-md-8">{{ $remplacement->motif }}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Statut:</div>
                                <div class="col-md-8">
                                    @if(!$remplacement->est_actif)
                                        <span class="badge bg-secondary">Terminé</span>
                                    @elseif($remplacement->date_debut > date('Y-m-d'))
                                        <span class="badge bg-warning">Planifié</span>
                                    @else
                                        <span class="badge bg-success">Actif</span>
                                    @endif
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Créé par:</div>
                                <div class="col-md-8">{{ $remplacement->admin_createur }}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Créé le:</div>
                                <div class="col-md-8">{{ \Carbon\Carbon::parse($remplacement->created_at)->format('d/m/Y H:i') }}</div>
                            </div>
                            @if($remplacement->admin_terminateur)
                                <div class="row mb-3">
                                    <div class="col-md-4 fw-bold">Terminé par:</div>
                                    <div class="col-md-8">{{ $remplacement->admin_terminateur }}</div>
                                </div>
                            @endif
                        </div>
                    </div>
                </div>
            </div>
            
            @if($remplacement->est_actif && count($remplacement->titulaire->subordonnes) > 0)
                <div class="card mb-4">
                    <div class="card-header">
                        <i class="fas fa-users me-1"></i> Équipe supervisée
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-bordered table-striped">
                                <thead class="table-dark">
                                    <tr>
                                        <th>Matricule</th>
                                        <th>Nom</th>
                                        <th>Prénom</th>
                                        <th>Rôle</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach($remplacement->titulaire->subordonnes as $subordonne)
                                        <tr>
                                            <td>{{ $subordonne->matricule }}</td>
                                            <td>{{ $subordonne->nom }}</td>
                                            <td>{{ $subordonne->prenom }}</td>
                                            <td>{{ $subordonne->role->nom_role }}</td>
                                        </tr>
                                    @endforeach
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            @endif
            
            <div class="d-flex justify-content-between">
                <a href="{{ route('admin.remplacements.index') }}" class="btn btn-secondary">
                    <i class="fas fa-arrow-left me-1"></i> Retour à la liste
                </a>
            </div>
            
            <!-- Modal pour terminer le remplacement -->
            @if($remplacement->est_actif)
                <div class="modal fade" id="terminerModal" tabindex="-1" aria-labelledby="terminerModalLabel" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <form action="{{ route('admin.remplacements.terminer', $remplacement->id_remplacement) }}" method="POST">
                                @csrf
                                <div class="modal-header">
                                    <h5 class="modal-title" id="terminerModalLabel">
                                        {{ $remplacement->date_debut > date('Y-m-d') ? 'Annuler' : 'Terminer' }} le remplacement
                                    </h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div class="modal-body">
                                    @if($remplacement->date_debut > date('Y-m-d'))
                                        <p>Êtes-vous sûr de vouloir annuler ce remplacement planifié ?</p>
                                    @else
                                        <p>Êtes-vous sûr de vouloir terminer ce remplacement ?</p>
                                        
                                        <div class="mb-3">
                                            <label for="date_fin_effective" class="form-label">Date de fin effective</label>
                                            <input type="date" class="form-control" id="date_fin_effective" name="date_fin_effective" value="{{ date('Y-m-d') }}">
                                        </div>
                                    @endif
                                    
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="confirmation" name="confirmation" required>
                                        <label class="form-check-label" for="confirmation">
                                            Je confirme {{ $remplacement->date_debut > date('Y-m-d') ? 'l\'annulation' : 'la fin' }} de ce remplacement
                                        </label>
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                                    <button type="submit" class="btn btn-danger">
                                        {{ $remplacement->date_debut > date('Y-m-d') ? 'Annuler' : 'Terminer' }} le remplacement
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            @endif
        </div>
    </div>
</div>
@endsection
