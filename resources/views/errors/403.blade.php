<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Accès interdit - SABC Évaluation 360°</title>
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
            font-size: 2.25rem;
            font-weight: 700;
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
            background-color: #FED7D7;
            border-radius: 0.5rem;
            border: 1px solid rgba(229, 62, 62, 0.2);
        }
        .error-info-content {
            display: flex;
            align-items: center;
            justify-content: center;
            color: #C53030;
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
            <!-- Illustration SVG 403 -->
            <div class="error-illustration">
                <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="sabcGradient403" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#E53E3E" stop-opacity="0.1" />
                            <stop offset="100%" stop-color="#FF9800" stop-opacity="0.1" />
                        </linearGradient>
                        <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#E53E3E" />
                            <stop offset="100%" stop-color="#C53030" />
                        </linearGradient>
                    </defs>
                    <circle cx="200" cy="150" r="120" fill="url(#sabcGradient403)" />
                    <path d="M200 60 C220 60 240 70 240 90 L240 140 C240 180 220 200 200 220 C180 200 160 180 160 140 L160 90 C160 70 180 60 200 60 Z" fill="url(#shieldGradient)" stroke="#C53030" stroke-width="2" />
                    <circle cx="200" cy="130" r="25" fill="none" stroke="#FFFFFF" stroke-width="4" />
                    <line x1="185" y1="115" x2="215" y2="145" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" />
                    <circle cx="120" cy="80" r="3" fill="#FF9800" />
                    <circle cx="280" cy="80" r="3" fill="#FF9800" />
                    <circle cx="100" cy="200" r="4" fill="#E53E3E" opacity="0.7" />
                    <circle cx="300" cy="200" r="4" fill="#E53E3E" opacity="0.7" />
                </svg>
            </div>

            <div class="error-code">403</div>
            <h1 class="error-title">Accès interdit</h1>
            <p class="error-message">
                Vous n'avez pas les permissions nécessaires pour accéder à cette page.
                Contactez votre administrateur si vous pensez qu'il s'agit d'une erreur.
            </p>

            <div class="error-actions">
                <a href="/" class="btn btn-primary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9,22 9,12 15,12 15,22"/>
                    </svg>
                    Retour à l'accueil
                </a>
                <button onclick="window.history.back()" class="btn btn-outline">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                        <path d="m12 19-7-7 7-7"/>
                        <path d="M19 12H5"/>
                    </svg>
                    Page précédente
                </button>
            </div>

            <div class="error-info">
                <div class="error-info-content">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
                        <path d="m9 12 2 2 4-4"/>
                    </svg>
                    <span>Zone protégée - Authentification requise</span>
                </div>
            </div>

            <div class="error-footer">
                SABC Évaluation 360° - Erreur 403
            </div>
        </div>
    </div>
</body>
</html>
