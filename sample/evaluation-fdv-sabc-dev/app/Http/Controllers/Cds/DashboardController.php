<?php

namespace App\Http\Controllers\Cds;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\{User, Notes, Regions};

class DashboardController extends Controller
{
    protected function getUserRegion($services)
    {
        $regions = Regions::find($services->pluck('region'));
        return json_decode($regions, true);
    }

    public function index()
    {
        $currentUser = auth()->user();
        // $user = User::with('service')->findOrFail($userId);
        $evaluations = Notes::with(['user', 'creator'])
            ->where('id_utilisateur', $currentUser->matricule)
            ->get();
        $services = $currentUser->service;
        $region = $this->getUserRegion($services);
        session(['user_region' => $region[0]['nom'] ?? null]);
        return view('cds.index', compact('currentUser','evaluations'));
    }

    public function create(){
        return view('cds.create',[
            'labels' => $this->getEvaluationLabelsCDS(),
        ]);
    }

    public function store(Request $request){
        // dd('hello');
        // Set username from session if empty
        $nom_utilisateur = $request->input('nom_utilisateur');
        $id_utilisateur = $request->input('id_utilisateur');
        $total_evaluation = $request->input('total_evaluation');
        // Prepare notes array
        $notes = [
            "Connaissance du produit" => $request->input("Connaissance_du_produit"),
            "Techniques de ventes" => $request->input("Techniques_de_ventes"),
            "Gestion du temps" => $request->input("Gestion_du_temps"),
            "Négociation commerciale" => $request->input("Négociation_commerciale"),
            "Analyses des données" => $request->input("Analyses_des_données"),
            "Compétence en Reporting" => $request->input("Compétence_en_Reporting"),
            "Utilisation des Outils d'Analyse des Données" => $request->input("Utilisation_des_Outils_d'Analyse_des_Données"),
            "Analyse du Marché et de la Concurrence" => $request->input('Analyse_du_Marché_et_de_la_Concurrence'),
            "Organisation des Informations" => $request->input("Organisation_des_Informations"),
            "Organisation du Travail" => $request->input("Organisation_du_Travail"),
            "Suivi et Animation des Ventes" => $request->input('Suivi_et_Animation_des_Ventes'),
            "Gestion des Priorités" => $request->input('Gestion_des_Priorités'),
            "Écoute Active" => $request->input('Écoute_Active'),
            "Capacité à Influencer" => $request->input('Capacité_à_Influencer'),
            "Respect et Écoute des Opinions des Autres" => $request->input('Respect_et_Écoute_des_Opinions_des_Autres'),
            "Empathie" => $request->input("Empathie"),
            "Esprit d'Équipe" => $request->input("Esprit_d'Équipe"),
            "Force de proposition" => $request->input("Force_de_proposition"),
            "Sens de l'anticipation" => $request->input('Sens_de_l\'anticipation'),
            "Sens du contact" => $request->input('Sens_du_contact'),
            "Techniques d'animation de réunion" => $request->input('Techniques_d\'animation_de_réunion')
        ];
        //  dd($notes);
        // Create the note
        Notes::create([
            'id_utilisateur' => $id_utilisateur, // You might want to use auth()->id() here
            'nom_utilisateur' => $nom_utilisateur,
            'notes' => json_encode($notes),
            'total' => $total_evaluation,
            'creator_id' => auth()->user()->matricule
        ]);
        return redirect('cds');
    }
    public function show($noteId){
        $evaluation = Notes::with(['user', 'creator'])
            ->where('id_note', $noteId)
            ->firstOrFail();
        
        return view('cds.show', [
            'evaluation' => $evaluation,
            'labels' => $this->getEvaluationLabelsCDS(),
        ]);

    }
    public function deleteEvaluation ($noteId){
        $note = Notes::find($noteId);
        if($note){
            $note->delete();
        }
        return redirect()->back();
    }

