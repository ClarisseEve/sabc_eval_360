@extends('layout.admin')


@section('container')
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-8 col-lg-6">
                <div class="card shadow-sm">
                    <div class="card-header bg-danger text-white">
                        <h3 class="mb-0 text-center">
                            <i class="bi bi-exclamation-triangle-fill"></i> Confirmation de suppression
                        </h3>
                    </div>
                    <div class="card-body">
                        <div class="alert alert-warning" role="alert">
                            <i class="bi bi-info-circle-fill"></i> Cette action est irréversible. L'évaluation et toutes ses données associées seront définitivement supprimées.
                        </div>

                        <h5 class="mb-3">Détails de l'évaluation à supprimer :</h5>
                        
                        <table class="table table-sm">
                            <tbody>
                                
                                <tr>
                                    <th>Nom évalué :</th>
                                    <td>{{ $note->user->name }} {{ $note->user->surname }}</td>
                                </tr>
                                <tr>
                                    <th>Note d'évaluation :</th>
                                    <td>{{ $note->total }}</td>
                                </tr>
                                <tr>
                                    <th>Date d'évaluation :</th>
                                    <td>{{ $note->created_at->format('d/m/Y') }}</td>
                                </tr>
                                <tr>
                                    <th>Créée par :</th>
                                    <td>{{ $note->creator->name }} {{ $note->creator->surname }}</td>
                                </tr>
                                
                            </tbody>
                        </table>

                        <p class="text-center mt-4 mb-4 fs-5 fw-bold">
                            Êtes-vous sûr de vouloir supprimer cette évaluation ?
                        </p>

                        <div class="d-flex justify-content-center gap-3">
                            <a href="{{ route('admin.notes.result') }}" class="btn btn-secondary">
                                <i class="bi bi-x-circle me-2"></i>Annuler
                            </a>
                            <a href="{{ route('admin.note.delete',$note->id_note) }}" class="btn btn-sm btn-warning">
                                Supprimer 
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection

@section('script')

@endsection