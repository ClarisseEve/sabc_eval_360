<?php

use App\Models\PeriodeEvaluation;
use Carbon\Carbon;

function buildPeriode(array $overrides = []): PeriodeEvaluation
{
    $defaults = [
        'statut' => 'ouverte',
        'est_ouverte' => true,
        'est_cloturee' => false,
        'date_debut' => Carbon::parse('2026-03-01 00:00:00'),
        'date_fin' => Carbon::parse('2026-03-31 23:59:59'),
    ];

    return new PeriodeEvaluation(array_merge($defaults, $overrides));
}

afterEach(function (): void {
    Carbon::setTestNow();
});

test('estActive retourne true quand statut et flags sont coherents et date dans la periode', function () {
    Carbon::setTestNow(Carbon::parse('2026-03-10 12:00:00'));

    $periode = buildPeriode();

    expect($periode->estActive())->toBeTrue();
});

test('estActive retourne false si statut nest pas ouverte', function () {
    Carbon::setTestNow(Carbon::parse('2026-03-10 12:00:00'));

    $periode = buildPeriode(['statut' => 'planifiee']);

    expect($periode->estActive())->toBeFalse();
});

test('estActive retourne false si flags incoherents', function () {
    Carbon::setTestNow(Carbon::parse('2026-03-10 12:00:00'));

    $periodeFermee = buildPeriode(['est_cloturee' => true]);
    $periodeNonOuverte = buildPeriode(['est_ouverte' => false]);

    expect($periodeFermee->estActive())->toBeFalse()
        ->and($periodeNonOuverte->estActive())->toBeFalse();
});

test('estActive retourne false hors fenetre de dates', function () {
    Carbon::setTestNow(Carbon::parse('2026-04-10 12:00:00'));

    $periode = buildPeriode();

    expect($periode->estActive())->toBeFalse();
});

test('estTerminee retourne true si cloturee ou date depassee', function () {
    Carbon::setTestNow(Carbon::parse('2026-04-02 00:00:00'));

    $periodeDateDepassee = buildPeriode(['est_cloturee' => false]);
    $periodeCloturee = buildPeriode(['est_cloturee' => true]);

    expect($periodeDateDepassee->estTerminee())->toBeTrue()
        ->and($periodeCloturee->estTerminee())->toBeTrue();
});

test('estModifiable retourne true uniquement pour planifiee non ouverte non cloturee', function () {
    $modifiable = buildPeriode([
        'statut' => 'planifiee',
        'est_ouverte' => false,
        'est_cloturee' => false,
    ]);

    $nonModifiable = buildPeriode([
        'statut' => 'ouverte',
        'est_ouverte' => true,
        'est_cloturee' => false,
    ]);

    expect($modifiable->estModifiable())->toBeTrue()
        ->and($nonModifiable->estModifiable())->toBeFalse();
});
