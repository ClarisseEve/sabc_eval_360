@extends('layout.admin')

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
                            <th>Evaluateur</th>
                            <th>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($users as $user)
                            @if ($user['type'] !== 'DR' && $user['type'] !== 'CDC TT')
                                @php
                                    // Get the latest evaluation
                                    $latestEvaluation = !empty($user['evaluation']) ? collect($user['evaluation'])->first() : null;
                                @endphp

                                <tr>
                                    <td>{{ $user['name'] }}</td>
                                    <td>{{ $user['region'] }}</td>
                                    <td>{{ $user['service'] }}</td>
                                    <td>{{ $user['type'] }}</td>

                                    @if ($latestEvaluation)
                                        <td>{{ $latestEvaluation['creator'] == $user['name'] ? 'Auto' : $latestEvaluation['creator']}}</td>
                                        <td>{{ $latestEvaluation['score'] }} / 20</td>
                                    @else
                                        <td>-</td>
                                        <td>-</td>
                                    @endif
                                </tr>
                            @else
                                <tr>
                                    <td>{{ $user['name'] }}</td>
                                    <td>{{ $user['region'] }}</td>
                                    <td>N/A</td>
                                    <td>{{ $user['type'] }}</td>
                                    <td>-</td>
                                    <td>-</td>
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