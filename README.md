# SABC - Évaluation 360°

Application d'évaluation 360° pour SABC (Sucreries et Aliments du Bénin et du Congo).

## 🚀 Technologies

- **Backend**: Laravel 12
- **Frontend**: React 19 + TypeScript + Inertia.js
- **Base de données**: MySQL/PostgreSQL
- **CSS**: Tailwind CSS
- **Outils**: Vite, ESLint, Prettier

## 📦 Prérequis

- PHP 8.2+
- Node.js 18+
- Composer 2.5+
- PNPM 10+
- MySQL 8.0+ ou PostgreSQL 15+

## 🛠️ Installation

1. Cloner le dépôt
2. Installer les dépendances PHP :
   ```bash
   composer install
   ```
3. Installer les dépendances Node :
   ```bash
   pnpm install
   ```
4. Copier le fichier `.env.example` vers `.env`
5. Générer la clé d'application :
   ```bash
   php artisan key:generate
   ```
6. Configurer la base de données dans `.env`
7. Exécuter les migrations :
   ```bash
   php artisan migrate
   ```
8. Lancer le serveur de développement :
   ```bash
   pnpm run dev
   ```

## 🧪 Tests

```bash
# Tests PHP
php artisan test

# Tests JavaScript
pnpm test
```

## 📄 Licence

Propriétaire - SABC 2024
