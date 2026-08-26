<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Support;
use App\Models\Ticket;
use App\Models\User;
use App\Exports\TicketsExport;
use App\Services\CacheService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class DashboardController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function index()
    {
        $userId = Auth::id();
        $user = User::find($userId);

        // Inicializar consulta base con select específico y eager loading optimizado
        $query = Ticket::select('id', 'customer_id', 'support_id', 'user_id', 'status', 'created_at')
            ->with([
                'customer:id,name',
                'support:id,name'
            ]);

        // Aplicar filtros según el rol del usuario
        if ($user && $user->hasRole('support')) {
            // Técnico de soporte: solo tickets asignados a él
            $support = Support::where('email', $user->email)->first();
            if ($support) {
                $query->where('support_id', $support->id);
            } else {
                $query->whereRaw('1 = 0'); // No mostrar tickets si no tiene registro de support
            }
        } elseif ($user && $user->hasRole('customer')) {
            // Cliente: solo sus propios tickets
            $customer = Customer::where('email', $user->email)->first();
            if ($customer) {
                $query->where('customer_id', $customer->id);
            } else {
                $query->whereRaw('1 = 0'); // No mostrar tickets si no tiene registro de customer
            }
        } elseif ($user && $user->hasRole('Comercial')) {
            // Comercial: solo los tickets que él mismo creó
            $query->where('user_id', $user->id);
        }
        // Para admin: ver todos los tickets (sin filtro adicional)

        $roleName = $user?->roles->first()?->name ?? 'none';
        $dashboardData = CacheService::getDashboardStats("dashboard_main_{$userId}_{$roleName}", function () use ($query) {
            $ticketsAbiertos = (clone $query)->where('status', 'Open')->count();
            $ticketsEnProgreso = (clone $query)->where('status', 'In Progress')->count();
            $ticketsCerrados = (clone $query)->where('status', 'Closed')->count();
            $totalTickets = $ticketsAbiertos + $ticketsEnProgreso + $ticketsCerrados;

            $ultimosTickets = (clone $query)
                ->latest()
                ->take(5)
                ->get()
                ->map(function ($ticket) {
                    $estadoTraducido = match($ticket->status) {
                        'Open' => 'Abierto',
                        'In Progress' => 'En Progreso',
                        'Closed' => 'Cerrado',
                        default => $ticket->status
                    };

                    return [
                        'id' => $ticket->id,
                        'numero_ticket' => '#' . str_pad($ticket->id, 4, '0', STR_PAD_LEFT),
                        'tecnico_asignado' => $ticket->support ? $ticket->support->name : 'Sin asignar',
                        'estado' => $estadoTraducido,
                        'created_at' => $ticket->created_at->setTimezone(config('app.timezone'))->format('d/m/Y'),
                    ];
                });

            return [
                'tickets_abiertos' => $ticketsAbiertos,
                'tickets_en_progreso' => $ticketsEnProgreso,
                'tickets_cerrados' => $ticketsCerrados,
                'total_tickets' => $totalTickets,
                'ultimos_tickets' => $ultimosTickets,
                'grafica_data' => [
                    ['status' => 'Abiertos', 'cantidad' => $ticketsAbiertos, 'fill' => '#ef4444'],
                    ['status' => 'En Progreso', 'cantidad' => $ticketsEnProgreso, 'fill' => '#f97316'],
                    ['status' => 'Cerrados', 'cantidad' => $ticketsCerrados, 'fill' => '#22c55e'],
                ],
            ];
        });

        // Cargar tickets para exportación si tiene permiso
        $canExport = $user && $user->hasPermissionTo('export analytics');
        $allTicketsData = $canExport ? $this->getAllTicketsForExport() : [];
        
        return Inertia::render('DashboardNew', [
            'metricas' => [
                'tickets_abiertos' => $dashboardData['tickets_abiertos'],
                'tickets_en_progreso' => $dashboardData['tickets_en_progreso'],
                'tickets_cerrados' => $dashboardData['tickets_cerrados'],
                'total_tickets' => $dashboardData['total_tickets'],
            ],
            'graficaData' => $dashboardData['grafica_data'],
            'ultimosTickets' => $dashboardData['ultimos_tickets'],
            'userRole' => $user ? $user->roles->first()?->name : null,
            'allTickets' => $allTicketsData
        ]);
    }

    /**
     * Obtener todos los tickets disponibles para exportación (solo para admin)
     */
    private function getAllTicketsForExport()
    {
        return Ticket::with(['customer', 'support'])
            ->get()
            ->map(function ($ticket) {
                return [
                    'id' => $ticket->id,
                    'description' => $ticket->description,
                    'phone' => $ticket->phone,
                    'address' => $ticket->address,
                    'status' => $ticket->status, // Mantener estado original para filtros
                    'customer' => $ticket->customer ? [
                        'name' => $ticket->customer->name,
                        'email' => $ticket->customer->email,
                        'username' => $ticket->customer->username,
                    ] : null,
                    'support' => $ticket->support ? [
                        'name' => $ticket->support->name,
                        'email' => $ticket->support->email,
                    ] : null,
                    'created_at' => $ticket->created_at ? $ticket->created_at->setTimezone(config('app.timezone'))->format('Y-m-d H:i:s') : '',
                    'brand' => $ticket->brand,
                    'model' => $ticket->model,
                    'serial' => $ticket->serial,
                ];
            });
    }

    /**
     * Exportar tickets seleccionados a Excel
     */
    public function exportTickets(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = User::find(Auth::id());
        if (!$user || !$user->hasPermissionTo('export analytics')) {
            abort(403, 'No tienes permisos para exportar tickets.');
        }

        $ticketIds = $request->input('ticket_ids', $request->input('tickets', []));
        
        // Si se envía "all", exportar todos los tickets
        if ($ticketIds === 'all') {
            $ticketIds = Ticket::pluck('id')->toArray();
        } elseif (is_string($ticketIds)) {
            // Si viene como string separado por comas, convertir a array
            $ticketIds = explode(',', $ticketIds);
            $ticketIds = array_map('intval', array_filter($ticketIds));
        }
        
        $export = new TicketsExport($ticketIds);
        $csvContent = $export->toCsv();
        
        $fileName = 'tickets_export_' . now()->format('Y-m-d_H-i-s') . '.csv';
        
        return response($csvContent)
            ->header('Content-Type', 'text/csv; charset=utf-8')
            ->header('Content-Disposition', 'attachment; filename="' . $fileName . '"')
            ->header('Pragma', 'no-cache')
            ->header('Cache-Control', 'must-revalidate, post-check=0, pre-check=0')
            ->header('Expires', '0');
    }

    /**
     * Exportar tickets seleccionados a PDF
     */
    public function exportTicketsPdf(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = User::find(Auth::id());
        if (!$user || !$user->hasPermissionTo('export analytics')) {
            abort(403, 'No tienes permisos para exportar tickets.');
        }

        $ticketIds = $request->input('ticket_ids', $request->input('tickets', []));
        
        // Si se envía "all", exportar todos los tickets
        if ($ticketIds === 'all') {
            $ticketIds = Ticket::pluck('id')->toArray();
        } elseif (is_string($ticketIds)) {
            // Si viene como string separado por comas, convertir a array
            $ticketIds = explode(',', $ticketIds);
            $ticketIds = array_map('intval', array_filter($ticketIds));
        }
        
        $export = new TicketsExport($ticketIds);
        $pdf = $export->toPdf();
        
        $fileName = 'tickets_export_' . now()->format('Y-m-d_H-i-s') . '.pdf';
        
        return $pdf->download($fileName);
    }

    /**
     * Obtener análisis de efectividad de técnicos
     */
    public function getTechnicianAnalytics(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = User::find(Auth::id());
        if (!$user || !$user->hasPermissionTo('view analytics')) {
            abort(403, 'No tienes permisos para ver este análisis.');
        }

        $data = $this->getCachedRankingData($request);

        return Inertia::render('Analytics/Technicians', $data);
    }

    /**
     * Exportar ranking de técnicos a PDF
     */
    public function exportRankingPdf(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = User::find(Auth::id());
        if (!$user || !$user->hasPermissionTo('view analytics')) {
            abort(403, 'No tienes permisos para exportar el ranking.');
        }

        $data = $this->getCachedRankingData($request);

        $pdf = Pdf::loadView('exports.ranking-pdf', [
            'technicians' => $data['technicians']->toArray(),
            'date_from'   => $data['date_from'],
            'date_to'     => $data['date_to'],
            'has_trend'   => !empty($data['date_from']) && !empty($data['date_to']),
        ]);
        $pdf->setPaper('a4', 'landscape');

        $fileName = 'ranking_tecnicos_' . now()->format('Y-m-d_H-i-s') . '.pdf';
        return $pdf->download($fileName);
    }

    /**
     * Obtener data del ranking de técnicos con caché por rango de fechas.
     */
    private function getCachedRankingData(Request $request): array
    {
        $dateFrom = (string) ($request->input('date_from') ?? 'all');
        $dateTo = (string) ($request->input('date_to') ?? 'all');
        $cacheKey = "ranking_technicians_v1_{$dateFrom}_{$dateTo}";

        return CacheService::getTechnicianRankingStats($cacheKey, function () use ($request) {
            return $this->buildRankingData($request);
        });
    }

    /**
     * Lógica compartida de construcción del ranking de técnicos
     */
    private function buildRankingData(Request $request): array
    {
        // Rango de fechas personalizado
        $dateFrom = $request->input('date_from')
            ? \Carbon\Carbon::parse($request->input('date_from'))->startOfDay()
            : null;
        $dateTo = $request->input('date_to')
            ? \Carbon\Carbon::parse($request->input('date_to'))->endOfDay()
            : null;

        // Pre-cargar todos los festivos una sola vez (evita N+1 en WorkingDaysHelper)
        $holidayRangeStart = $dateFrom ?? \Carbon\Carbon::createFromDate(2020, 1, 1);
        $holidayRangeEnd   = $dateTo   ?? now();
        $years = range($holidayRangeStart->year, $holidayRangeEnd->year);
        $allHolidays = [];
        foreach ($years as $year) {
            $yearHolidays = \App\Services\CacheService::getHolidays($year);
            foreach ($yearHolidays as $h) {
                $allHolidays[] = $h->date instanceof \Carbon\Carbon
                    ? $h->date->format('Y-m-d')
                    : \Carbon\Carbon::parse($h->date)->format('Y-m-d');
            }
        }

        // ── Conteos por estado directo en SQL ──
        $ticketCountsQuery = Ticket::select(
                'support_id',
                DB::raw('COUNT(*) as total_tickets'),
                DB::raw("SUM(CASE WHEN status = 'Closed'      THEN 1 ELSE 0 END) as closed_tickets"),
                DB::raw("SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_tickets"),
                DB::raw("SUM(CASE WHEN status = 'Open'        THEN 1 ELSE 0 END) as open_tickets")
            )
            ->whereNotNull('support_id')
            ->groupBy('support_id');

        if ($dateFrom) $ticketCountsQuery->where('created_at', '>=', $dateFrom);
        if ($dateTo)   $ticketCountsQuery->where('created_at', '<=', $dateTo);

        $ticketCounts = $ticketCountsQuery->get()->keyBy('support_id');

        // ── Solo tickets cerrados con ambas fechas ──
        $closedTicketsQuery = Ticket::with(['customer:id,name'])
            ->select('id', 'support_id', 'customer_id', 'subject', 'assigned_at', 'closed_at')
            ->where('status', 'Closed')
            ->whereNotNull('assigned_at')
            ->whereNotNull('closed_at')
            ->whereNotNull('support_id');

        if ($dateFrom) $closedTicketsQuery->where('created_at', '>=', $dateFrom);
        if ($dateTo)   $closedTicketsQuery->where('created_at', '<=', $dateTo);

        $closedTickets = $closedTicketsQuery->get()->map(function ($ticket) use ($allHolidays) {
            $ticket->working_hours = \App\Helpers\WorkingDaysHelper::getWorkingHours(
                $ticket->assigned_at,
                $ticket->closed_at,
                $allHolidays
            );

            return $ticket;
        });

        $closedByTech = $closedTickets->groupBy('support_id');

        // ── Período anterior para tendencia ──
        $prevScores = [];
        $hasTrend   = $dateFrom && $dateTo;

        if ($hasTrend) {
            $days         = max(1, $dateFrom->diffInDays($dateTo));
            $prevDateTo   = $dateFrom->copy()->subDay()->endOfDay();
            $prevDateFrom = $prevDateTo->copy()->subDays($days)->startOfDay();

            $prevCounts = Ticket::select(
                    'support_id',
                    DB::raw('COUNT(*) as total_tickets'),
                    DB::raw("SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed_tickets")
                )
                ->whereNotNull('support_id')
                ->where('created_at', '>=', $prevDateFrom)
                ->where('created_at', '<=', $prevDateTo)
                ->groupBy('support_id')
                ->get()
                ->keyBy('support_id');

            $prevClosedByTech = Ticket::select('id', 'support_id', 'assigned_at', 'closed_at')
                ->where('status', 'Closed')
                ->whereNotNull('assigned_at')
                ->whereNotNull('closed_at')
                ->whereNotNull('support_id')
                ->where('created_at', '>=', $prevDateFrom)
                ->where('created_at', '<=', $prevDateTo)
                ->get()
                ->map(function ($ticket) use ($allHolidays) {
                    $ticket->working_hours = \App\Helpers\WorkingDaysHelper::getWorkingHours(
                        $ticket->assigned_at,
                        $ticket->closed_at,
                        $allHolidays
                    );

                    return $ticket;
                })
                ->groupBy('support_id');

            foreach ($prevCounts as $supportId => $counts) {
                $total  = (int) $counts->total_tickets;
                $closed = (int) $counts->closed_tickets;
                if ($total === 0) continue;

                $rate      = ($closed / $total) * 100;
                $techClose = $prevClosedByTech->get($supportId, collect());
                $avgHours  = 0;
                if ($techClose->count() > 0) {
                    $hrs = $techClose->sum('working_hours');
                    $avgHours = $hrs / $techClose->count();
                }
                $prevScores[$supportId] = $this->calculateEfficiencyScore($rate, $avgHours, $total);
            }
        }

        // ── Construir resultado por técnico ──
        $technicians = Support::select('id', 'name', 'email')->get()
            ->map(function($technician) use ($ticketCounts, $closedByTech, $allHolidays, $hasTrend, $prevScores) {
                $counts       = $ticketCounts->get($technician->id);
                $totalTickets = $counts ? (int) $counts->total_tickets : 0;

                if ($totalTickets === 0) {
                    return [
                        'id'                   => $technician->id,
                        'name'                 => $technician->name,
                        'email'                => $technician->email,
                        'total_tickets'        => 0,
                        'closed_tickets'       => 0,
                        'in_progress_tickets'  => 0,
                        'open_tickets'         => 0,
                        'resolution_rate'      => 0,
                        'avg_resolution_hours' => 0,
                        'avg_comments'         => 0,
                        'efficiency_score'     => 0,
                        'score_breakdown'      => $this->buildEfficiencyBreakdown(0, 0, 0),
                        'slowest_tickets'      => [],
                        'prev_score'           => $hasTrend ? ($prevScores[$technician->id] ?? null) : null,
                        'score_trend'          => null,
                    ];
                }

                $closedTickets     = (int) $counts->closed_tickets;
                $inProgressTickets = (int) $counts->in_progress_tickets;
                $openTickets       = (int) $counts->open_tickets;
                $resolutionRate    = round(($closedTickets / $totalTickets) * 100, 1);

                $techClosed = $closedByTech->get($technician->id, collect());
                $avgResolutionHours = 0;
                if ($techClosed->count() > 0) {
                    $totalHours = $techClosed->sum('working_hours');
                    $avgResolutionHours = round($totalHours / $techClosed->count(), 1);
                }

                $slowestTickets = $techClosed
                    ->map(function ($ticket) {
                        $workingHours = round((float) $ticket->working_hours, 1);

                        return [
                            'id' => $ticket->id,
                            'subject' => $ticket->subject,
                            'customer_name' => $ticket->customer?->name,
                            'working_hours' => $workingHours,
                            'closed_at' => optional($ticket->closed_at)->format('Y-m-d H:i'),
                        ];
                    })
                    ->sortByDesc('working_hours')
                    ->take(3)
                    ->values()
                    ->all();

                $currentScore = $this->calculateEfficiencyScore($resolutionRate, $avgResolutionHours, $totalTickets);
                $scoreBreakdown = $this->buildEfficiencyBreakdown($resolutionRate, $avgResolutionHours, $totalTickets);
                $prevScore    = $hasTrend ? ($prevScores[$technician->id] ?? null) : null;
                $scoreTrend   = ($prevScore !== null) ? round($currentScore - $prevScore, 1) : null;

                return [
                    'id'                   => $technician->id,
                    'name'                 => $technician->name,
                    'email'                => $technician->email,
                    'total_tickets'        => $totalTickets,
                    'closed_tickets'       => $closedTickets,
                    'in_progress_tickets'  => $inProgressTickets,
                    'open_tickets'         => $openTickets,
                    'resolution_rate'      => $resolutionRate,
                    'avg_resolution_hours' => $avgResolutionHours,
                    'avg_comments'         => 0,
                    'efficiency_score'     => $currentScore,
                    'score_breakdown'      => $scoreBreakdown,
                    'slowest_tickets'      => $slowestTickets,
                    'prev_score'           => $prevScore,
                    'score_trend'          => $scoreTrend,
                ];
            })->sortByDesc('efficiency_score')->values();

        $withTickets = $technicians->filter(fn($t) => $t['total_tickets'] > 0);

        return [
            'technicians' => $technicians,
            'date_from'   => $request->input('date_from', ''),
            'date_to'     => $request->input('date_to', ''),
            'summary'     => [
                'total_technicians'     => $technicians->count(),
                'total_tickets_handled' => $technicians->sum('total_tickets'),
                'avg_resolution_rate'   => $withTickets->count() > 0 ? round($withTickets->avg('resolution_rate'), 1) : 0,
                'avg_resolution_hours'  => $withTickets->count() > 0 ? round($withTickets->avg('avg_resolution_hours'), 1) : 0,
            ],
        ];
    }

    /**
     * Calcular puntuación de eficiencia del técnico
     */
    private function calculateEfficiencyScore($resolutionRate, $avgResolutionHours, $totalTickets)
    {
        // Fórmula de eficiencia:
        // 33% tasa de resolución
        // 34% rapidez (invertir horas - menos horas = mejor)
        // 33% volumen de tickets

        $resolutionScore = $resolutionRate * 0.33;

        // Normalizar horas (máximo 72 horas, mínimo mejor)
        $speedScore = $avgResolutionHours > 0
            ? (1 - min($avgResolutionHours / 72, 1)) * 34
            : 0;

        // Normalizar volumen (máximo 100 tickets para escala)
        $volumeScore = min($totalTickets / 100, 1) * 33;

        return round($resolutionScore + $speedScore + $volumeScore, 1);
    }

    private function buildEfficiencyBreakdown($resolutionRate, $avgResolutionHours, $totalTickets): array
    {
        $resolutionScore = round($resolutionRate * 0.33, 1);
        $speedScore = round(
            $avgResolutionHours > 0
                ? (1 - min($avgResolutionHours / 72, 1)) * 34
                : 0,
            1
        );
        $volumeScore = round(min($totalTickets / 100, 1) * 33, 1);

        $summary = sprintf(
            'Puntaje total %.1f basado en %.1f puntos por tasa de resolucion, %.1f por rapidez y %.1f por volumen.',
            round($resolutionScore + $speedScore + $volumeScore, 1),
            $resolutionScore,
            $speedScore,
            $volumeScore,
        );

        return [
            'summary' => $summary,
            'items' => [
                sprintf('Resolvio %.1f%% de sus tickets, aportando %.1f/33 puntos.', $resolutionRate, $resolutionScore),
                $avgResolutionHours > 0
                    ? sprintf('Promedio de cierre de %.1f horas laborables, equivalente a %.1f/34 puntos en rapidez.', $avgResolutionHours, $speedScore)
                    : 'Sin tickets cerrados en el periodo, por eso no suma puntos de rapidez.',
                sprintf('Atendio %d tickets, equivalente a %.1f/33 puntos por volumen.', $totalTickets, $volumeScore),
            ],
        ];
    }

    /**
     * Vista para exportar tickets
     */
    public function exportView()
    {
        $user = User::find(Auth::id());
        
        // Solo usuarios con permiso 'export analytics' pueden acceder
        /** @var \App\Models\User $user */
        if (!$user || !$user->hasPermissionTo('export analytics')) {
            abort(403, 'No tienes permisos para exportar tickets.');
        }

        $tickets = Ticket::with(['customer', 'support'])
            ->latest()
            ->get();

        return Inertia::render('ExportTickets', [
            'tickets' => $tickets
        ]);
    }

    /**
     * Estadísticas generales de tickets
     */
    public function getTicketStats(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = User::find(Auth::id());
        if (!$user || !$user->hasPermissionTo('stats analytics')) {
            abort(403, 'No tienes permisos para ver estas estadísticas.');
        }

        $data = $this->buildTicketStatsData($request);

        return Inertia::render('Analytics/TicketStats', $data);
    }

    public function exportTicketStatsExcel(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = User::find(Auth::id());
        if (!$user || !$user->hasPermissionTo('stats analytics')) {
            abort(403, 'No tienes permisos para exportar estas estadísticas.');
        }

        $data = $this->buildTicketStatsData($request);
        $csv = $this->buildTicketStatsCsv($data);
        $fileName = 'estadisticas_tickets_' . now()->format('Y-m-d_H-i-s') . '.csv';

        return response($csv)
            ->header('Content-Type', 'text/csv; charset=utf-8')
            ->header('Content-Disposition', 'attachment; filename="' . $fileName . '"')
            ->header('Pragma', 'no-cache')
            ->header('Cache-Control', 'must-revalidate, post-check=0, pre-check=0')
            ->header('Expires', '0');
    }

    public function exportTicketStatsPdf(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = User::find(Auth::id());
        if (!$user || !$user->hasPermissionTo('stats analytics')) {
            abort(403, 'No tienes permisos para exportar estas estadísticas.');
        }

        $data = $this->buildTicketStatsData($request);

        $pdf = Pdf::loadView('exports.ticket-stats-pdf', [
            'summary' => $data['summary'],
            'top_customers' => $data['top_customers'],
            'top_subjects' => $data['top_subjects'],
            'top_serials' => $data['top_serials'],
            'top_cities' => $data['top_cities'],
            'tickets_by_day' => $data['tickets_by_day'],
            'tickets_by_month' => $data['tickets_by_month'],
            'top_technicians' => $data['top_technicians'],
            'customer_name' => $data['customer_name'],
            'date_from' => $data['date_from'],
            'date_to' => $data['date_to'],
        ]);
        $pdf->setPaper('a4', 'portrait');

        $fileName = 'estadisticas_tickets_' . now()->format('Y-m-d_H-i-s') . '.pdf';
        return $pdf->download($fileName);
    }

    private function buildTicketStatsData(Request $request): array
    {

        $dateFrom = $request->input('date_from')
            ? \Carbon\Carbon::parse($request->input('date_from'))->startOfDay()
            : null;
        $dateTo = $request->input('date_to')
            ? \Carbon\Carbon::parse($request->input('date_to'))->endOfDay()
            : null;
        $customerName = $request->input('customer_name') ? trim($request->input('customer_name')) : null;

        $baseQuery = fn() => Ticket::query()
            ->when($dateFrom,    fn($q) => $q->where('created_at', '>=', $dateFrom))
            ->when($dateTo,      fn($q) => $q->where('created_at', '<=', $dateTo))
            ->when($customerName, fn($q) => $q->whereHas('customer',
                fn($cq) => $cq->whereRaw('LOWER(TRIM(name)) = LOWER(?)', [$customerName])
            ));

        // ── Totales generales ──
        $total       = $baseQuery()->count();
        $closed      = $baseQuery()->where('status', 'Closed')->count();
        $inProgress  = $baseQuery()->where('status', 'In Progress')->count();
        $open        = $baseQuery()->where('status', 'Open')->count();

        // ── Clientes que más tickets crean (top 10) ──
        if ($customerName) {
            // Con filtro de empresa: mostrar nombre de usuario individual (name_user)
            $topCustomers = $baseQuery()
                ->select('customer_id', DB::raw('COUNT(*) as total'))
                ->whereNotNull('customer_id')
                ->groupBy('customer_id')
                ->orderByDesc('total')
                ->limit(7)
                ->with('customer:id,name,name_user')
                ->get()
                ->map(fn($row) => [
                    'name'  => $row->customer?->name_user ?? $row->customer?->name ?? 'Sin nombre',
                    'total' => (int) $row->total,
                ]);
        } else {
            // Sin filtro: agrupar por nombre de empresa (deduplicado)
            $topCustomers = $baseQuery()
                ->join('customers', 'tickets.customer_id', '=', 'customers.id')
                ->select(DB::raw('LOWER(TRIM(customers.name)) as company_norm'), DB::raw('COUNT(*) as total'))
                ->whereNotNull('tickets.customer_id')
                ->groupByRaw('LOWER(TRIM(customers.name))')
                ->orderByDesc('total')
                ->limit(7)
                ->get()
                ->map(fn($row) => [
                    'name'  => ucwords($row->company_norm),
                    'total' => (int) $row->total,
                ]);
        }

        // ── Asuntos más repetitivos (top 10, normalizado) ──
        $topSubjects = $baseQuery()
            ->select(DB::raw('LOWER(TRIM(subject)) as subject_norm'), DB::raw('COUNT(*) as total'))
            ->whereNotNull('subject')
            ->where('subject', '!=', '')
            ->groupBy('subject_norm')
            ->orderByDesc('total')
            ->limit(7)
            ->get()
            ->map(fn($row) => [
                'subject' => ucfirst($row->subject_norm),
                'total'   => (int) $row->total,
            ]);

        // ── Seriales de máquinas más repetitivos (top 10) ──
        $excludedSerials = ['0', 'por confirmar', '.', 'desconocido', 'todas'];

        $topSerials = $baseQuery()
            ->select('serial', DB::raw('COUNT(*) as total'))
            ->whereNotNull('serial')
            ->whereRaw('TRIM(serial) != ?', [''])
            ->whereRaw('LOWER(TRIM(serial)) NOT IN (?, ?, ?, ?, ?)', $excludedSerials)
            ->groupBy('serial')
            ->orderByDesc('total')
            ->limit(7)
            ->get()
            ->map(fn($row) => [
                'serial' => $row->serial,
                'total'  => (int) $row->total,
            ]);

        // ── Ciudades con más tickets (top 8) ──
        $topCities = $baseQuery()
            ->select(DB::raw('LOWER(TRIM(ciudad)) as city_norm'), DB::raw('COUNT(*) as total'))
            ->whereNotNull('ciudad')
            ->where('ciudad', '!=', '')
            ->groupBy('city_norm')
            ->orderByDesc('total')
            ->limit(7)
            ->get()
            ->map(fn($row) => [
                'city'  => ucfirst($row->city_norm),
                'total' => (int) $row->total,
            ]);

        // ── Tickets por día de la semana ──
        $byDayOfWeek = $baseQuery()
            ->select(DB::raw('DAYOFWEEK(created_at) as dow'), DB::raw('COUNT(*) as total'))
            ->groupBy('dow')
            ->orderBy('dow')
            ->get()
            ->keyBy('dow');

        $days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        $ticketsByDay = collect(range(1, 7))->map(fn($d) => [
            'day'   => $days[$d - 1],
            'total' => (int) ($byDayOfWeek->get($d)?->total ?? 0),
        ])->values();

        // ── Tickets por mes (últimos 12 meses o dentro del rango) ──
        $byMonth = $baseQuery()
            ->select(
                DB::raw('YEAR(created_at) as year'),
                DB::raw('MONTH(created_at) as month'),
                DB::raw('COUNT(*) as total')
            )
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get()
            ->map(fn($row) => [
                'label' => \Carbon\Carbon::createFromDate($row->year, $row->month, 1)->translatedFormat('M Y'),
                'total' => (int) $row->total,
            ]);

        // ── Técnico con más tickets asignados (top 7) ──
        $topTechnicians = $baseQuery()
            ->select('support_id', DB::raw('COUNT(*) as total'))
            ->whereNotNull('support_id')
            ->groupBy('support_id')
            ->orderByDesc('total')
            ->limit(7)
            ->with('support:id,name')
            ->get()
            ->map(fn($row) => [
                'name'  => $row->support?->name ?? 'Sin asignar',
                'total' => (int) $row->total,
            ]);

        // ── Lista de clientes para el filtro de busqueda (deduplicado por nombre) ──
        $customers = Customer::whereHas('tickets')
            ->selectRaw('LOWER(TRIM(name)) as name_norm')
            ->groupByRaw('LOWER(TRIM(name))')
            ->orderBy('name_norm')
            ->get()
            ->map(fn($c) => ['name' => ucwords($c->name_norm)]);

        return [
            'summary' => [
                'total'       => $total,
                'closed'      => $closed,
                'in_progress' => $inProgress,
                'open'        => $open,
                'resolution_rate' => $total > 0 ? round(($closed / $total) * 100, 1) : 0,
            ],
            'top_customers'   => $topCustomers->values()->all(),
            'top_subjects'    => $topSubjects->values()->all(),
            'top_serials'     => $topSerials->values()->all(),
            'top_cities'      => $topCities->values()->all(),
            'tickets_by_day'  => $ticketsByDay->values()->all(),
            'tickets_by_month'=> $byMonth->values()->all(),
            'top_technicians' => $topTechnicians->values()->all(),
            'customers'       => $customers->values()->all(),
            'customer_name'   => $customerName,
            'date_from'       => $request->input('date_from', ''),
            'date_to'         => $request->input('date_to', ''),
        ];
    }

    private function buildTicketStatsCsv(array $data): string
    {
        $rows = [];

        $rows[] = ['RESUMEN'];
        $rows[] = ['Metrica', 'Valor'];
        $rows[] = ['Total tickets', $data['summary']['total'] ?? 0];
        $rows[] = ['Cerrados', $data['summary']['closed'] ?? 0];
        $rows[] = ['En progreso', $data['summary']['in_progress'] ?? 0];
        $rows[] = ['Abiertos', $data['summary']['open'] ?? 0];
        $rows[] = ['Tasa de resolucion (%)', $data['summary']['resolution_rate'] ?? 0];
        $rows[] = [];

        $rows[] = ['FILTROS'];
        $rows[] = ['Desde', $data['date_from'] ?: 'Todos'];
        $rows[] = ['Hasta', $data['date_to'] ?: 'Todos'];
        $rows[] = ['Cliente', $data['customer_name'] ?: 'Todos'];
        $rows[] = [];

        $appendSection = function (string $title, array $headers, array $items, string $keyA, string $keyB) use (&$rows) {
            $rows[] = [$title];
            $rows[] = $headers;
            if (empty($items)) {
                $rows[] = ['Sin datos', ''];
                $rows[] = [];
                return;
            }
            foreach ($items as $item) {
                $rows[] = [
                    (string) ($item[$keyA] ?? ''),
                    (string) ($item[$keyB] ?? 0),
                ];
            }
            $rows[] = [];
        };

        $appendSection('TOP CLIENTES', ['Cliente', 'Total'], $data['top_customers'] ?? [], 'name', 'total');
        $appendSection('TOP ASUNTOS', ['Asunto', 'Total'], $data['top_subjects'] ?? [], 'subject', 'total');
        $appendSection('TOP SERIALES', ['Serial', 'Total'], $data['top_serials'] ?? [], 'serial', 'total');
        $appendSection('TOP CIUDADES', ['Ciudad', 'Total'], $data['top_cities'] ?? [], 'city', 'total');
        $appendSection('TICKETS POR DIA', ['Dia', 'Total'], $data['tickets_by_day'] ?? [], 'day', 'total');
        $appendSection('TICKETS POR MES', ['Mes', 'Total'], $data['tickets_by_month'] ?? [], 'label', 'total');
        $appendSection('TOP TECNICOS', ['Tecnico', 'Total'], $data['top_technicians'] ?? [], 'name', 'total');

        ob_start();
        $output = fopen('php://output', 'w');
        fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));
        foreach ($rows as $row) {
            fputcsv($output, $row);
        }
        fclose($output);

        return ob_get_clean() ?: '';
    }
}
