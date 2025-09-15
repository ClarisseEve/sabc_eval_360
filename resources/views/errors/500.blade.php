<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Erreur serveur - SABC Évaluation 360°</title>
    @vite(['resources/css/app.css'])
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@500;600;700&display=swap" rel="stylesheet">
    <style>
        /* Styles inline pour éviter les dépendances */
        .error-page {
            min-height: 100vh;
            background-color: #F5F5F5;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .error-container {
            max-width: 32rem;
            width: 100%;
            text-align: center;
        }
        .error-illustration {
            width: 16rem;
            height: 16rem;
            margin: 0 auto 2rem;
        }
        .error-code {
            font-size: 6rem;
            font-weight: 700;
            font-family: 'Poppins', sans-serif;
            color: #E53E3E;
            margin-bottom: 1rem;
            line-height: 1;
        }
        .error-title {
            font-size: 24px;
            font-weight: 600;
            font-family: 'Poppins', sans-serif;
            color: #1A202C;
            margin-bottom: 1rem;
        }
        .error-message {
            font-size: 16px;
            font-weight: 400;
            font-family: 'Inter', sans-serif;
            color: #9E9E9E;
            margin-bottom: 2rem;
            line-height: 1.6;
        }
        .error-actions {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            justify-content: center;
        }
        @media (min-width: 640px) {
            .error-actions {
                flex-direction: row;
            }
        }
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.75rem 2rem;
            font-size: 1rem;
            font-weight: 500;
            border-radius: 0.375rem;
            text-decoration: none;
            transition: all 0.2s;
            cursor: pointer;
            border: none;
        }
        .btn-primary {
            background-color: #E53E3E;
            color: white;
        }
        .btn-primary:hover {
            background-color: #C53030;
        }
        .btn-outline {
            background-color: white;
            color: #424242;
            border: 1px solid #E0E0E0;
        }
        .btn-outline:hover {
            background-color: #F5F5F5;
            color: #E53E3E;
            border-color: #E53E3E;
        }
        .error-info {
            margin-top: 2rem;
            padding: 1rem;
            background-color: #FFE0B2;
            border-radius: 0.5rem;
            border: 1px solid rgba(255, 152, 0, 0.2);
        }
        .error-info-content {
            display: flex;
            align-items: center;
            justify-content: center;
            color: #424242;
        }
        .error-footer {
            margin-top: 3rem;
            font-size: 0.875rem;
            color: #9E9E9E;
        }
    </style>
</head>
<body>
    <div class="error-page">
        <div class="error-container">
            <!-- Illustration SVG 500 -->
            <div class="error-illustration">
                <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="sabcGradient500" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#E53E3E" stop-opacity="0.1" />
                            <stop offset="100%" stop-color="#FF9800" stop-opacity="0.1" />
                        </linearGradient>
                        <linearGradient id="serverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#FF9800" />
                            <stop offset="100%" stop-color="#E53E3E" />
                        </linearGradient>
                    </defs>
                    <circle cx="200" cy="150" r="120" fill="url(#sabcGradient500)" />
                    <rect x="160" y="80" width="80" height="120" rx="8" fill="url(#serverGradient)" stroke="#C53030" stroke-width="2" />
                    <rect x="170" y="90" width="60" height="40" rx="4" fill="#1A202C" />
                    <line x1="175" y1="100" x2="220" y2="100" stroke="#E53E3E" stroke-width="2" />
                    <line x1="175" y1="110" x2="210" y2="110" stroke="#E53E3E" stroke-width="2" />
                    <line x1="175" y1="120" x2="225" y2="120" stroke="#E53E3E" stroke-width="2" />
                    <circle cx="180" cy="150" r="4" fill="#E53E3E" />
                    <circle cx="200" cy="150" r="4" fill="#FF9800" />
                    <circle cx="220" cy="150" r="4" fill="#E53E3E" />
                    <circle cx="140" cy="100" r="2" fill="#FF9800" />
                    <circle cx="260" cy="110" r="2" fill="#E53E3E" />
                </svg>
            </div>

            <div class="error-code">500</div>
            <h1 class="error-title">Erreur serveur</h1>
            <p class="error-message">
                Une erreur inattendue s'est produite sur nos serveurs. 
                Notre équipe technique a été automatiquement notifiée.
            </p>

            <div class="error-actions">
                <button onclick="window.location.reload()" class="btn btn-primary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                        <path d="M21 3v5h-5"/>
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                        <path d="M8 16H3v5"/>
                    </svg>
                    Actualiser la page
                </button>
                <a href="/" class="btn btn-outline">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9,22 9,12 15,12 15,22"/>
                    </svg>
                    Retour à l'accueil
                </a>
            </div>

            <div class="error-info">
                <div class="error-info-content">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>
                        <path d="M12 9v4"/>
                        <path d="M12 17h.01"/>
                    </svg>
                    <span>Code d'erreur: 500 - Erreur interne du serveur</span>
                </div>
            </div>

            <div class="error-footer">
                SABC Évaluation 360° - Erreur 500
            </div>
        </div>
    </div>
</body>
</html>
