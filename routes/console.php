<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Tareas operativas para entornos productivos.
if (app()->environment(['production', 'staging'])) {
    Schedule::command('cache:warmup')
        ->hourly()
        ->withoutOverlapping()
        ->runInBackground();

    Schedule::command('health:check')
        ->everyFifteenMinutes()
        ->withoutOverlapping()
        ->runInBackground();

    Schedule::command('sessions:cleanup')
        ->dailyAt('03:00')
        ->withoutOverlapping()
        ->runInBackground();
}
