@extends('layout.admin')


@section('container')
<div class="container">
    <div class="card">
        <div
            class="card-header d-flex justify-content-between align-items-center"
        >
            <h5 class="mb-0">Personnelles</h5>

            <a
                class="btn btn-danger btn-sm"
                href="{{ route('admin.users.create') }}"
            >
                Nouveau Personnel
            </a>
        </div>
        <div class="card-body">
            <table id="pdvTable" class="table table-striped">
                <thead>
                    <tr>
                        <th>Matricule</th>
                        <th>Nom</th>
                        <th>Prenom</th>
                        <th>Region</th>
                        <th>Service</th>
                        <th>Type</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($users as $user)
                        <tr>
                            <td>{{ $user->matricule }}</td>
                            <td>{{ $user->name }}</td>
                            <td>{{ $user->surname }}</td>
                            <td>{{ $user->regions}}</td>
                            <td>{{ $user->service->first()->sce_ccial }}</td>
                            <td>{{ $user->type }}</td>
                            <td>
                                <a href="{{ ($user->type !== 'DR' && $user->type !== 'CDC TT') ? route('admin.users.show', $user->matricule) : '#' }}" 
                                class="btn btn-sm btn-sabc-red {{ ($user->type === 'DR' || $user->type === 'CDC TT') ? 'disabled' : '' }}"
                                @if($user->type === 'DR' && $user->type === 'CDC TT') aria-disabled="true" style="pointer-events: none;" @endif>
                                    Détails
                                </a>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection