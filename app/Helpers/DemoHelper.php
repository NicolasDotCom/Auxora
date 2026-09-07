<?php

namespace App\Helpers;

class DemoHelper
{
    public static function isEnabled(): bool
    {
        return (bool) config('app.demo.enabled', false);
    }

    public static function publicRegistration(): bool
    {
        return self::isEnabled() && (bool) config('app.demo.public_registration', true);
    }

    public static function banner(): string
    {
        return (string) config(
            'app.demo.banner',
            'Entorno demo — los datos se reinician cada noche.'
        );
    }

    public static function maxTicketsPerUser(): int
    {
        return (int) config('app.demo.max_tickets_per_user', 5);
    }

    public static function resetHour(): int
    {
        return (int) config('app.demo.reset_hour', 3);
    }
}