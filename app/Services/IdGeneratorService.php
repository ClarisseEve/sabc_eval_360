<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Service de génération d'identifiants cohérents pour les entités SABC
 * 
 * Conforme aux règles métier SABC pour la gestion des identifiants
 */
class IdGeneratorService
{
    /**
     * Préfixes pour les différentes entités
     */
    const PREFIXES = [
        'utilisateurs' => 'US',
        'evaluations' => 'EV',
        'notifications' => 'NT',
        'notifications_utilisateurs' => 'NU',
        'logs_administration' => 'LG',
        'remplacements_temporaires' => 'RP',
        'regles_evaluation' => 'RE',
        'periodes_evaluation' => 'PE',
        'branches' => 'BR',
        'regions' => 'RG',
        'roles' => 'RL',
        'services_commerciaux' => 'SC',
        'districts' => 'DT',
        'secteurs' => 'ST',
        'type_evaluations' => 'TE',
    ];
    
    /**
     * Identifiants statiques pour les branches (nombre fixe de 3)
     */
    const STATIC_BRANCH_IDS = [
        'commerciale' => 'BR-01',
        'marketing' => 'BR-02',
        'support' => 'BR-03'
    ];
    
    /**
     * Tables et leurs configurations d'identifiants
     */
    const ID_CONFIG = [
        'regions' => [
            'id_field' => 'id_region',
            'format' => 'XX', // Format spécial pour les régions: RG-XX (max 10 régions au Cameroun)
            'max_value' => 10,
            'is_static' => false
        ],
        'branches' => [
            'id_field' => 'id_branche',
            'format' => 'XX',
            'is_static' => true // Les branches sont statiques (3 branches fixes)
        ],
        'roles' => [
            'id_field' => 'id_role',
            'format' => 'XX'
        ],
        'services_commerciaux' => [
            'id_field' => 'id_service',
            'format' => 'XX'
        ],
        'districts' => [
            'id_field' => 'id_district',
            'format' => 'XX'
        ],
        'secteurs' => [
            'id_field' => 'id_secteur',
            'format' => 'XX' // Format court standardisé
        ],
        'evaluations' => [
            'id_field' => 'id_evaluation',
            'format' => 'XX' // Format court standardisé
        ],
        'remplacements_temporaires' => [
            'id_field' => 'id_remplacement',
            'format' => 'XX'
        ],
        'regles_evaluation' => [
            'id_field' => 'id_regle',
            'format' => 'XX'
        ],
        'periodes_evaluation' => [
            'id_field' => 'id_periode',
            'format' => 'XX'
        ],
        'notifications' => [
            'id_field' => 'id_notification',
            'format' => 'XXX' // Potentiellement beaucoup de notifications
        ],
        'logs_administration' => [
            'id_field' => 'id_log',
            'format' => 'XXX' // Potentiellement beaucoup de logs
        ],
        'type_evaluations' => [
            'id_field' => 'id_type',
            'format' => 'XX'
        ],
        'notifications_utilisateurs' => [
            'id_field' => 'id_notification',
            'format' => 'XXX'
        ],
    ];
    
    /**
     * Longueur des identifiants numériques (sans préfixe)
     */
    const ID_LENGTH = 5;
    
