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

<div class="col-12">
    <p
        class="fs-1 mb-3 text-center text-uppercase"
        style="font-family: 'Montserrat', sans-serif"
    >
        <b>ACTIVITÉS {{ $user->type }} {{ $user->surname }} {{ $user->name }}</b> 
    </p>
</div>

@endsection


@section('container')
<div class="container">
    <div class="row mb-3">
        <div class="col-md-2  mb-3">
            <div class="card border-0 stats-card">
                <div class="card-body text-center">
                    <a href="{{ route('csc.dashboard') }}" class="text-decoration-none text-sabc-gray">
                        <i class="bi bi-arrow-left"></i> Retour
                    </a>
                </div>
            </div>
        </div>
        <div class="col-md-5">
            <div class="card border-0 stats-card">
                <div class="card-body">
                    <p class="mb-0"> <span class="text-sabc-gray">Service commercial :</span> {{ json_decode($user->service)[0]->sce_ccial }}</p>
                </div>
            </div>
        </div>
        <div class="col-md-5">
            <div class="card border-0 stats-card">
                <div class="card-body">
                    <p class="mb-0">Region : <span class="text-sabc-gray"> {{ $region }} </span></p>
                </div>
            </div>
        </div>
    </div>
    
    <div class="card">
        <div
            class="card-header d-flex justify-content-between align-items-center"
        >
            <h5 class="mb-0">Notes</h5>
            <a
                class="btn btn-danger btn-sm"
                href="{{ route('csc.cds.create' ,$user->matricule)}}"
            >
                Evaluer
            </a>
        </div>
        <div class="card-body">
            <table id="mdTable" class="table table-striped">
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Type</th>
                        <th>Note</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($evaluations as $evaluation)
                        <tr>
                            <td>{{ $evaluation->creator->surname }} {{ $evaluation->creator->name }}</td>
                            <td>{{ $evaluation->creator->type }}</td>
                            <td>{{ $evaluation->total }}</td>
                            <td>{{ $evaluation->created_at->format('d/m/Y H:i') }}</td>
                            <td>
                                <a href="{{ route('csc.cds.note.show', $evaluation->id_note) }}" class="btn btn-sm btn-primary">
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

@section('script')

@endsection