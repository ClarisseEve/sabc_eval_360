<?php

namespace App\Services;

use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class TemplateStructureValidator
{
    /**
     * Sections prédéfinies autorisées
     */
    private const SECTIONS_PREDEFINIES = [
        'objectifs',
        'competences',
        'developpement',
        'leadership',
        'technique',
        'soft_skills',
        'resultats',
    ];
    
    /**
     * Types de champs autorisés
     */
    private const TYPES_CHAMPS = [
        'text',
        'textarea',
        'number',
        'rating',
        'select',
        'checkbox',
    ];
    
    /**
     * Valider la structure complète d'un template
     * 
     * @param array $structure
     * @throws ValidationException
     * @return bool
     */
    public function validateStructure(array $structure): bool
    {
        // Vérifier que la structure contient des sections
        if (!isset($structure['sections']) || !is_array($structure['sections'])) {
            throw ValidationException::withMessages([
                'structure' => 'La structure doit contenir un tableau de sections'
            ]);
        }
        
        // Minimum 1 section
        if (count($structure['sections']) < 1) {
            throw ValidationException::withMessages([
                'sections' => 'Le template doit contenir au moins 1 section'
            ]);
        }
        
        // Maximum 10 sections
        if (count($structure['sections']) > 10) {
            throw ValidationException::withMessages([
                'sections' => 'Le template ne peut pas contenir plus de 10 sections'
            ]);
        }
        
        // Valider chaque section
        foreach ($structure['sections'] as $index => $section) {
            $this->validateSection($section, $index);
        }
        
        return true;
    }
    
    /**
     * Valider une section individuelle
     * 
     * @param array $section
     * @param int $index
     * @throws ValidationException
     * @return void
     */
    public function validateSection(array $section, int $index): void
    {
        // Champs requis
        $requiredFields = ['id', 'nom', 'ordre', 'champs'];
        foreach ($requiredFields as $field) {
            if (!isset($section[$field])) {
                throw ValidationException::withMessages([
                    "sections.{$index}.{$field}" => "Le champ {$field} est requis pour la section"
                ]);
            }
        }
        
        // Valider l'ID
        if (!is_string($section['id']) || empty($section['id'])) {
            throw ValidationException::withMessages([
                "sections.{$index}.id" => "L'ID de la section doit être une chaîne non vide"
            ]);
        }
        
        // Valider le nom
        if (!is_string($section['nom']) || empty($section['nom'])) {
            throw ValidationException::withMessages([
                "sections.{$index}.nom" => "Le nom de la section doit être une chaîne non vide"
            ]);
        }
        
        // Valider l'ordre
        if (!is_int($section['ordre']) || $section['ordre'] < 1) {
            throw ValidationException::withMessages([
                "sections.{$index}.ordre" => "L'ordre de la section doit être un entier positif"
            ]);
        }
        
        // Valider les champs
        if (!is_array($section['champs'])) {
            throw ValidationException::withMessages([
                "sections.{$index}.champs" => "Les champs doivent être un tableau"
            ]);
        }
        
        // Minimum 1 champ par section
        if (count($section['champs']) < 1) {
            throw ValidationException::withMessages([
                "sections.{$index}.champs" => "La section doit contenir au moins 1 champ"
            ]);
        }
        
        // Valider chaque champ
        foreach ($section['champs'] as $champIndex => $champ) {
            $this->validateChamp($champ, $index, $champIndex);
        }
    }
    
    /**
     * Valider un champ individuel
     * 
     * @param array $champ
     * @param int $sectionIndex
     * @param int $champIndex
     * @throws ValidationException
     * @return void
     */
    public function validateChamp(array $champ, int $sectionIndex, int $champIndex): void
    {
        // Champs requis
        $requiredFields = ['id', 'label', 'type'];
        foreach ($requiredFields as $field) {
            if (!isset($champ[$field])) {
                throw ValidationException::withMessages([
                    "sections.{$sectionIndex}.champs.{$champIndex}.{$field}" => 
                        "Le champ {$field} est requis"
                ]);
            }
        }
        
        // Valider le type
        if (!in_array($champ['type'], self::TYPES_CHAMPS)) {
            throw ValidationException::withMessages([
                "sections.{$sectionIndex}.champs.{$champIndex}.type" => 
                    "Type de champ invalide. Types autorisés : " . implode(', ', self::TYPES_CHAMPS)
            ]);
        }
        
        // Validation spécifique pour rating
        if ($champ['type'] === 'rating') {
            if (!isset($champ['min']) || !isset($champ['max'])) {
                throw ValidationException::withMessages([
                    "sections.{$sectionIndex}.champs.{$champIndex}" => 
                        "Les champs de type 'rating' doivent avoir min et max"
                ]);
            }
            
            // Vérifier que min < max
            if ($champ['min'] >= $champ['max']) {
                throw ValidationException::withMessages([
                    "sections.{$sectionIndex}.champs.{$champIndex}" => 
                        "La valeur min doit être inférieure à max"
                ]);
            }
        }
        
        // Validation spécifique pour select
        if ($champ['type'] === 'select') {
            if (!isset($champ['options']) || !is_array($champ['options']) || empty($champ['options'])) {
                throw ValidationException::withMessages([
                    "sections.{$sectionIndex}.champs.{$champIndex}" => 
                        "Les champs de type 'select' doivent avoir un tableau d'options non vide"
                ]);
            }
        }
    }
    
    /**
     * Valider que le template contient le nombre minimum de critères
     * 
     * @param array $structure
     * @param int $minimum
     * @throws ValidationException
     * @return bool
     */
    public function validateMinimumCriteres(array $structure, int $minimum = 5): bool
    {
        $totalChamps = 0;
        
        if (isset($structure['sections']) && is_array($structure['sections'])) {
            foreach ($structure['sections'] as $section) {
                if (isset($section['champs']) && is_array($section['champs'])) {
                    $totalChamps += count($section['champs']);
                }
            }
        }
        
        if ($totalChamps < $minimum) {
            throw ValidationException::withMessages([
                'structure' => "Le template doit contenir au moins {$minimum} critères d'évaluation"
            ]);
        }
        
        return true;
    }
    
    /**
     * Vérifier si une section est prédéfinie
     * 
     * @param string $sectionType
     * @return bool
     */
    public function isSectionPredefinie(string $sectionType): bool
    {
        return in_array(strtolower($sectionType), self::SECTIONS_PREDEFINIES);
    }
    
    /**
     * Obtenir la liste des sections prédéfinies
     * 
     * @return array
     */
    public function getSectionsPredefinies(): array
    {
        return self::SECTIONS_PREDEFINIES;
    }
    
    /**
     * Obtenir la liste des types de champs autorisés
     * 
     * @return array
     */
    public function getTypesChamps(): array
    {
        return self::TYPES_CHAMPS;
    }
}
