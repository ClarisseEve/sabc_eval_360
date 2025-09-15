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
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        :root {
            --sabc-yellow: #fdc32d;
            --sabc-red: #e83643;
            --sabc-gray: #737474;
        }

        .bg-sabc-red {
            background-color: var(--sabc-red) !important;
        }
        .bg-sabc-yellow {
            background-color: var(--sabc-yellow) !important;
        }
        .bg-sabc-gray {
            background-color: var(--sabc-gray) !important;
        }

        .text-sabc-red {
            color: var(--sabc-red) !important;
        }
        .text-sabc-yellow {
            color: var(--sabc-yellow) !important;
        }
        .text-sabc-gray {
            color: var(--sabc-gray) !important;
        }

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

        .btn-sabc-yellow {
            background-color: var(--sabc-yellow);
            border-color: var(--sabc-yellow);
            color: black;
        }
        .btn-sabc-yellow:hover {
            background-color: #e3ad1e;
            border-color: #e3ad1e;
            color: black;
        }

        .stats-card {
            transition: transform 0.2s;
            border-top: 3px solid var(--sabc-red);
        }
        .stats-card:hover {
            transform: translateY(-5px);
        }

        .metric-value {
            font-size: 1.5rem;
            font-weight: bold;
            color: var(--sabc-red);
        }

        .card-header {
            background-color: white;
            border-bottom: 2px solid var(--sabc-yellow);
        }

        .badge.bg-primary {
            background-color: var(--sabc-red) !important;
        }

        .badge.bg-success {
            background-color: var(--sabc-yellow) !important;
            color: black;
        }

        .nav-link.active {
            background-color: var(--sabc-red) !important;
        }

        .page-item.active .page-link {
            background-color: var(--sabc-red);
            border-color: var(--sabc-red);
        }

        .btn-info {
            background-color: var(--sabc-yellow);
            border-color: var(--sabc-yellow);
            color: black;
        }
        .btn-info:hover {
            background-color: #e3ad1e;
            border-color: #e3ad1e;
            color: black;
        }

        .btn-success {
            background-color: var(--sabc-red);
            border-color: var(--sabc-red);
            color: white;
        }
        .btn-success:hover {
            background-color: #d42331;
            border-color: #d42331;
            color: white;
        }
    </style>
</head>
<body class="bg-light"> 
    <header class="container-fluid bg-light mb-4">
        <div class="row">
            <div class="offset-11 col-1 pt-3">
                <form action="{{ route('logout') }}" method="POST" class="d-inline">
                    @csrf

                    <button
                        type="submit"
                        class="btn btn-link text-sabc-red border-0 p-0"
                    >
                        <i class="bi bi-door-open-fill fs-4"></i>
                    </button>
                </form>
            </div>
        </div>

        <div class="row">
            <div class="p-3" style="max-width: 300px; margin-left: auto; margin-right: auto;">
                <img src="{{asset('assets/img/logo-boisson-du-cameroun.png')}}" alt="Logo Boissons du Cameroun" class="img-fluid">
            </div>
        </div>

        <div class="row mb-3">
            <div class="col-12">
                <h1 class="fs-2 fw-bold text-sabc-red text-center" style="font-family: 'Montserrat', sans-serif;">
                    ÉVALUATION DE LA FORCE DE VENTE
                </h1>
            </div>
        </div>
    </header>
    <!-- Content -->
    @yield('content')

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
    

    @yield('script')

    <!-- <script src="./assets/js/script.js"></script> -->
    <script>
        document.addEventListener("DOMContentLoaded", function() {
            var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        });
    </script>
</body>
</html>