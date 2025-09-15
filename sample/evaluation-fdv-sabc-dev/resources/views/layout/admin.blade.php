<!DOCTYPE html>
<html lang="fr">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Dashboard Admin - SABC</title>

        <link rel="shortcut icon" href="https://sabc-mediaapp.com/secteur-informel-sabc/favicon.ico">

        <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
        />

        <link
            href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css"
            rel="stylesheet"
        />
        <link
            href="https://cdn.datatables.net/1.13.6/css/dataTables.bootstrap5.min.css"
            rel="stylesheet"
        />
        <link
            href="https://cdn.datatables.net/buttons/2.4.1/css/buttons.bootstrap5.min.css"
            rel="stylesheet"
        />
        <link
            href="https://fonts.googleapis.com/css?family=Montserrat"
            rel="stylesheet"
        />

        <link rel="stylesheet" href="{{ asset('assets/css/style.css') }}">
        
    </head>
    <body class="bg-light">
        <!-- Sidebar -->
        <div class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <img
                    src="{{ asset('assets/img/logo-boisson-du-cameroun.png') }}"
                    alt="Logo Boissons du Cameroun"
                    class="sidebar-logo"
                />
            </div>
            <ul class="sidebar-menu">
                <li>
                    <a href="{{ route('admin.dashboard') }}" class="{{ request()->routeIs('admin.dashboard') ? 'active' : '' }}">
                        <i class="bi bi-speedometer2"></i> Dashboard
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.users.index') }}" class="{{ request()->routeIs('admin.users.*') ? 'active' : '' }}">
                        <i class="bi bi-box-seam"></i> User
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.notes') }}" class="{{ request()->routeIs('admin.notes') ? 'active' : '' }}">
                        <i class="bi bi-file-earmark-text"></i> Rapport
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.notes.result') }}" class="{{ request()->routeIs('admin.notes.result') ? 'active' : '' }}">
                        <i class="bi bi-file-earmark"></i> Rapport Final
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.services.create') }}" class="{{ request()->routeIs('admin.services.*') ? 'active' : '' }}">
                        <i class="bi bi-megaphone"></i> Service
                    </a>
                </li>
                <li>
                    <a href="#" class="{{ request()->routeIs('admin.regions.*') ? 'active' : '' }}">
                        <i class="bi bi-cash-stack"></i> Region
                    </a>
                </li>
                <li>
                    <a href="#" class="{{ request()->routeIs('admin.settings.*') ? 'active' : '' }}">
                        <i class="bi bi-gear"></i> Paramètres
                    </a>
                </li>
                <li>
                    <form action="{{ route('logout') }}" method="POST">
                        @csrf
                        <button type="submit" class="btn btn-link text-dark text-decoration-none w-100 text-start ps-3 py-2">
                            <i class="bi bi-door-open-fill"></i> Déconnexion
                        </button>
                    </form>
                </li>
            </ul>
        </div>

        <!-- Overlay for mobile -->
        <div class="overlay" id="overlay"></div>

        <!-- Main Content -->
        <div class="main-content" id="main-content">
            <!-- Top Navbar -->
            <nav class="navbar navbar-expand-lg bg-light mb-4 d-lg-none">
                <div class="container-fluid">
                    <button class="navbar-toggler" type="button" id="sidebarToggle">
                        <i class="bi bi-list"></i>
                    </button>
                </div>
            </nav>

            <header class="container-fluid bg-light mb-4">
                <div class="row">
                    <div class="offset-11 col-1 pt-3">
                        <div class="profile-menu">
                            <button class="profile-btn btn btn-link text-sabc-red border-0 p-0">
                                <i class="bi bi-person-circle fs-4"></i>
                            </button>
                            
                            <ul class="profile-dropdown">
                                <li>
                                    <a class="dropdown-item" href="{{ route('profile') }}">
                                        <i class="bi bi-gear me-2"></i> Paramètres
                                    </a>
                                </li>
                                <li>
                                    <form action="{{ route('logout') }}" method="POST">
                                        @csrf
                                        <button type="submit" class="dropdown-item">
                                            <i class="bi bi-box-arrow-right me-2"></i> Déconnexion
                                        </button>
                                    </form>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div
                        class="p-3"
                        style="
                            max-width: 300px;
                            margin-left: auto;
                            margin-right: auto;
                        "
                    >
                        <img
                            src="{{ asset('assets/img/logo-boisson-du-cameroun.png') }}"
                            alt="Logo Boissons du Cameroun"
                            class="img-fluid"
                        />
                    </div>
                </div>

                <div class="row mb-3">
                    <div class="col-12">
                        <h1
                            class="fs-2 fw-bold text-sabc-red text-center"
                            style="font-family: 'Montserrat', sans-serif"
                        >
                            ÉVALUATION DE LA FORCE DE VENTE
                        </h1>
                    </div>
                    <div class="col-12">
                        <p
                            class="fs-2 mb-3 text-center"
                            style="font-family: 'Montserrat', sans-serif"
                        >
                            <b>ACTIVITÉS {{ Auth::user()->type }} {{ Auth::user()->surname }} {{  Auth::user()->name }}</b> 
                        </p>
                    </div>
                    @yield('header')
                </div>
            </header>
            @yield('container')
            
        </div>
        <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
        <script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
        <script src="https://cdn.datatables.net/1.13.6/js/dataTables.bootstrap5.min.js"></script>
        <script src="https://cdn.datatables.net/buttons/2.4.1/js/dataTables.buttons.min.js"></script>
        <script src="https://cdn.datatables.net/buttons/2.4.1/js/buttons.bootstrap5.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.53/pdfmake.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.53/vfs_fonts.js"></script>
        <script src="https://cdn.datatables.net/buttons/2.4.1/js/buttons.html5.min.js"></script>
        <script src="https://cdn.datatables.net/buttons/2.4.1/js/buttons.print.min.js"></script>
        <script src="{{ asset('assets/js/script.js') }}"></script>
        @yield('script')
    </body>
</html>