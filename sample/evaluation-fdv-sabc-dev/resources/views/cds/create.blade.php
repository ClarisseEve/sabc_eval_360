@extends('layout.form')

@section('content')
    <div class="container mt-5">
        <div class="card shadow-lg p-4">
            <div class="card-header">
                <h2 class="text-center mb-4">
                    <a href="{{ url()->previous() }}" class="text-decoration-none text-sabc-gray">
                        <i class="bi bi-arrow-left"></i> 
                    </a>
                    Formulaire d'Évaluation {{ Auth::user()->type }} {{ Auth::user()->surname }} {{  Auth::user()->name }}
                </h2>
            </div>
            <div class="card-body">
                <form id="evaluationForm" method="POST" action="{{ route('cds.note.store') }}">
                    @csrf
                    <div class="row">
                        <div class="col-md-12">
                            <p class="text-muted">Veuillez évaluer chaque compétence en sélectionnant un niveau.</p>
                        </div>
                    </div>
                    <div class="row"> 
                        <input class="form-control" type="hidden" name="nom_utilisateur" id="nom_utilisateur" value="{{ Auth::user()->surname }} {{  Auth::user()->name }}">
                        <input class="form-control" type="hidden" name="id_utilisateur" id="id_utilisateur" value="{{ Auth::user()->matricule }}">
                        <input class="form-control" type="hidden" name="total_evaluation" id="total_evaluation">
                        <!-- Dynamic Skill Sections -->
                        @foreach($labels as $skillName => $descriptions)
                        <div class="col-md-6 mb-3" data-weight="{{ $descriptions[0] }}">
                            <div class="card p-3">
                                <label class="form-label fw-bold"><?= htmlspecialchars($skillName) ?></label>
                                <div class="d-flex justify-content-between flex-wrap">
                                    <?php foreach ($descriptions[1] as $index => $description): ?>
                                        <div class="form-check" data-bs-toggle="tooltip" data-bs-placement="top" title="<?= htmlspecialchars($description) ?>">
                                            <input class="form-check-input" type="radio" name="<?= htmlspecialchars(str_replace(' ', '_', $skillName)) ?>" value="<?= $index + 1 ?>">
                                            <label class="form-check-label">Niveau <?= $index + 1 ?></label>
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                        </div>

                        @endforeach
                    </div> 
                </form>
            </div>
            <div class="card-footer">
                <div class="d-flex justify-content-between gap-2">
                    <button type="reset" class="btn btn-sabc-red">
                        <i class="bi bi-x-circle"></i> Réinitialiser
                    </button>
                    <button class="btn btn-sabc-red" id="showModal">
                        <i class="bi bi-check-circle"></i> Evaluer
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Results Modal -->
    <div class="modal fade" id="scoreModal" tabindex="-1" aria-labelledby="scoreModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="scoreModalLabel">Résultat d'évaluation</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body text-center">
                    <div class="mt-3" id="completionStatus"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                    <button type="button" class="btn btn-sabc-red" id="saveEvaluation" onclick="submitEvaluation()">Enregistrer l'évaluation</button>        
                </div>
            </div>
        </div>
    </div>
@endsection

@section('script')
    <script>
        // DOM Elements
        const elements = {
            form: document.getElementById('evaluationForm'),
            form_total: document.getElementById('total_evaluation'),
            scoreModal: document.getElementById('scoreModal'),
            progressCircle: document.getElementById('progressCircle'),
            scoreValue: document.getElementById('scoreValue'),
            percentageValue: document.getElementById('percentageValue'),
            completionStatus: document.getElementById('completionStatus'),
            evaluatedUser: document.getElementById('evaluatedUser'),
            saveButton: document.getElementById('saveEvaluation'),
            userInput: document.getElementById('nom_utilisateur'),
            showModal: document.getElementById('showModal')
        };



        // Calculate and display score
        function calculateAndShowScore() {
            const sections = document.querySelectorAll('.col-md-6.mb-3[data-weight]');
            const userName = elements.userInput.value;
            let totalScore = 0;
            let maxPossibleScore = 0;
            let completedSections = 0;

            sections.forEach(section => {
                // Get the weight of the section (as a percentage)
                const allInputs = section.querySelectorAll('input[type="radio"]');
                const weight = parseFloat(section.getAttribute('data-weight'));
                const selectedRadio = section.querySelector('input[type="radio"]:checked');

                // Count all radio inputs in this section
                maxLevel = allInputs.length;
                
                if (selectedRadio) {
                    // Calculate the weighted score for this section
                    const level = parseFloat(selectedRadio.value); // 1-5
                    // Calculate section score (level/maxLevel * weight)
                    const sectionScore = (level / maxLevel) * (weight/100);
                    totalScore += sectionScore;

                    // Calculate max possible score for this section (weight)
                    maxPossibleScore += weight;
                    // Increment completed sections
                    completedSections++;
                }
            });
            var mark = Math.round(totalScore * 20);
            console.log(mark);
            document.getElementById('total_evaluation').value = mark ;
            if (completedSections < sections.length) {
                elements.completionStatus.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle"></i> 
                        ${completedSections} sur ${sections.length} catégories évaluées. Veuillez compléter toutes les catégories.
                    </div>`;
                elements.saveButton.style.display = 'none';
                // Show modal
                const modal = new bootstrap.Modal(elements.scoreModal);
                modal.show();
            } else {
                submitEvaluation()
            }
        }

       // Submit evaluation
       function submitEvaluation() {
           elements.form.submit(); // Submits the form normally (page reloads)
        }
        // Add event listeners after DOM is loaded
         // Initialize
         document.addEventListener('DOMContentLoaded', function() {
            elements.showModal.addEventListener('click', function(e) {
                e.preventDefault();
                calculateAndShowScore();
            });
            // Reset form
            document.querySelector('button[type="reset"]').addEventListener('click', function() {
                document.querySelectorAll('input[type="radio"]').forEach(radio => {
                    radio.checked = false;
                });
            });
        });
    </script>

    <style>
        #progressCircle {
            transition: stroke-dashoffset 0.8s ease-in-out;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
            .form-check {
                margin-bottom: 0.5rem;
            }
            
            .col-md-6.mb-3 .card {
                padding: 1rem;
            }
            
            .d-flex.justify-content-between {
                flex-direction: column;
                gap: 0.5rem;
            }
        }

    </style>
@endsection