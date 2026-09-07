<?php

namespace App\Http\Middleware;

use App\Helpers\DemoHelper;
use App\Models\Customer;
use App\Models\Support;
use App\Models\Ticket;
use App\Models\PendingPart;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        // Cachear totales por 5 minutos (excepto en desarrollo)
        $cacheTime = config('app.debug') ? 60 : 300; // 1 min en dev, 5 en prod
        
        $totalCustomers = cache()->remember('stats:total_customers', $cacheTime, fn() => Customer::count());
        $totalTickets = cache()->remember('stats:total_tickets', $cacheTime, fn() => Ticket::count());
        $totalSupports = cache()->remember('stats:total_supports', $cacheTime, fn() => Support::count());

        // Contar tickets únicos con repuestos pendientes y cliente asociado (misma lógica visible en Pendientes)
        $pendingPartsCount = 0;
        if ($request->user() && !$request->user()->hasRole('customer')) {
            $pendingPartsCount = cache()->remember('stats:pending_parts_count', 180, function() {
                return PendingPart::query()
                    ->where('status', 'pending')
                    ->whereHas('ticket.customer')
                    ->distinct()
                    ->pluck('ticket_id')
                    ->count();
            });
        }

        // Estadísticas de soporte técnico por especialidad
        $technicalSupportSpeciality = cache()->remember('stats:support_speciality', 3600, function() {
            return Support::query()
                ->select('speciality', DB::raw('count(*) as count'))
                ->groupBy('speciality')
                ->get()
                ->mapWithKeys(fn($item) => [$item->speciality => $item->count])
                ->all();
        });

        // Estadísticas de tickets por estado
        $ticketByStatus = cache()->remember('stats:ticket_by_status', 300, function() {
            return Ticket::query()
                ->select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get()
                ->mapWithKeys(fn($item) => [$item->status => $item->count])
                ->all();
        });

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
                'roles' => $request->user()?->getRoleNames() ?? [],
                'permissions' => $request->user()?->getAllPermissions()->pluck('name') ?? []
            ],
            'demo' => [
                'enabled' => DemoHelper::isEnabled(),
                'banner' => DemoHelper::banner(),
            ],
            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'warning' => $request->session()->get('warning'),
                'info' => $request->session()->get('info'),
            ],
            'totalCustomers' => $totalCustomers,
            'totalTickets' => $totalTickets,
            'totalSupports' => $totalSupports,
            'technicalSupportSpeciality' => $technicalSupportSpeciality,
            'ticketByStatus' => $ticketByStatus,
            'pendingPartsCount' => $pendingPartsCount
        ];
    }
}
