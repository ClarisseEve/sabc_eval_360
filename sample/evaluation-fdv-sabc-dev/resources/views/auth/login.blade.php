<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Evaluation la force de vente</title>

    <link rel="shortcut icon" href="https://sabc-mediaapp.com/secteur-informel-sabc/favicon.ico">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.2/font/bootstrap-icons.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css?family=Montserrat" rel="stylesheet">
    
    <style>
        :root {
            --sabc-yellow: #FDC32D;
            --sabc-red: #E83643;
            --sabc-gray: #737474;
        }

        .bg-sabc-red { background-color: var(--sabc-red) !important; }
        .text-sabc-red { color: var(--sabc-red) !important; }
        .btn-sabc-red {
            background-color: var(--sabc-red);
            border-color: var(--sabc-red);
            color: white;
        }
        .btn-sabc-red:hover {
            background-color: #d42331;
            border-color: #d42331;
            color: white;
        }
        .form-control:focus {
            border-color: var(--sabc-red);
            box-shadow: 0 0 0 0.25rem rgba(232, 54, 67, 0.25);
        }
        .login-container {
            max-width: 500px;
            margin: 0 auto;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body class="bg-light">
    <div class="container vh-100 d-flex align-items-center justify-content-center">
        <div class="login-container bg-white">
            <div class="text-center mb-4">
                <img src="{{ asset('assets/img/logo-boisson-du-cameroun.png') }}" 
                     alt="Logo Boissons du Cameroun" 
                     class="img-fluid mb-3" 
                     style="max-height: 80px;">
                <h2 class="text-sabc-red" style="font-family: 'Montserrat', sans-serif;">
                    ÉVALUATION DE LA FORCE DE VENTE
                </h2>
            </div>

            @if($errors->any())
                <div class="alert alert-danger">
                    @foreach($errors->all() as $error)
                        <p class="mb-0">{{ $error }}</p>
                    @endforeach
                </div>
            @endif

            <form method="POST" action="{{ route('login') }}">
                @csrf
                
                <div class="mb-3">
                    <label for="name" class="form-label">Login</label>
                    <input type="text" 
                           name="name" 
                           id="name" 
                           class="form-control @error('name') is-invalid @enderror" 
                           value="{{ old('name') }}" 
                           required autofocus>
                    @error('name')
                        <div class="invalid-feedback">{{ $message }}</div>
                    @enderror
                </div>

                <div class="mb-4">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" 
                           name="password" 
                           id="password" 
                           class="form-control @error('password') is-invalid @enderror" 
                           required>
                    @error('password')
                        <div class="invalid-feedback">{{ $message }}</div>
                    @enderror
                </div>

                <div class="d-grid">
                    <button type="submit" class="btn btn-sabc-red btn-lg">
                        CONNECTION
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>