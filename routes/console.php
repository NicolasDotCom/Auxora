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

// Reset diario del demo (solo si APP_DEMO=true)
if (config('app.demo.enabled')) {
    $resetHour = (int) config('app.demo.reset_hour', 3);

    Schedule::command('demo:reset --force')
        ->dailyAt(sprintf('%02d:00', $resetHour))
        ->name('demo-reset-db')
        ->withoutOverlapping()
        ->runInBackground();

    Schedule::command('demo:clean-storage')
        ->dailyAt(sprintf('%02d:15', min($resetHour + 1, 23)))
        ->name('demo-clean-storage')
        ->withoutOverlapping()
        ->runInBackground();
}
