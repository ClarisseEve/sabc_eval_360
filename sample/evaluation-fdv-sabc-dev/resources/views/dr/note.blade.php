@extends('layout.app')

@section('type' ,  Auth::user()->type )


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
        <div class="row mb-3">
            <div class="col-md-2  mb-3">
                <div class="card border-0 stats-card">
                    <div class="card-body text-center">
                        <a href="{{ url()->previous() }}" class="text-decoration-none text-sabc-gray">
                            <i class="bi bi-arrow-left"></i> Retour
                        </a>
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="card border-0 stats-card">
                    <div class="card-body">
                        <p class="mb-0"> <span class="text-sabc-gray">Service commercial :</span> {{ json_decode($evaluation->user->service)[0]->sce_ccial }}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="card border-0 stats-card">
                    <div class="card-body">
                        <p class="mb-0"> <span class="text-sabc-gray">Region :</span> {{ session('user_region') }}</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="card mb-4">
            <div class="card-header bg-sabc-red text-white">
                <h5 class="mb-0">Note</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-4">
                        <p><strong>Name:</strong> {{ $evaluation->user->name }} {{ $evaluation->user->surname }}</p>
                    </div>
                    <div class="col-md-4">
                        <p><strong>Matricule:</strong> {{ $evaluation->user->matricule }}</p>
                    </div>
                    <div class="col-md-4">
                        <p><strong>Type:</strong> {{ $evaluation->user->type }}</p>
                    </div>
                    <div class="col-md-4">
                        <p><strong>Service:</strong> {{ $evaluation->user->service->first()->sce_ccial ?? 'N/A' }}</p>
                    </div>
                    <div class="col-md-4">
                        <p><strong>Total:</strong> {{ $evaluation->total ?? 'N/A' }} / 20</p>
                    </div>
                    <div class="col-md-4">
                        <p><strong>Region:</strong> {{ session('user_region') ?? 'N/A' }}</p>
                    </div>
                    <div class="col-md-4">
                        <p><strong>Evaluation Date:</strong> {{ $evaluation->created_at->format('d/m/Y') }}</p>
                    </div>
                </div>
            </div>
        </div>

        
        <div class="card">
            <div
                class="card-header d-flex justify-content-between align-items-center"
            >
                <h5 class="mb-0">Détail Note</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table id="mdTable" class="table table-bordered">
                        <thead class="table-light">
                            <tr>
    <th width="30%">competence </th>
    <th width="10%">score</th>
    <th width="50%">Description</th>
    <th width="10%">statut competence</th>
</tr>
                        </thead>
                        <tbody>
                            @foreach(json_decode($evaluation->notes, true) as $criterion => $data)
                                
                                <tr>
                                    <td>{{ $criterion }}</td>
                                    <td>{{ $data}}/5</td>
                                    <td class="small">
                                        {{ $labels[$criterion][1][$data - 1] ?? 'No description available' }}
                                    </td>
                                    <td>
                                        @if($data >= $labels[$criterion][2])
                                            <span class="text-success fw-bold">
                                                Acquis 
                                            </span>
                                        @else
                                            <span class="text-danger fw-bold">
                                                Non Acquis 
                                            </span>
                                        @endif
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

@section('script')

@endsection