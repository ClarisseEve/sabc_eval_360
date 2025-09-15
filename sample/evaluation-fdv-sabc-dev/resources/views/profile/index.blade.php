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
        <div class="col-md-6  mb-3">
            <div class="card border-0 stats-card ">
                <div class="card-body text-center ">
                    <a href="{{ route('password') }}" class="btn btn-danger btn-sm w-100 h-100 text-uppercase">
                        Changer de Mot de passe
                    </a>
                </div>
            </div>
        </div>
        <div class="col-md-6  mb-3">
            <div class="card border-0 stats-card ">
                <div class="card-body text-center ">
                    <a href="{{ route('password.default') }}" class="btn btn-danger btn-sm w-100 h-100 text-uppercase">
                        Mot de passe par Défaut
                    </a>
                </div>
            </div>
        </div>
    </div>

    <!-- info psv -->
    <div class="card mb-3">
        <div class="card-header d-flex justify-content-between">
            <h5 class="card-title">
                <a href="{{ $link }}" class="btn btn-outline-secondary">
                    <i class="bi bi-arrow-left"></i> 
                    Accueil
                </a> 
           </h5>
        </div>
        <div class="card-body">  
            @if(session('success'))
                <div class="alert alert-success">
                    {{ session('success') }}
                </div>
            @endif 
            <div class="mb-3 row">
                <div class="col-12 col-md-3"><label for="fld-login" class="form-label">Matricule</label></div>
                <div class="col-12 col-md-9"><input type="text" class="form-control" id="fld-login" name="fld-login" value="{{ $user->matricule }}" readonly/></div>
            </div>  
            <div class="mb-3 row">
                <div class="col-12 col-md-3"><label for="fld-login" class="form-label">Login</label></div>
                <div class="col-12 col-md-9"><input type="text" class="form-control" id="fld-login" name="fld-login" value="{{ $user->login }}" readonly/></div>
            </div>
            <div class="mb-3 row">
                <div class="col-12 col-md-3"><label for="fld-login" class="form-label">Prénom</label></div>
                <div class="col-12 col-md-9"><input type="text" class="form-control" id="fld-login" name="fld-login" value="{{ $user->surname }}" readonly/></div>
            </div>
            <div class="mb-3 row">
                <div class="col-12 col-md-3"><label for="fld-lastname" class="form-label">Nom</label></div>
                <div class="col-12 col-md-9">
                    <input type="text" class="form-control" id="fld-lastname" name="fld-lastname" value="{{ $user->name }}" readonly/>
                </div>
            </div>
            <div class="mb-3 row">
                <div class="col-12 col-md-3"><label for="fld-fk_usertype" class="form-label">Type</label></div>
                <div class="col-12 col-md-9">
                    <input type="text" class="form-control" id="fld-fk_usertype" name="fld-fk_usertype" value="{{ $user->type }}" readonly/>
                </div>
            </div>
            <div class="mb-3 row">
                <div class="col-12 col-md-3"><label for="fld-fk_service" class="form-label">Service</label></div>
                <div class="col-12 col-md-9">
                    <input type="text" class="form-control" id="fld-fk_service" name="fld-fk_service" value={{ $user->service[0]->sce_ccial ?? '-'}} readonly/>

                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@section('script')

@endsection