<?php

namespace App\Services;

use App\Models\Utilisateur;
use App\Models\RemplacementTemporaire;
use App\Models\Notification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ReplacementService
{
    /**
     * Crée un nouveau remplacement temporaire
     *
     * @param string $titulaireMatricule Matricule du titulaire à remplacer
     * @param string $remplacantMatricule Matricule du remplaçant
     * @param string $roleRemplace Rôle à remplacer (peut être différent du rôle principal)
     * @param string $regionRemplacement Région concernée
     * @param string $motif Motif du remplacement
     * @param string $dateDebut Date de début du remplacement
     * @param string|null $dateFin Date de fin du remplacement (null si durée indéterminée)
     * @param int $dureePrevueJours Durée prévue en jours (minimum 30)
     * @param string $serviceRemplacement Service concerné (optionnel)
     * @param string $creePar Matricule de l'admin qui crée le remplacement
     * @param string|null $approuvePar Matricule du manager qui approuve (optionnel)
     * @return RemplacementTemporaire|null
     */
    public function creerRemplacement(
        string $titulaireMatricule,
        string $remplacantMatricule,
        string $roleRemplace,
        string $regionRemplacement,
        string $motif,
        string $dateDebut,
        ?string $dateFin,
        int $dureePrevueJours,
        ?string $serviceRemplacement = null,
        string $creePar,
        ?string $approuvePar = null
    ): ?RemplacementTemporaire {
        try {
            DB::beginTransaction();
            
            // Vérifier que le titulaire et le remplaçant existent
            $titulaire = Utilisateur::where('matricule', $titulaireMatricule)->first();
            $remplacant = Utilisateur::where('matricule', $remplacantMatricule)->first();
            
            if (!$titulaire || !$remplacant) {
                throw new \Exception("Titulaire ou remplaçant introuvable");
            }
            
            // Vérifier que le titulaire n'est pas déjà remplacé pour ce rôle
            $remplacementExistant = RemplacementTemporaire::where('titulaire_matricule', $titulaireMatricule)
                ->where('role_remplace', $roleRemplace)
                ->where('est_actif', true)
                ->where(function ($query) use ($dateDebut) {
                    $query->whereNull('date_fin')
                        ->orWhere('date_fin', '>=', $dateDebut);
                })
                ->first();
                
            if ($remplacementExistant) {
                throw new \Exception("Ce titulaire est déjà remplacé pour ce rôle");
            }
            
            // Vérifier que la durée est d'au moins 30 jours
            if ($dureePrevueJours < 30) {
                throw new \Exception("La durée minimale d'un remplacement est de 30 jours");
            }
            
            // Créer le remplacement
            $remplacement = new RemplacementTemporaire([
                'titulaire_matricule' => $titulaireMatricule,
                'remplacant_matricule' => $remplacantMatricule,
                'role_remplace' => $roleRemplace,
                'region_remplacement' => $regionRemplacement,
                'service_remplacement' => $serviceRemplacement,
                'date_debut' => $dateDebut,
                'date_fin' => $dateFin,
                'duree_prevue_jours' => $dureePrevueJours,
                'motif' => $motif,
                'cree_par' => $creePar,
                'approuve_par' => $approuvePar,
                'est_actif' => true,
                'notifications_envoyees' => false,
                'equipe_notifiee' => false,
            ]);
            
            $remplacement->save();
            
            // Mettre à jour le statut du titulaire
            $titulaire->statut = 'Indisponible';
            $titulaire->date_debut_indisponibilite = $dateDebut;
            $titulaire->date_fin_indisponibilite = $dateFin;
            $titulaire->motif_indisponibilite = $motif;
            $titulaire->save();
            
            // Mettre à jour le statut du remplaçant
            $remplacant->statut = 'Support_Actif';
            $remplacant->save();
            
            DB::commit();
            
            return $remplacement;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur lors de la création du remplacement: ' . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Termine un remplacement temporaire
     *
     * @param int $idRemplacement ID du remplacement à terminer
     * @param string|null $dateFin Date de fin effective (null pour utiliser la date du jour)
     * @return bool
     */
    public function terminerRemplacement(int $idRemplacement, ?string $dateFin = null): bool
    {
        try {
            DB::beginTransaction();
            
            $remplacement = RemplacementTemporaire::find($idRemplacement);
            if (!$remplacement) {
                throw new \Exception("Remplacement introuvable");
            }
            
            $dateFin = $dateFin ?? now()->format('Y-m-d');
            
            // Mettre à jour le remplacement
            $remplacement->est_actif = false;
            $remplacement->date_fin_effective = $dateFin;
            $remplacement->save();
            
            // Mettre à jour le statut du titulaire si nécessaire
            $titulaire = Utilisateur::where('matricule', $remplacement->titulaire_matricule)->first();
            if ($titulaire) {
                // Vérifier s'il n'y a plus de remplacements actifs pour ce titulaire
                $autresRemplacements = RemplacementTemporaire::where('titulaire_matricule', $titulaire->matricule)
                    ->where('est_actif', true)
                    ->where('id_remplacement', '!=', $idRemplacement)
                    ->count();
                
                if ($autresRemplacements === 0) {
                    $titulaire->statut = 'Actif';
                    $titulaire->date_fin_indisponibilite = $dateFin;
                    $titulaire->save();
                }
            }
            
            // Mettre à jour le statut du remplaçant si nécessaire
            $remplacant = Utilisateur::where('matricule', $remplacement->remplacant_matricule)->first();
            if ($remplacant) {
                // Vérifier s'il n'y a plus de remplacements actifs pour ce remplaçant
                $autresRemplacements = RemplacementTemporaire::where('remplacant_matricule', $remplacant->matricule)
                    ->where('est_actif', true)
                    ->where('id_remplacement', '!=', $idRemplacement)
                    ->count();
                
                if ($autresRemplacements === 0) {
                    $remplacant->statut = 'Actif';
                    $remplacant->save();
                }
            }
            
            DB::commit();
            
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur lors de la terminaison du remplacement: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Envoie les notifications pour un remplacement
     *
     * @param int $idRemplacement ID du remplacement
     * @param bool $notifierEquipe Notifier l'équipe du titulaire
     * @return bool
     */
    public function envoyerNotifications(int $idRemplacement, bool $notifierEquipe = true): bool
    {
        try {
            $remplacement = RemplacementTemporaire::find($idRemplacement);
            if (!$remplacement) {
                throw new \Exception("Remplacement introuvable");
            }
            
            $titulaire = Utilisateur::where('matricule', $remplacement->titulaire_matricule)->first();
            $remplacant = Utilisateur::where('matricule', $remplacement->remplacant_matricule)->first();
            
            if (!$titulaire || !$remplacant) {
                throw new \Exception("Titulaire ou remplaçant introuvable");
            }
            
            // Notification au titulaire
            $this->creerNotification(
                $titulaire->id_utilisateur,
                "Remplacement temporaire",
                "Vous serez remplacé(e) par {$remplacant->prenom} {$remplacant->nom} à partir du " . 
                Carbon::parse($remplacement->date_debut)->format('d/m/Y') . "."
            );
            
            // Notification au remplaçant
            $this->creerNotification(
                $remplacant->id_utilisateur,
                "Remplacement temporaire",
                "Vous remplacerez {$titulaire->prenom} {$titulaire->nom} à partir du " . 
                Carbon::parse($remplacement->date_debut)->format('d/m/Y') . "."
            );
            
            // Notification au manager du titulaire
            if ($titulaire->id_manager) {
                $this->creerNotification(
                    $titulaire->id_manager,
                    "Remplacement temporaire",
                    "{$titulaire->prenom} {$titulaire->nom} sera remplacé(e) par {$remplacant->prenom} {$remplacant->nom} à partir du " . 
                    Carbon::parse($remplacement->date_debut)->format('d/m/Y') . "."
                );
            }
            
            // Notification à l'équipe du titulaire
            if ($notifierEquipe) {
                $subordonnes = Utilisateur::where('id_manager', $titulaire->id_utilisateur)->get();
                foreach ($subordonnes as $subordonne) {
                    $this->creerNotification(
                        $subordonne->id_utilisateur,
                        "Changement de manager temporaire",
                        "Votre manager {$titulaire->prenom} {$titulaire->nom} sera temporairement remplacé(e) par {$remplacant->prenom} {$remplacant->nom} à partir du " . 
                        Carbon::parse($remplacement->date_debut)->format('d/m/Y') . "."
                    );
                }
                
                $remplacement->equipe_notifiee = true;
            }
            
            $remplacement->notifications_envoyees = true;
            $remplacement->save();
            
            return true;
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi des notifications: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Récupère les remplacements actifs
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getRemplacementsActifs()
    {
        return RemplacementTemporaire::where('est_actif', true)
            ->where(function ($query) {
                $query->where('date_debut', '<=', now())
                    ->where(function ($q) {
                        $q->whereNull('date_fin')
                            ->orWhere('date_fin', '>=', now());
                    });
            })
            ->with(['titulaire', 'remplacant'])
            ->get();
    }
    
    /**
     * Récupère les remplacements à venir
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getRemplacementsAVenir()
    {
        return RemplacementTemporaire::where('est_actif', true)
            ->where('date_debut', '>', now())
            ->with(['titulaire', 'remplacant'])
            ->get();
    }
    
    /**
     * Récupère l'historique des remplacements
     *
     * @param int $limit Nombre de résultats à retourner
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getHistoriqueRemplacements(int $limit = 50)
    {
        return RemplacementTemporaire::where(function ($query) {
                $query->where('est_actif', false)
                    ->orWhere(function ($q) {
                        $q->where('est_actif', true)
                            ->where('date_fin', '<', now());
                    });
            })
            ->with(['titulaire', 'remplacant'])
            ->orderBy('date_fin', 'desc')
            ->limit($limit)
            ->get();
    }
    
    /**
     * Récupère les remplacements pour un utilisateur (titulaire ou remplaçant)
     *
     * @param string $matricule Matricule de l'utilisateur
     * @param bool $actifSeulement Ne retourner que les remplacements actifs
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getRemplacementsPourUtilisateur(string $matricule, bool $actifSeulement = false)
    {
        $query = RemplacementTemporaire::where(function ($q) use ($matricule) {
                $q->where('titulaire_matricule', $matricule)
                    ->orWhere('remplacant_matricule', $matricule);
            })
            ->with(['titulaire', 'remplacant']);
            
        if ($actifSeulement) {
            $query->where('est_actif', true)
                ->where(function ($q) {
                    $q->where('date_debut', '<=', now())
                        ->where(function ($q2) {
                            $q2->whereNull('date_fin')
                                ->orWhere('date_fin', '>=', now());
                        });
                });
        }
        
        return $query->orderBy('date_debut', 'desc')->get();
    }
    
    /**
     * Vérifie si un utilisateur remplace actuellement un autre utilisateur
     *
     * @param string $remplacantMatricule Matricule du remplaçant
     * @param string $titulaireMatricule Matricule du titulaire
     * @return bool
     */
    public function estRemplacantPour(string $remplacantMatricule, string $titulaireMatricule): bool
    {
        return RemplacementTemporaire::where('remplacant_matricule', $remplacantMatricule)
            ->where('titulaire_matricule', $titulaireMatricule)
            ->where('est_actif', true)
            ->where('date_debut', '<=', now())
            ->where(function ($query) {
                $query->whereNull('date_fin')
                    ->orWhere('date_fin', '>=', now());
            })
            ->exists();
    }
    
    /**
     * Crée une notification pour un utilisateur
     *
     * @param int $idDestinataire ID de l'utilisateur destinataire
     * @param string $titre Titre de la notification
     * @param string $message Message de la notification
     * @return Notification|null
     */
    private function creerNotification(int $idDestinataire, string $titre, string $message): ?Notification
    {
        try {
            $notification = new Notification([
                'id_destinataire' => $idDestinataire,
                'titre' => $titre,
                'message' => $message,
                'est_lue' => false,
                'date_creation' => now(),
            ]);
            
            $notification->save();
            
            return $notification;
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création de la notification: ' . $e->getMessage());
            return null;
        }
    }
}
