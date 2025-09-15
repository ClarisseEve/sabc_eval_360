@extends('layout.admin')




@section('container')
<div class="container">
    <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Personnelles</h5>

            <a
                class="btn btn-danger btn-sm"
                href="{{ route('admin.users.create') }}"
            >
                Nouveau Personnel
            </a>
        </div>
        <div class="card-body">
            <div class="table-responsive">
                <table id="pdvTable"  class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>Matricule</th>
                            <th>Name</th>
                            <th>Surname</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($users as $user)
                        <tr>
                            <td>{{ $user->matricule }}</td>
                            <td>{{ $user->name }}</td>
                            <td>{{ $user->surname }}</td>
                            <td>{{ $user->type }}</td>
                            <td>
                                <span class="badge bg-{{ $user->statut ? 'success' : 'danger' }}">
                                    {{ $user->statut ? 'Active' : 'Inactive' }}
                                </span>
                            </td>
                            <td>
                                <a href="{{ route('admin.users.show', $user->matricule) }}" class="btn btn-sm btn-info">View</a>
                                <a href="{{ route('admin.users.edit', $user->matricule) }}" class="btn btn-sm btn-primary">Edit</a>
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
@endsection