<?php

namespace App\Services;

use App\Exceptions\RegleEvaluationValidationException;

class RegleEvaluationValidationService
{
    const MIN_CRITERES = 5;
    const TOTAL_PONDERATION = 100;
    const ECHELLE_MIN = 1;
    const ECHELLE_MAX = 5;
    
    const CATEGORIES_VALIDES = [
        'Compétences techniques',
        'Soft skills',
        'Leadership',
        'Performance',
        'Innovation',
        'Travail d\'équipe',
        'Autonomie',
        'Résolution de problèmes',
    ];
    
    /**
     * Valider la structure complète des critères
     */
    public function validateCriteres(array $criteres): void
    {
        $this->validateMinimumCriteres($criteres);
        $this->validatePonderations($criteres);
        
        foreach ($criteres as $index => $critere) {
            $this->validateCritereStructure($critere, $index);
        }
    }
    
    /**
     * Valider le nombre minimum de critères
     */
    public function validateMinimumCriteres(array $criteres): void
    {
        if (count($criteres) < self::MIN_CRITERES) {
            throw new RegleEvaluationValidationException(
                "Une règle d'évaluation doit contenir au minimum " . self::MIN_CRITERES . " critères. " .
                "Actuellement : " . count($criteres) . " critères."
            );
        }
    }
    
    /**
     * Valider que la somme des pondérations = 100%
     */
    public function validatePonderations(array $criteres): void
    {
        $totalPonderation = collect($criteres)->sum('ponderation');
        
        if ($totalPonderation !== self::TOTAL_PONDERATION) {
            throw new RegleEvaluationValidationException(
                "La somme des pondérations doit être égale à 100%. " .
                "Somme actuelle : {$totalPonderation}%"
            );
        }
    }
    
    /**
     * Valider la structure d'un critère individuel
     */
    public function validateCritereStructure(array $critere, int $index): void
    {
        // Champs obligatoires
        $requiredFields = ['nom', 'description', 'ponderation', 'echelle', 'categorie'];
        
        foreach ($requiredFields as $field) {
            if (!isset($critere[$field])) {
                throw new RegleEvaluationValidationException(
                    "Le critère #{$index} est invalide : champ '{$field}' manquant"
                );
            }
        }
        
        // Validation pondération
        if (!is_numeric($critere['ponderation']) || $critere['ponderation'] <= 0) {
            throw new RegleEvaluationValidationException(
                "Le critère #{$index} : la pondération doit être un nombre positif"
            );
        }
        
        // Validation échelle
        if (!isset($critere['echelle']['min']) || !isset($critere['echelle']['max'])) {
            throw new RegleEvaluationValidationException(
                "Le critère #{$index} : échelle invalide (min/max requis)"
            );
        }
        
        if ($critere['echelle']['min'] !== self::ECHELLE_MIN || 
            $critere['echelle']['max'] !== self::ECHELLE_MAX) {
            throw new RegleEvaluationValidationException(
                "Le critère #{$index} : l'échelle doit être de 1 à 5"
            );
        }
        
        // Validation catégorie
        $this->validateCategorie($critere['categorie'], $index);
    }
    
    /**
     * Valider qu'une catégorie est valide
     */
    public function validateCategorie(string $categorie, int $index): void
    {
        if (!in_array($categorie, self::CATEGORIES_VALIDES)) {
            throw new RegleEvaluationValidationException(
                "Le critère #{$index} : catégorie '{$categorie}' invalide. " .
                "Catégories valides : " . implode(', ', self::CATEGORIES_VALIDES)
            );
        }
    }
}
