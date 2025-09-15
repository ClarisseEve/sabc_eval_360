@extends('layout.admin')

@section('header')

<div class="col-12">
    <p
        class="fs-2 mb-3 text-center"
        style="font-family: 'Montserrat', sans-serif"
    >
        <b>ACTIVITÉS {{ Auth::user()->type }} {{ Auth::user()->surname }} {{  Auth::user()->name }}</b> 
    </p>
</div>
@endsection


@section('container')
    <div class="container">
        
        <div class="card">
            <div
                class="card-header d-flex justify-content-between align-items-center"
            >
                <h5 class="mb-0">Détail Note</h5>
            </div>

            <div class="card-body table-responsive-lg">
                <table id="pdvTable" class="table table-striped">
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Region</th>
                            <th>Service</th>
                            <th>Type</th>
                            <th>competence </th>
                            <th>Description</th>
                            <th>score</th>
                            <th>Evaluator</th>
                            <th>statut competence</th>
                            <th>Crée le</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($users as $user)
                            @if ($user['type'] !== 'DR' && $user['type'] !== 'CDC TT')
                                @foreach($user['evaluations'] as $evaluation)
                                    @foreach($evaluation['notes'] as $criterion => $data)
                                        <tr>
                                            <td>{{ $user['surname'] }} {{ $user['name'] }}</td>
                                            <td>{{ $user['region']}}</td>
                                            <td>{{ $user['service']}}</td>
                                            <td>{{ $user['type'] }}</td>
                                            <td>{{ $criterion }}</td>
                                            <td>
                                                {{ $user['label'][$criterion][1][$data - 1] ?? 'No description available' }}
                                            </td>
                                            <td>{{ $data}}/5</td>
                                            <td>{{ $evaluation['creator'] }}</td>
                                            <td>
                                                @if($data >= $user['label'][$criterion][2])
                                                    <span class="text-success fw-bold">
                                                        Acquis 
                                                    </span>
                                                @else
                                                    <span class="text-danger fw-bold">
                                                        Non Acquis 
                                                    </span>
                                                @endif
                                            </td>
                                            <td>{{ $evaluation['created_at'] }}</td>
                                        </tr>
                                    @endforeach
                                @endforeach
                            @else
                                <tr>
                                    <td>{{ $user['name'] }}</td>
                                    <td>{{ $user['region']}}</td>
                                    <td>{{ 'N/A' }}</td>
                                    <td>{{ $user['type'] }}</td>
                                    <td>{{ 'N/A' }}</td>
                                    <td >
                                        {{  'No description available' }}
                                    </td>
                                    <td>{{ 'N/A' }} </td>
                                    <td>{{ 'N/A' }}</td>
                                    <td>{{ 'N/A' }}</td>
                                    <td>
                                        N/A
                                    </td>
                                </tr> 
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