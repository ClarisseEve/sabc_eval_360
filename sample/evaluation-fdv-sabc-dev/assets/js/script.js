
$(document).ready(function () {
    $("#pdvTable").DataTable({
        language: {
            url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/fr-FR.json",
        },
        pageLength: 10, // Default number of rows to show
        lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "Tous"]], // Dropdown options
        dom: "<'row'<'col-sm-12 col-md-6 mb-3'l><'col-sm-12 col-md-6 mb-3'f>" +
                "<'col-sm-12 col-md-6 mb-3'B>>"+
                "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        buttons: [
            {
                extend: "excel",
                className: "btn btn-success btn-sm",
                text: "Excel",
            },
            {
                extend: "csv",
                className: "btn btn-success btn-sm",
                text: "CSV",
            },
            {
                extend: "pdf",
                className: "btn btn-danger btn-sm",
                text: "PDF",
            },
        ],
        order: [[0, "desc"]],
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

    // Sidebar toggle functionality
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const overlay = document.getElementById('overlay');
    const sidebarToggle = document.getElementById('sidebarToggle');

    function toggleSidebar() {
        sidebar.classList.toggle('sidebar-expanded');
        overlay.style.display = sidebar.classList.contains('sidebar-expanded') ? 'block' : 'none';
    }

    sidebarToggle.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);

    // Close sidebar when clicking on a menu item on mobile
    const menuItems = document.querySelectorAll('.sidebar-menu li a');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth < 992) {
                toggleSidebar();
            }
        });
    });
});


document.querySelectorAll('.submenu-toggle').forEach(toggle => {
    toggle.addEventListener('click', function(e) {
        e.preventDefault();
        const submenu = this.nextElementSibling;
        const parentItem = this.parentElement;
        
        // Close other open submenus first
        document.querySelectorAll('.submenu.active').forEach(menu => {
            if (menu !== submenu) {
                menu.classList.remove('active');
                menu.previousElementSibling.classList.remove('active');
            }
        });
        
        // Toggle current submenu
        this.classList.toggle('active');
        submenu.classList.toggle('active');
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
