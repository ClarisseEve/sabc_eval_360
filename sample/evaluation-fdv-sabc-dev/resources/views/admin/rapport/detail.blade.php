@extends('layout.admin')


@section('container')
    <div class="container">
        
        <div class="card">
            <div
                class="card-header d-flex justify-content-between align-items-center"
            >
                <h5 class="mb-0">Rapport Final</h5>
            </div>

            <div class="card-body table-responsive-lg">
                <table id="pdvTable" class="table table-striped">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Nom</th>
                            <th>Region</th>
                            <th>Service</th>
                            <th>Type</th>
                            <th>Evaluateur</th>
                            <th>Score</th>
                            <th>Cree le</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($users as $user)
                            @if ($user['type'] !== 'DR' && $user['type'] !== 'CDC TT')
                                @foreach ($user['evaluation'] as $evaluation)                                   
                                    <tr>
                                        <td>{{ $evaluation['code'] }}</td>
                                        <td>{{ $user['name'] }}</td>
                                        <td>{{ $user['region'] }}</td>
                                        <td>{{ $user['service'] }}</td>
                                        <td>{{ $user['type'] }}</td>
                                        <td>{{ $evaluation['creator'] == $user['name'] ? 'Auto Evaluation' : $evaluation['creator']}}</td>
                                        <td>{{ $evaluation['score'] }} / 20</td>
                                        <td>{{ $evaluation['created_at'] }}</td>
                                        <td>
                                            <a href="{{ route('admin.users.note.show', [$user['user_id'], $evaluation['id']]) }}" class="btn btn-sm btn-info">Détails</a>
                                            <a href="{{ route('admin.note.confirm.delete', $evaluation['id']) }}" class="btn btn-sm btn-primary">Supprimer</a>
                                        </td>
                                    </tr>
                                @endforeach
                            @else
                            @endif
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>
@endsection

@section('script')

@endsection