<?php

namespace App\Helpers;

use Carbon\Carbon;

class DateHelper
{
    /**
     * Get current datetime in Colombia timezone
     */
    public static function nowColombia()
    {
        return Carbon::now(config('app.timezone'));
    }

    /**
     * Parse a date and convert to Colombia timezone
     */
    public static function parseInColombia($date)
    {
        if (!$date) {
            return null;
        }

        return Carbon::parse($date)->setTimezone(config('app.timezone'));
    }

    /**
     * Format a date for display in Colombia timezone
     */
    public static function formatForDisplay($date, $format = 'Y-m-d H:i:s')
    {
        if (!$date) {
            return null;
        }

        return self::parseInColombia($date)->format($format);
    }
}