    /**
     * Génère un matricule unique pour un utilisateur
     * 
     * @param string $role Rôle de l'utilisateur (optionnel)
     * @param string $region Région de l'utilisateur (optionnel)
     * @return string Matricule au format EX-XXXXX ou personnalisé avec rôle et région
     */
    public function generateUserMatricule(string $role = null, string $region = null): string
    {
        $prefix = self::PREFIXES['utilisateurs'];
        
        // Si un rôle et une région sont fournis, créer un matricule personnalisé
        if ($role && $region) {
            // Pour les régions, extraire uniquement le numéro (ex: "01" de "RG-01")
            $regionNum = '';
            if (preg_match('/RG-([0-9]+)/', $region, $matches)) {
                $regionNum = $matches[1];
            }
            
            // Récupérer le dernier matricule pour cette combinaison rôle/région
            $rolePrefix = substr($role, 0, 3); // Ex: DR, CSC, CDS, etc.
            $searchPattern = $rolePrefix . $regionNum . '%';
            
            $lastMatricule = DB::table('utilisateurs')
                ->where('matricule', 'like', $searchPattern)
                ->orderBy('matricule', 'desc')
                ->value('matricule');
            
            if ($lastMatricule) {
                // Extraire le numéro de séquence à la fin du matricule
                if (preg_match('/' . $rolePrefix . $regionNum . '([0-9]+)/', $lastMatricule, $matches)) {
                    $seqNum = (int)$matches[1] + 1;
                } else {
                    $seqNum = 1;
                }
            } else {
                $seqNum = 1;
            }
            
            // Formater le numéro de séquence sur 3 chiffres
            $seqNumFormatted = str_pad($seqNum, 3, '0', STR_PAD_LEFT);
            
            // Format final: DR01001, CSC01001, etc.
            return $rolePrefix . $regionNum . $seqNumFormatted;
        } else {
            // Utiliser le format standard EX-XXXXX
            // Récupérer le dernier matricule pour ce préfixe
            $lastMatricule = DB::table('utilisateurs')
                ->where('matricule', 'like', $prefix . '-%')
                ->orderBy('matricule', 'desc')
                ->value('matricule');
            
            if ($lastMatricule) {
                // Extraire la partie numérique
                preg_match('/' . $prefix . '-([0-9]+)/', $lastMatricule, $matches);
                if (isset($matches[1])) {
                    $numericPart = (int) $matches[1];
                    $numericPart++;
                } else {
                    $numericPart = 1;
                }
            } else {
                $numericPart = 1;
            }
            
            // Formater le nouveau matricule
            $numericPartFormatted = str_pad($numericPart, self::ID_LENGTH, '0', STR_PAD_LEFT);
            
            return $prefix . '-' . $numericPartFormatted;
        }
    }
    
    /**
     * Génère un identifiant unique pour une évaluation incluant la période
     * 
     * @param string $idPeriode Identifiant de la période d'évaluation (ex: PE-01)
     * @param string|null $evaluateurMatricule Matricule de l'évaluateur (optionnel)
     * @param string|null $evalueMatricule Matricule de l'évalué (optionnel)
     * @return string Identifiant au format EV-PP-XX (PP = code de période, XX = séquence)
     */
    public function generateEvaluationId(string $idPeriode, string $evaluateurMatricule = null, string $evalueMatricule = null): string
    {
        // Extraire le numéro de période (ex: "01" de "PE-01")
        $periodNum = '';
        if (preg_match('/PE-([0-9]+)/', $idPeriode, $matches)) {
            $periodNum = $matches[1];
        } else {
            throw new \InvalidArgumentException("Format d'identifiant de période invalide. Format attendu: PE-XX");
        }
        
        $prefix = self::PREFIXES['evaluation'];
        
        // Récupérer le dernier ID pour cette période spécifique
        $lastId = DB::table('evaluations')
            ->where('id_evaluation', 'like', $prefix . '-' . $periodNum . '-%')
            ->orderBy('id_evaluation', 'desc')
            ->value('id_evaluation');
        
        if ($lastId) {
            // Extraire la partie numérique
            preg_match('/' . $prefix . '-' . $periodNum . '-([0-9]+)/', $lastId, $matches);
            if (isset($matches[1])) {
                $numericPart = (int) $matches[1];
                $numericPart++;
            } else {
                $numericPart = 1;
            }
        } else {
            $numericPart = 1;
        }
        
        // Formater le nouvel ID avec le code de période
        $numericPartFormatted = str_pad($numericPart, 2, '0', STR_PAD_LEFT);
        
        return $prefix . '-' . $periodNum . '-' . $numericPartFormatted;
    }
    