    protected function getEvaluationLabelsCDS(): array
    {
        return [
            "Connaissance du produit" =>['4', ["Montre une connaissance limitée des produits. Ne peut pas répondre aux questions de base des clients.", "A une compréhension de base des produits mais manque de détails. Peut répondre à des questions simples des clients.", "Possède une connaissance approfondie des produit (argumenataires produit). Peut expliquer les caractéristiques, les avantages et les cas d'utilisation du produit de manière détaillée.", "Maîtrise tous les aspects des produits. Peut résoudre des problèmes complexes et anticiper les besoins des clients en fonction des fonctionnalités du produit.", "Expert en connaissance produit. Est capable de former d'autres membres de l'équipe sur les détails techniques des produits. Peut proposer des améliorations et des innovations basées sur une compréhension approfondie du marché et des besoins des clients."],'2'],
            "Techniques de ventes"  =>['6', ["Ne comprend pas les techniques de vente de base. A des difficultés à établir une relation client.", "Débute dans l'utilisation des techniques de vente de base. Peut identifier certains besoins des clients mais a du mal à conclure des ventes.", "Utilise efficacement les techniques de vente de base. Identifie clairement les besoins des clients et conclut des ventes de manière constante.", "Maîtrise une variété de techniques de vente avancées. Anticipe les besoins des clients et conclut des ventes complexes avec succès.", "Expert en techniques de vente. Personnalise les approches de vente en fonction des besoins spécifiques des clients. Anticipe les tendances du marché et conclut des ventes stratégiques à long terme."],'3'],
            "Gestion du temps"  => ['4', ["Difficulté à respecter les échéances. Manque de planification et de priorisation.", "Commence à établir des priorités mais peut être dépassé par les urgences. Besoin d'amélioration dans la gestion du temps.", "Respecte les échéances et parvient à planifier efficacement son travail. Priorise les tâches en fonction de leur importance.", "Excellente capacité à gérer son temps de manière efficace. Utilise des outils de planification avancés pour optimiser sa productivité.", "Maîtrise parfaite de la gestion du temps. Anticipe les imprévus, établit des plannings stratégiques et maximise son efficacité au quotidien."],'3'],
            "Négociation commerciale"  =>['6', ["Montre une faible compréhension des techniques de négociation. A du mal à gérer les objections des clients.", "Commence à utiliser des techniques de négociation de base. Peut gérer certaines objections mais a besoin d'amélioration.", "Utilise efficacement les techniques de négociation. Gère les objections avec succès et parvient à conclure des accords satisfaisants.", "Maîtrise une variété de techniques de négociation avancées. Anticipe les objections et conclut des accords avantageux pour toutes les parties.", "Expert en négociation commerciale. Personnalise les stratégies de négociation en fonction des besoins spécifiques des clients. Anticipe les tactiques des négociateurs et conclut des accords mutuellement bénéfiques."],'4'],
            "Analyses des données" =>['5',["Difficulté à interpréter les données de base. Manque de compétences techniques en analyse.", "Débute dans l'interprétation des données. Peut effectuer des analyses simples mais a besoin d'orientation.", "Capable d'analyser efficacement les données pour en tirer des conclusions pertinentes. Utilise diverses techniques d'analyse pour résoudre des problèmes.", "Maîtrise avancée de l'analyse des données. Peut identifier des tendances, des corrélations et des insights significatifs. Utilise des outils et des méthodes avancées d'analyse.", "Expert en analyse des données. Capacité à mener des analyses approfondies et à fournir des recommandations stratégiques basées sur des insights précis. Capable de modéliser des scénarios complexes et d'optimiser les processus en se basant sur les données."],'3'],
            "Compétence en Reporting" => ['5', ["Produit des rapports peu clairs et incorrects. Manque de structure dans les données présentées.", "Commence à produire des rapports de base, mais manque de profondeur. Les données ne sont pas toujours pertinentes.", "Produit des rapports clairs, précis et pertinents. Structuration adéquate des données avec des analyses de base.", "Fournit des rapports détaillés et approfondis. Présente des analyses avancées et des recommandations pertinentes.", "Expert en reporting. Crée des rapports stratégiques et personnalisés. Utilise des visualisations de données avancées pour communiquer des insights clés de manière efficace."],'3'],
            "Utilisation des Outils d'Analyse des Données"  =>['4', ["A une connaissance limitée des outils d'analyse des données. N'a pas d'expérience pratique avec ces outils.", "En phase d'apprentissage des outils d'analyse des données. Utilise des outils de base de manière rudimentaire.", "Maîtrise les outils d'analyse des données couramment utilisés. Capable de manipuler les données, créer des visualisations simples et générer des rapports basiques.", "Utilise efficacement une variété d'outils d'analyse des données avancés. Crée des modèles prédictifs, utilise des techniques d'apprentissage automatique et génère des visualisations complexes.", "Expert dans l'utilisation des outils d'analyse des données. Explore et utilise des outils spécialisés pour des analyses complexes. Crée des tableaux de bord interactifs, automatise les processus d'analyse et développe des solutions personnalisées."],'3'],
            "Analyse du Marché et de la Concurrence" =>['5', ["Montre peu de compréhension du marché et de la concurrence. Ne parvient pas à identifier les tendances clés.", "Commence à identifier certaines tendances du marché et de la concurrence, mais manque de profondeur dans l'analyse.", "Analyse efficacement le marché et la concurrence. Identifie les forces et faiblesses des concurrents et les opportunités du marché.", "Effectue une analyse approfondie du marché et de la concurrence. Anticipe les évolutions du marché et développe des stratégies compétitives.", "Expert en analyse du marché et de la concurrence. Utilise des méthodologies avancées pour évaluer le paysage concurrentiel, prévoir les tendances du marché et recommander des actions stratégiques."],'4'],
            "Organisation des Informations" =>['4', ["A du mal à structurer les informations. Manque de méthode dans la gestion des données.", "Commence à organiser les informations de manière basique. Peut avoir des difficultés à retrouver des données spécifiques.", "Organise efficacement les informations. Utilise des systèmes de classification cohérents et retrouve rapidement les données nécessaires.", "Maîtrise l'organisation des informations de manière avancée. Met en place des systèmes sophistiqués de gestion de l'information pour une accessibilité et une utilisation optimales.", "Expert en organisation du travail. Développe des systèmes personnalisés de gestion du temps et de productivité. Réalise une planification avancée et optimise continuellement son efficacité au travail."],'3'],
            "Organisation du Travail" =>['4', ["Montre des difficultés à gérer les tâches et les priorités. Manque de planification et de structure dans son travail.", "Commence à mettre en place des méthodes d'organisation du travail. Peut parfois être débordé par la charge de travail.", "Organise efficacement les tâches, priorise les activités et respecte les échéances. Utilise des outils de gestion du temps pour optimiser son travail.", "Gère de manière proactive son travail en planifiant efficacement, en déléguant lorsque nécessaire et en adaptant ses méthodes en fonction des objectifs à atteindre.", "Expert en organisation du travail. Développe des systèmes personnalisés de gestion du temps et de productivité. Réalise une planification avancée et optimise continuellement son efficacité au travail."],'3'],
            "Suivi et Animation des Ventes" =>['5', ["Montre une faible compréhension des processus de vente. Ne suit pas régulièrement les performances des ventes.", "Commence à suivre les performances des ventes de manière basique. Peut manquer de stratégie dans l'animation commerciale.", "Assure un suivi régulier des performances des ventes. Met en place des actions d'animation commerciale simples pour stimuler les ventes.", "Met en œuvre des stratégies avancées de suivi des ventes et d'animation commerciale. Identifie les tendances et ajuste les actions en conséquence pour maximiser les résultats.", "Expert en suivi et animation des ventes. Développe des programmes complets d'animation commerciale, utilise des données avancées pour une analyse approfondie et ajuste en temps réel les stratégies pour optimiser les performances."],'4'],
            "Gestion des Priorités" =>['5', ["Éprouve des difficultés à hiérarchiser les tâches. Se laisse souvent déborder par l'urgence au détriment de l'importance.", "Commence à mettre en place des méthodes de priorisation. Peut parfois être submergé par la charge de travail.", "Priorise efficacement les tâches en fonction de leur importance et de leur urgence. Sait gérer les imprévus tout en respectant les échéances.", "Gère de manière proactive les priorités en planifiant, en déléguant lorsque nécessaire et en ajustant son emploi du temps en fonction des objectifs à atteindre.", "Expert en gestion des priorités. Développe des stratégies avancées de priorisation, utilise des outils de gestion du temps sophistiqués et optimise en permanence son efficacité en identifiant et en concentrant ses efforts sur les tâches les plus cruciales."],'3'],
            "Écoute Active" =>['6', ["Montre peu d'intérêt pour les opinions des autres. Interrompt fréquemment les interlocuteurs. Ne manifeste pas une réelle attention aux besoins des autres.", "Commence à prêter davantage attention aux autres, mais peut encore être distrait. Écoute de manière passive sans poser de questions approfondies.", "Bonne écoute", "Très bon niveau", "Expert en écoute active"],'4'],
            "Capacité à Influencer" =>['5',["Échoue à communiquer efficacement ses idées. Ne parvient pas à persuader les autres. Manque de confiance en soi dans les interactions influentes.", "Commence à exprimer ses idées de manière convaincante, mais peut rencontrer des difficultés à influencer les décisions. Fait preuve d'une certaine résistance au changement.", "Influence efficacement les autres en utilisant des arguments solides et en adaptant son discours en fonction de son public. Sait négocier et persuader pour atteindre des objectifs communs.", "IMaîtrise l'art de l'influence en adaptant son style de communication aux différents types de personnes. Sait gérer les oppositions et les objections de manière constructive.", "Expert en capacité à influencer. Utilise des techniques avancées de persuasion, sait inspirer et motiver les autres, et possède une capacité exceptionnelle à obtenir un consensus et à conduire le changement."],'3'],
            "Respect et Écoute des Opinions des Autres" =>['4', ["Manifeste un manque de respect en interrompant fréquemment les autres. Ne prend pas en compte les opinions différentes. Ne fait pas preuve d'empathie.", "Commence à montrer du respect en écoutant les autres, mais peut encore avoir du mal à accepter des opinions divergentes. Montre une certaine ouverture à la discussion.", "Respecte les opinions des autres même si elles diffèrent des siennes. Écoute activement et fait preuve d'empathie envers les points de vue différents. Sait reconnaître la valeur de la diversité des opinions.", "Traite les opinions des autres avec respect et considération, même lorsqu'elles sont en désaccord. Favorise un climat de dialogue ouvert et constructif. Sait intégrer des perspectives variées dans la prise de décision.", "Expert en respect et écoute des opinions des autres. Favorise un environnement inclusif où chacun se sent écouté et respecté. Sait gérer les conflits d'opinions de manière constructive et favorise la collaboration pour atteindre des objectifs communs."],'3'],
            "Empathie" =>['5', ["Montre un manque d'intérêt pour les émotions des autres.Ne parvient pas à la place des autres.Peut sembler insensible aux sentiments des autres.", "Commence à reconnaître les émotions des autres, mais a du mal à les comprendre en profondeur. Peut exprimer de la sympathie sans vraiment ressentir l'émotion de l'autre.", "Démontre une capacité à percevoir et comprendre les émotions des autres. Fait preuve de compassion et de soutien envers les personnes en difficulté. Sait écouter activement et reconnaître les sentiments des autres.", "Manifeste une grande sensibilité aux émotions d'autrui. Comprend profondément les perspectives et les sentiments des autres. Sait réagir de manière appropriée et empathique dans des situations complexes.", "Expert en empathie. Sait non seulement reconnaître les émotions des autres, mais également les anticiper. Utilise son empathie pour établir des liens solides, résoudre les conflits et inspirer les autres à leur meilleur."],'3' ],
            "Esprit d'Équipe" =>['4', ["Travaillle de manière isolée, évite les interactions avec les collègues. Ne contribue pas activement à la dynamique de groupe. Ne partage pas les connaissances ou les ressources.", "Commence à s'engager dans des activités d'équipe, mais peut être réticent à collaborer pleinement. Partage occasionnellement des idées et des informations avec les autres membres de l'équipe.", "Contribue de manière positive à l'équipe en partageant ses idées et en collaborant efficacement avec les autres. Favorise un environnement de travail harmonieux et coopératif.", "Joue un rôle clé dans le renforcement de la cohésion d'équipe. Encourage la collaboration, résout les conflits de manière constructive et motive les membres de l'équipe à atteindre ensemble les objectifs communs.", "Expert en esprit d'équipe. Inspire et guide les autres membres de l'équipe. Favorise une culture de confiance, de respect et de soutien mutuel. Sait identifier et valoriser les forces de chacun pour optimiser les performances de l'équipe."],'3'],
            "Force de proposition" =>['5', ["Reste passif lors des discussions et des réunions. N'hésite pas à partager des idées. Ne propose pas d'améliorations ou de solutions.", "Commence à exprimer des idées et des suggestions, mais de manière timide. Montre un certain niveau d'initiative pour apporter des contributions. Propose des idées pour résoudre des problèmes simples.", "Participe activement aux discussions en proposant des idées pertinentes et constructives. Contribue régulièrement à l'amélioration des processus et des projets. Propose des solutions créatives pour résoudre des problèmes complexes.", "PFait preuve d'une forte capacité à générer des idées novatrices et à proposer des solutions efficaces. Anticipe les besoins et identifie les opportunités d'amélioration. Joue un rôle clé dans l'innovation et l'évolution des stratégies de l'organisation.", "Expert en force de proposition. Propose des idées révolutionnaires et disruptives qui transforment positivement l'organisation. Inspire les autres par son esprit créatif et visionnaire. Identifie et saisit les opportunités de manière proactive. Dirige des initiatives stratégiques basées sur des propositions convaincantes et bien argumentées."],'4'],
            "Sens de l'anticipation" =>['5', ["Réagit de manière passive aux changements. Ne prévoit pas les problèmes potentiels. Ne planifie pas à long terme.", "Commence à reconnaître certains signes de changement. Prévoit certains problèmes potentiels, mais de manière réactive. Élabore des plans à court terme.", "Anticipe les changements et les défis potentiels. Identifie les tendances émergentes et évalue leurs impacts. Élabore des plans à moyen terme pour faire face aux défis anticipés.", "Anticipe de manière proactive les évolutions du marché et de l'environnement de travail. Identifie les opportunités futures et élabore des stratégies pour les saisir. Élabore des plans à long terme pour assurer la pérennité et la croissance de l'organisation.", "Expert en sens de l'anticipation. Anticipe les tendances et les changements à un niveau stratégique. Identifie les risques et les opportunités avant qu'ils ne se présentent. Élabore des stratégies visionnaires pour garantir la compétitivité et le succès à long terme de l'organisation."],'3'],
            "Sens du contact" =>['4', ["Évite les interactions sociales. Manque d'empathie et de considération envers les autres. Communique de manière abrupte ou inappropriée.", "Interagit avec les autres de manière occasionnelle. Manque parfois d'empathie dans les interactions. Commence à développer des compétences en communication.", "Établit des relations positives avec les autres. Communique de manière claire et respectueuse. Écoute activement les besoins et les préoccupations des autres. Fait preuve d'empathie et de compréhension.", "rée des liens solides avec les autres. Communique de manière efficace, en adaptant son style aux besoins de l'interlocuteur. Fait preuve d'une grande empathie et d'une écoute active. Gère les relations interpersonnelles de manière professionnelle et chaleureuse.", "Expert en sens du contact. Établit des relations interpersonnelles exceptionnelles. Communique de manière persuasive et inspirante. Fait preuve d'une empathie profonde et d'une intelligence émotionnelle élevée. Gère les interactions sociales de manière stratégique pour promouvoir la collaboration et la réussite."],'4'],
            "Techniques d'animation de réunion" =>['5',["Anime les réunions de manière désorganisée. Manque de clarté dans la communication. Les réunions manquent de structure et d'objectifs clairs.","Anime les réunions de manière basique. Suit un ordre du jour préétabli sans variété. Manque parfois de dynamisme. Les participants s'impliquent de manière limitée.","Anime efficacement les réunions en maintenant l'engagement des participants. Utilise diverses techniques pour encourager la participation de tous. Gère le temps de manière efficace et assure que les objectifs de la réunion sont atteints.","Anime les réunions avec expertise. Utilise des méthodes créatives pour stimuler la réflexion et la collaboration. Encourage une participation active et équitable de tous les participants. Gère les situations conflictuelles de manière constructive.","Expert en techniques d'animation de réunion. Anime des réunions de manière magistrale, en captivant l'attention et en suscitant l'engagement de tous. Utilise des techniques avancées pour favoriser l'innovation et la résolution de problèmes. Anticipe les besoins des participants et adapte l'animation en conséquence pour des résultats optimaux."],'3']
        ];
    }
}
