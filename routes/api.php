<?php

use App\Http\Middleware\ApiPerformanceMonitor;
use App\Http\Controllers\Api\TicketApiController;
use App\Http\Controllers\Api\TicketCommentApiController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'throttle:api-tickets', ApiPerformanceMonitor::class])->prefix('v1')->group(function () {
    Route::get('/tickets', [TicketApiController::class, 'index']);
    Route::get('/tickets/{ticket}', [TicketApiController::class, 'show']);
    Route::get('/tickets/{ticket}/comments', [TicketCommentApiController::class, 'index']);
});
