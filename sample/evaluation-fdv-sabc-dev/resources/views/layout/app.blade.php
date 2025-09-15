<!DOCTYPE html>
<html lang="fr">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Dashboard @yield('type') - SABC</title>
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
                        src="{{asset('assets/img/logo-boisson-du-cameroun.png')}}"
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
                @yield('header')
                
            </div>
        </header>

        @yield('container')

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


        @yield('script')
        <script>
            $(document).ready(function () {
                $("#mdTable").DataTable({
                    language: {
                        url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/fr-FR.json",
                    },
                    pageLength: 10,
                    dom: "<'row'<'col-sm-12 col-md-6 mb-3'l><'col-sm-12 col-md-6 mb-3'f>" +
                            "<'col-sm-12 col-md-6 mb-3'B>>"+
                            "<'row'<'col-sm-12'tr>>" +
                        "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
                    buttons: [
                        {
                            extend: "excel",
                            className: "btn btn-danger btn-sm",
                            text: "Excel",
                        },
                        {
                            extend: "csv",
                            className: "btn btn-danger btn-sm",
                            text: "CSV",
                        },
                        {
                            extend: "pdf",
                            className: "btn btn-banger btn-sm",
                            text: "PDF",
                        },
                    ],
                    order: [[0, "asc"]],
                });

                // Gestion des filtres de date
                $("#startDate, #endDate").change(function () {
                    let start = $("#startDate").val();
                    let end = $("#endDate").val();

                    if (start && end) {
                        // Ici, vous pouvez ajouter la logique pour recharger les données
                        // via AJAX en fonction des dates sélectionnées
                    }
                });
            });


            document.addEventListener('DOMContentLoaded', function() {
            const profileBtn = document.querySelector('.profile-btn');
            const profileDropdown = document.querySelector('.profile-dropdown');
            
            // Toggle dropdown
            profileBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                profileDropdown.classList.toggle('show');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', function() {
                profileDropdown.classList.remove('show');
            });
            
            // Prevent dropdown from closing when clicking inside
            profileDropdown.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        });
        </script>
    </body>
</html>
