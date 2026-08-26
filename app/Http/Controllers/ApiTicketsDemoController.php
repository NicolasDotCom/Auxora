<?php

namespace App\Http\Controllers;

use App\Services\CacheService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApiTicketsDemoController extends Controller
{
    public function index(Request $request): Response
    {
        $supports = CacheService::getSupportsList()->map(function ($support) {
            return [
                'id' => $support->id,
                'name' => $support->name,
            ];
        })->values();

        $companies = CacheService::getCompanyNames()->values();

        return Inertia::render('Tokens/Demo', [
            'apiBaseUrl' => url('/api/v1'),
            'defaultEndpoint' => '/tickets',
            'supports' => $supports,
            'companies' => $companies,
            'abilitiesHint' => [
                'tickets:read',
            ],
        ]);
    }
}
