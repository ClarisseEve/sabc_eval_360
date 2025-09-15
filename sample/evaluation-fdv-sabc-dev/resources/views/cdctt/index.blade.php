@extends('layout.app')

@section('type' ,  Auth::user()->type )

@section('header')

<div class="col-12">
    <p
        class="fs-1 mb-3 text-center"
        style="font-family: 'Montserrat', sans-serif"
    >
        <b>ACTIVITÉS {{ Auth::user()->type }} {{ Auth::user()->surname }} {{  Auth::user()->name }}</b> 
    </p>
</div>
@endsection

@section('container')
<div class="container">
    <div class="row mb-3">
        <div class="col-md-6 m-auto">
            <div class="card border-0 stats-card">
                <div class="card-body">
                    <p class="mb-0"> <span class="text-sabc-gray">Region :</span> {{ session('user_region')}}</p>
                </div>
            </div>
        </div>
    </div>

    <!-- MD List -->
    <div class="card">
        <div
            class="card-header d-flex justify-content-between align-items-center"
        >
            <h5 class="mb-0">Notes</h5>
            
        </div>
        <div class="card-body">
            <table id="mdTable" class="table table-striped">
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Type</th>
                        <th>Nb Evaluation</th>
                        <th>Note</th>
                        <th>Dernière Evaluation</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($colleagues as $colleague)
                        <tr>
                            <td>{{ $colleague->surname }} {{ $colleague->name }}</td>
                            <td>{{ $colleague->type }}</td>
                            <td>{{ $colleague->evaluation_count ?? 'N/A' }}</td>
                            <td>{{ $colleague->latest_evaluation->total ?? 'N/A' }}</td>
                            <td>{{ $colleague->latest_evaluation->created_at ?? 'N/A' }}</td>
                            <td>
                                <div class="btn-group">
                                    <a href="{{ route('cdctt.csc.note.create' ,$colleague->matricule)}}"
                                        class="btn btn-sm btn-info"
                                    >
                                        <i class="bi bi-eye d-md-none"></i>
                                        <span class="d-none d-md-inline"
                                            >Evaluer</span
                                        >
                                    </a>
                                    <a href="{{ route('cdctt.csc.show' ,$colleague->matricule)}}"
                                        class="btn btn-sm btn-success"
                                    >
                                        <i class="bi bi-eye d-md-none"></i>
                                        <span class="d-none d-md-inline"
                                            >Détails</span
                                        >
                                    </a>
                                </div>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection

@section('script')

@endsection