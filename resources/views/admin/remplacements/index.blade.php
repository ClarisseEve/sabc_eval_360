@extends('layouts.app')

@section('title', 'Gestion des remplacements temporaires')

@section('content')
<div class="container-fluid px-4">
    <h1 class="mt-4">Gestion des remplacements temporaires</h1>
    
    <div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
            <div>
                <i class="fas fa-exchange-alt me-1"></i>
                Remplacements temporaires
            </div>
            <a href="{{ route('admin.remplacements.create') }}" class="btn btn-primary btn-sm">
                <i class="fas fa-plus"></i> Nouveau remplacement
            </a>
        </div>
        <div class="card-body">
            <!-- Onglets -->
            <ul class="nav nav-tabs" id="replacementTabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="active-tab" data-bs-toggle="tab" data-bs-target="#active" type="button" role="tab" aria-controls="active" aria-selected="true">
                        Remplacements actifs <span class="badge bg-danger">{{ count($remplacementsActifs) }}</span>
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="upcoming-tab" data-bs-toggle="tab" data-bs-target="#upcoming" type="button" role="tab" aria-controls="upcoming" aria-selected="false">
                        À venir <span class="badge bg-warning">{{ count($remplacementsAVenir) }}</span>
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="history-tab" data-bs-toggle="tab" data-bs-target="#history" type="button" role="tab" aria-controls="history" aria-selected="false">
                        Historique <span class="badge bg-secondary">{{ count($historiqueRemplacements) }}</span>
                    </button>
                </li>
            </ul>
            
            <!-- Contenu des onglets -->
            <div class="tab-content" id="replacementTabsContent">
                <!-- Remplacements actifs -->
                <div class="tab-pane fade show active" id="active" role="tabpanel" aria-labelledby="active-tab">
                    @if(count($remplacementsActifs) > 0)
                        <div class="table-responsive mt-3">
                            <table class="table table-bordered table-striped">
                                <thead class="table-dark">
                                    <tr>
                                        <th>Titulaire</th>
                                        <th>Remplaçant</th>
                                        <th>Rôle</th>
                                        <th>Région</th>
                                        <th>Début</th>
                                        <th>Fin prévue</th>
                                        <th>Motif</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach($remplacementsActifs as $remplacement)
                                        <tr>
                                            <td>
                                                <strong>{{ $remplacement->titulaire->nom }} {{ $remplacement->titulaire->prenom }}</strong>
                                                <br><small class="text-muted">{{ $remplacement->titulaire->matricule }}</small>
                                            </td>
                                            <td>
                                                <strong>{{ $remplacement->remplacant->nom }} {{ $remplacement->remplacant->prenom }}</strong>
                                                <br><small class="text-muted">{{ $remplacement->remplacant->matricule }}</small>
                                            </td>
                                            <td>{{ $remplacement->role_remplace }}</td>
                                            <td>{{ $remplacement->region_remplacement }}</td>
                                            <td>{{ \Carbon\Carbon::parse($remplacement->date_debut)->format('d/m/Y') }}</td>
                                            <td>
                                                @if($remplacement->date_fin)
                                                    {{ \Carbon\Carbon::parse($remplacement->date_fin)->format('d/m/Y') }}
                                                @else
                                                    <span class="badge bg-warning">Indéterminée</span>
                                                @endif
                                            </td>
                                            <td>{{ $remplacement->motif }}</td>
                                            <td>
                                                <div class="btn-group" role="group">
                                                    <a href="{{ route('admin.remplacements.show', $remplacement->id_remplacement) }}" class="btn btn-sm btn-info">
                                                        <i class="fas fa-eye"></i>
                                                    </a>
                                                    <button type="button" class="btn btn-sm btn-danger" data-bs-toggle="modal" data-bs-target="#terminerModal{{ $remplacement->id_remplacement }}">
                                                        <i class="fas fa-times"></i>
                                                    </button>
                                                </div>
                                                
                                                <!-- Modal pour terminer le remplacement -->
                                                <div class="modal fade" id="terminerModal{{ $remplacement->id_remplacement }}" tabindex="-1" aria-labelledby="terminerModalLabel{{ $remplacement->id_remplacement }}" aria-hidden="true">
                                                    <div class="modal-dialog">
                                                        <div class="modal-content">
                                                            <form action="{{ route('admin.remplacements.terminer', $remplacement->id_remplacement) }}" method="POST">
                                                                @csrf
                                                                <div class="modal-header">
                                                                    <h5 class="modal-title" id="terminerModalLabel{{ $remplacement->id_remplacement }}">Terminer le remplacement</h5>
                                                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                                                </div>
                                                                <div class="modal-body">
                                                                    <p>Êtes-vous sûr de vouloir terminer ce remplacement ?</p>
                                                                    <p><strong>Titulaire :</strong> {{ $remplacement->titulaire->nom }} {{ $remplacement->titulaire->prenom }}</p>
                                                                    <p><strong>Remplaçant :</strong> {{ $remplacement->remplacant->nom }} {{ $remplacement->remplacant->prenom }}</p>
                                                                    
                                                                    <div class="mb-3">
                                                                        <label for="date_fin_effective" class="form-label">Date de fin effective</label>
                                                                        <input type="date" class="form-control" id="date_fin_effective" name="date_fin_effective" value="{{ date('Y-m-d') }}">
                                                                    </div>
                                                                    
                                                                    <div class="form-check">
                                                                        <input class="form-check-input" type="checkbox" id="confirmation" name="confirmation" required>
                                                                        <label class="form-check-label" for="confirmation">
                                                                            Je confirme la fin de ce remplacement
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                                <div class="modal-footer">
                                                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                                                                    <button type="submit" class="btn btn-danger">Terminer le remplacement</button>
                                                                </div>
                                                            </form>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    @endforeach
                                </tbody>
                            </table>
                        </div>
                    @else
                        <div class="alert alert-info mt-3">
                            <i class="fas fa-info-circle"></i> Aucun remplacement actif en cours.
                        </div>
                    @endif
                </div>
                
                <!-- Remplacements à venir -->
                <div class="tab-pane fade" id="upcoming" role="tabpanel" aria-labelledby="upcoming-tab">
                    @if(count($remplacementsAVenir) > 0)
                        <div class="table-responsive mt-3">
                            <table class="table table-bordered table-striped">
                                <thead class="table-dark">
                                    <tr>
                                        <th>Titulaire</th>
                                        <th>Remplaçant</th>
                                        <th>Rôle</th>
                                        <th>Région</th>
                                        <th>Début</th>
                                        <th>Fin prévue</th>
                                        <th>Motif</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach($remplacementsAVenir as $remplacement)
                                        <tr>
                                            <td>
                                                <strong>{{ $remplacement->titulaire->nom }} {{ $remplacement->titulaire->prenom }}</strong>
                                                <br><small class="text-muted">{{ $remplacement->titulaire->matricule }}</small>
                                            </td>
                                            <td>
                                                <strong>{{ $remplacement->remplacant->nom }} {{ $remplacement->remplacant->prenom }}</strong>
                                                <br><small class="text-muted">{{ $remplacement->remplacant->matricule }}</small>
                                            </td>
                                            <td>{{ $remplacement->role_remplace }}</td>
                                            <td>{{ $remplacement->region_remplacement }}</td>
                                            <td>{{ \Carbon\Carbon::parse($remplacement->date_debut)->format('d/m/Y') }}</td>
                                            <td>
                                                @if($remplacement->date_fin)
                                                    {{ \Carbon\Carbon::parse($remplacement->date_fin)->format('d/m/Y') }}
                                                @else
                                                    <span class="badge bg-warning">Indéterminée</span>
                                                @endif
                                            </td>
                                            <td>{{ $remplacement->motif }}</td>
                                            <td>
                                                <div class="btn-group" role="group">
                                                    <a href="{{ route('admin.remplacements.show', $remplacement->id_remplacement) }}" class="btn btn-sm btn-info">
                                                        <i class="fas fa-eye"></i>
                                                    </a>
                                                    <a href="{{ route('admin.remplacements.edit', $remplacement->id_remplacement) }}" class="btn btn-sm btn-warning">
                                                        <i class="fas fa-edit"></i>
                                                    </a>
                                                    <button type="button" class="btn btn-sm btn-danger" data-bs-toggle="modal" data-bs-target="#terminerModal{{ $remplacement->id_remplacement }}">
                                                        <i class="fas fa-times"></i>
                                                    </button>
                                                </div>
                                                
                                                <!-- Modal pour terminer le remplacement -->
                                                <div class="modal fade" id="terminerModal{{ $remplacement->id_remplacement }}" tabindex="-1" aria-labelledby="terminerModalLabel{{ $remplacement->id_remplacement }}" aria-hidden="true">
                                                    <div class="modal-dialog">
                                                        <div class="modal-content">
                                                            <form action="{{ route('admin.remplacements.terminer', $remplacement->id_remplacement) }}" method="POST">
                                                                @csrf
                                                                <div class="modal-header">
                                                                    <h5 class="modal-title" id="terminerModalLabel{{ $remplacement->id_remplacement }}">Annuler le remplacement</h5>
                                                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                                                </div>
                                                                <div class="modal-body">
                                                                    <p>Êtes-vous sûr de vouloir annuler ce remplacement planifié ?</p>
                                                                    <p><strong>Titulaire :</strong> {{ $remplacement->titulaire->nom }} {{ $remplacement->titulaire->prenom }}</p>
                                                                    <p><strong>Remplaçant :</strong> {{ $remplacement->remplacant->nom }} {{ $remplacement->remplacant->prenom }}</p>
                                                                    
                                                                    <div class="form-check">
                                                                        <input class="form-check-input" type="checkbox" id="confirmation" name="confirmation" required>
                                                                        <label class="form-check-label" for="confirmation">
                                                                            Je confirme l'annulation de ce remplacement
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                                <div class="modal-footer">
                                                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                                                                    <button type="submit" class="btn btn-danger">Annuler le remplacement</button>
                                                                </div>
                                                            </form>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    @endforeach
                                </tbody>
                            </table>
                        </div>
                    @else
                        <div class="alert alert-info mt-3">
                            <i class="fas fa-info-circle"></i> Aucun remplacement planifié.
                        </div>
                    @endif
                </div>
                
                <!-- Historique des remplacements -->
                <div class="tab-pane fade" id="history" role="tabpanel" aria-labelledby="history-tab">
                    @if(count($historiqueRemplacements) > 0)
                        <div class="table-responsive mt-3">
                            <table class="table table-bordered table-striped">
                                <thead class="table-dark">
                                    <tr>
                                        <th>Titulaire</th>
                                        <th>Remplaçant</th>
                                        <th>Rôle</th>
                                        <th>Région</th>
                                        <th>Période</th>
                                        <th>Motif</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach($historiqueRemplacements as $remplacement)
                                        <tr>
                                            <td>
                                                <strong>{{ $remplacement->titulaire->nom }} {{ $remplacement->titulaire->prenom }}</strong>
                                                <br><small class="text-muted">{{ $remplacement->titulaire->matricule }}</small>
                                            </td>
                                            <td>
                                                <strong>{{ $remplacement->remplacant->nom }} {{ $remplacement->remplacant->prenom }}</strong>
                                                <br><small class="text-muted">{{ $remplacement->remplacant->matricule }}</small>
                                            </td>
                                            <td>{{ $remplacement->role_remplace }}</td>
                                            <td>{{ $remplacement->region_remplacement }}</td>
                                            <td>
                                                {{ \Carbon\Carbon::parse($remplacement->date_debut)->format('d/m/Y') }}
                                                @if($remplacement->date_fin_effective)
                                                    au {{ \Carbon\Carbon::parse($remplacement->date_fin_effective)->format('d/m/Y') }}
                                                @elseif($remplacement->date_fin)
                                                    au {{ \Carbon\Carbon::parse($remplacement->date_fin)->format('d/m/Y') }}
                                                @endif
                                            </td>
                                            <td>{{ $remplacement->motif }}</td>
                                            <td>
                                                <a href="{{ route('admin.remplacements.show', $remplacement->id_remplacement) }}" class="btn btn-sm btn-info">
                                                    <i class="fas fa-eye"></i>
                                                </a>
                                            </td>
                                        </tr>
                                    @endforeach
                                </tbody>
                            </table>
                        </div>
                    @else
                        <div class="alert alert-info mt-3">
                            <i class="fas fa-info-circle"></i> Aucun historique de remplacement disponible.
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function() {
        // Activer les onglets Bootstrap
        var triggerTabList = [].slice.call(document.querySelectorAll('#replacementTabs button'))
        triggerTabList.forEach(function (triggerEl) {
            var tabTrigger = new bootstrap.Tab(triggerEl)
            triggerEl.addEventListener('click', function (event) {
                event.preventDefault()
                tabTrigger.show()
            })
        })
    });
</script>
@endsection
