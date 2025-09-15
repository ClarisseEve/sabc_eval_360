<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Page non trouvée - SABC Évaluation 360°</title>
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
            font-family: 'poppins', sans-serif;
            border-radius: 0.375rem;
            text-decoration: none;
            transition: all 0.2s ease;
            cursor: pointer;
            border: none;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .btn-primary {
            background-color: #E53E3E;
            color: white;
        }
        .btn-primary:hover {
            background-color: #C53030;
            transform: translateY(-1px);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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
            transform: translateY(-1px);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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
            <!-- Illustration SVG 404 -->
            <div class="error-illustration">
                <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="sabcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#E53E3E" stop-opacity="0.1" />
                            <stop offset="100%" stop-color="#FF9800" stop-opacity="0.1" />
                        </linearGradient>
                    </defs>
                    <circle cx="200" cy="150" r="120" fill="url(#sabcGradient)" />
                    <path d="M120 80 L120 140 L160 140 L160 80 L160 200 M120 140 L80 140" stroke="#E53E3E" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                    <ellipse cx="200" cy="140" rx="30" ry="60" stroke="#E53E3E" stroke-width="8" fill="none" />
                    <path d="M280 80 L280 140 L320 140 L320 80 L320 200 M280 140 L240 140" stroke="#E53E3E" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                    <circle cx="100" cy="60" r="4" fill="#FF9800" />
                    <circle cx="300" cy="60" r="4" fill="#FF9800" />
                    <circle cx="80" cy="220" r="3" fill="#E53E3E" />
                    <circle cx="320" cy="220" r="3" fill="#E53E3E" />
                </svg>
            </div>

            <div class="error-code">404</div>
            <h1 class="error-title">Page non trouvée</h1>
            <p class="error-message">
                Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
                Vérifiez l'URL ou retournez à l'accueil.
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

            <div class="error-footer">
                SABC Évaluation 360° - Erreur 404
            </div>
        </div>
    </div>
</body>
</html>