    /**
     * Génère un lot d'identifiants uniques pour les seeders
     * 
     * @param string $table Nom de la table (regions, branches, roles, etc.)
     * @param int $count Nombre d'identifiants à générer
     * @return array Tableau d'identifiants uniques
     */
    public function generateBatchIds(string $table, int $count): array
    {
        $ids = [];
        for ($i = 0; $i < $count; $i++) {
            $ids[] = $this->generateTableId($table);
        }
        return $ids;
    }
    
    /**
     * Obtient un identifiant de branche statique
     * 
     * @param string $brancheName Nom de la branche (commerciale, marketing, support)
     * @return string Identifiant au format BR-XXXXX
     */
    public function getBranchId(string $brancheName): string
    {
        $brancheName = strtolower($brancheName);
        if (!isset(self::STATIC_BRANCH_IDS[$brancheName])) {
            throw new \InvalidArgumentException("Branche non reconnue: $brancheName. Les branches valides sont: commerciale, marketing, support");
        }
        
        return self::STATIC_BRANCH_IDS[$brancheName];
    }
    
    /**
     * Génère un identifiant unique pour n'importe quelle table
     * 
     * @param string $table Nom de la table (regions, branches, roles, etc.)
     * @param string|null $customPrefix Préfixe personnalisé à utiliser à la place du préfixe par défaut
     * @param string|null $specificName Pour les tables avec identifiants statiques, le nom spécifique (ex: 'commerciale' pour branches)
     * @return string Identifiant au format PREFIX-XX ou PREFIX-XXXXX
     */
    public function generateTableId(string $table, ?string $customPrefix = null, ?string $specificName = null): string
    {
        if (!isset(self::ID_CONFIG[$table])) {
            throw new \InvalidArgumentException("Table non configurée: $table");
        }
        
        if (!isset(self::PREFIXES[$table])) {
            throw new \InvalidArgumentException("Préfixe non défini pour la table: $table");
        }
        
        $config = self::ID_CONFIG[$table];
        $prefix = $customPrefix ?? self::PREFIXES[$table];
        
        // Vérifier si la table utilise des identifiants statiques
        if (isset($config['is_static']) && $config['is_static']) {
            // Pour les branches, utiliser les identifiants statiques
            if ($table === 'branches' && $specificName) {
                return $this->getBranchId($specificName);
            }
            throw new \InvalidArgumentException("Table avec identifiants statiques ($table) nécessite un nom spécifique");
        }
        
        $idField = $config['id_field'];
        $format = $config['format'];
        
        // Récupérer le dernier ID pour cette table
        $lastId = DB::table($table)
            ->where($idField, 'like', $prefix . '-%')
            ->orderBy($idField, 'desc')
            ->value($idField);
        
        if ($lastId) {
            // Extraire la partie numérique
            preg_match('/' . $prefix . '-([0-9]+)/', $lastId, $matches);
            if (isset($matches[1])) {
                $numericPart = (int) $matches[1];
                $numericPart++;
            } else {
                $numericPart = 1;
            }
        } else {
            $numericPart = 1;
        }
        
        // Vérifier si on a atteint la valeur maximale (pour les régions)
        if (isset($config['max_value']) && $numericPart > $config['max_value']) {
            throw new \RuntimeException("Nombre maximum d'identifiants atteint pour la table: $table");
        }
        
        // Formater le nouvel ID selon le format spécifié
        $numericPartFormatted = str_pad($numericPart, strlen($format), '0', STR_PAD_LEFT);
        
        return $prefix . '-' . $numericPartFormatted;
    }
    
    /**
     * Génère un identifiant unique pour n'importe quelle entité
     * 
     * @param string $entityType Type d'entité (user, evaluation, competence, etc.)
     * @return string Identifiant au format PREFIX-XXXXXX
     */
    public function generateGenericId(string $entityType): string
    {
        if (!isset(self::PREFIXES[$entityType])) {
            throw new \InvalidArgumentException("Type d'entité non reconnu: $entityType");
        }
        
        $prefix = self::PREFIXES[$entityType];
        $randomPart = strtoupper(Str::random(3));
        $timestamp = date('ymd'); // Format année-mois-jour (2 chiffres chacun)
        
        return $prefix . '-' . $timestamp . '-' . $randomPart;
    }
}
