<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Support;
use App\Models\Ticket;
use App\Models\TicketDocument;
use App\Models\TicketComment;
use App\Models\TicketCommentAttachment;
use App\Models\TicketHistory;
use App\Models\User;
use App\Helpers\DateHelper;
use App\Services\CacheService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Inertia\Inertia;

class TicketController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:view ticket')->only(['index', 'show']);
        $this->middleware('permission:create ticket')->only(['create', 'store', 'duplicate']);
        $this->middleware('permission:edit ticket')->only(['edit', 'update', 'deleteDocument']);
        $this->middleware('permission:view ticket')->only(['downloadDocument', 'updateStatus']);
    }

    /**
     * Traducir estado al español
     */
    private function translateStatus($status)
    {
        $translations = [
            'Open' => 'Abierto',
            'In Progress' => 'En Progreso',
            'Closed' => 'Cerrado'
        ];
        return $translations[$status] ?? $status;
    }
    /**
     * Display a listing of the resource.
     */
    /* public function index()
    {
        $tickets = Ticket::with(['customer', 'support'])->latest()->paginate(10);
        return Inertia::render('Tickets/Index', [
            'tickets' => $tickets
        ]);
    } */

    public function index(Request $request) {
        $userId = Auth::id();
        $user = User::find($userId);

        // Leer parámetros de filtro
        $ticketId       = $request->query('ticket_id');
        $companyName    = $request->query('company_name');   // empresa (agrupa múltiples customer_id)
        $supportId      = $request->query('support_id');
        $subject        = $request->query('subject');
        $serial         = $request->query('serial');
        $status         = $request->query('status');
        $dateFrom       = $request->query('date_from');
        $dateTo         = $request->query('date_to');
        $clienteExterno = $request->query('cliente_externo');
        $isComercial    = $user && $user->hasRole('Comercial');

        $query = Ticket::select('id', 'customer_id', 'support_id', 'user_id', 'subject', 'description',
                                'status', 'brand', 'model', 'serial', 'phone', 'address',
                                'created_at', 'updated_at', 'assigned_at', 'closed_at',
                                'ciudad', 'nombre_contacto', 'cliente_externo')
                       ->with([
                           'customer:id,name,email',
                           'support:id,name,email',
                           'user:id,name',
                       ])
                       ->withCount('documents');

        // Restricciones por rol
        if ($user && $user->hasRole('support')) {
            $support = Support::where('email', $user->email)->first();
            $support ? $query->where('support_id', $support->id) : $query->whereRaw('1 = 0');
        } elseif ($user && $user->hasRole('customer')) {
            $customer = Customer::where('email', $user->email)->first();
            $customer ? $query->where('customer_id', $customer->id) : $query->whereRaw('1 = 0');
        } elseif ($user && $user->hasRole('Comercial')) {
            // Comercial solo ve los tickets que él mismo creó
            $query->where('user_id', $userId);
        }

        // Aplicar filtros
        if ($ticketId)   $query->where('id', $ticketId);
        if (!$isComercial && $companyName) {
            // Obtener todos los customer_id que pertenecen a esa empresa
            $customerIds = Customer::where('name', $companyName)->pluck('id');
            $query->whereIn('customer_id', $customerIds);
        }
        if ($isComercial && $clienteExterno) $query->where('cliente_externo', 'like', "%{$clienteExterno}%");
        if ($supportId === 'unassigned') {
            $query->whereNull('support_id');
        } elseif ($supportId) {
            $query->where('support_id', $supportId);
        }
        if ($subject)    $query->where('subject', $subject);
        if ($serial)     $query->where('serial', 'like', "%{$serial}%");
        if ($status)     $query->where('status', $status);
        if ($dateFrom)   $query->whereDate('created_at', '>=', $dateFrom);
        if ($dateTo)     $query->whereDate('created_at', '<=', $dateTo);

        $tickets = $query->latest()->paginate(10)->withQueryString();

        // Obtener empresas únicas para el dropdown (agrupa múltiples usuarios de la misma empresa)
        $allCustomers = CacheService::getCompanyNames();
        $allSupports  = CacheService::getSupportsList();

        return Inertia::render('Tickets/Index', [
            'tickets'      => $tickets,
            'allCustomers' => $allCustomers,
            'allSupports'  => $allSupports,
            'isComercial'  => $isComercial,
            'filters'      => [
                'ticket_id'      => $ticketId       ?? '',
                'company_name'   => $companyName    ?? 'all',
                'support_id'     => $supportId      ?? 'all',
                'subject'        => $subject        ?? 'all',
                'serial'         => $serial         ?? '',
                'status'         => $status         ?? 'all',
                'date_from'      => $dateFrom      ?? '',
                'date_to'        => $dateTo        ?? '',
                'cliente_externo'=> $clienteExterno ?? '',
            ],
        ]);
    }
    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $userId = Auth::id();
        $user = User::find($userId);
        $sourceTicketId = request()->integer('from_ticket');
        $sourceTicket = $sourceTicketId ? Ticket::with(['customer:id,name'])->find($sourceTicketId) : null;

        if ($sourceTicket) {
            if ($user && $user->hasRole('support')) {
                $support = Support::where('email', $user->email)->first();
                if (!$support || $sourceTicket->support_id !== $support->id) {
                    abort(403, 'No tienes autorización para duplicar este ticket.');
                }
            } elseif ($user && $user->hasRole('customer')) {
                $customer = Customer::where('email', $user->email)->first();
                if (!$customer || $sourceTicket->customer_id !== $customer->id) {
                    abort(403, 'No tienes autorización para duplicar este ticket.');
                }
            } elseif ($user && $user->hasRole('Comercial')) {
                if ($sourceTicket->user_id !== $userId) {
                    abort(403, 'No tienes autorización para duplicar este ticket.');
                }
            }
        }

        $duplicateFromTicket = $sourceTicket ? [
            'id' => $sourceTicket->id,
            'company_name' => $sourceTicket->customer?->name,
            'customer_id' => $sourceTicket->customer_id,
            'cliente_externo' => $sourceTicket->cliente_externo,
            'support_id' => $sourceTicket->support_id,
            'subject' => $sourceTicket->subject,
            'description' => $sourceTicket->description,
            'phone' => $sourceTicket->phone,
            'nombre_contacto' => $sourceTicket->nombre_contacto,
            'address' => $sourceTicket->address,
            'brand' => $sourceTicket->brand,
            'model' => $sourceTicket->model,
            'serial' => $sourceTicket->serial,
            'status' => 'Open',
        ] : null;

        // Siempre consultar BD directamente en formularios para garantizar datos en tiempo real
        $supports = CacheService::getSupportsList();

        // Si el usuario es cliente, solo mostrar sus datos
        if ($user && $user->hasRole('customer')) {
            $customer = Customer::where('email', $user->email)->first();
            if (!$customer) {
                abort(403, 'No tienes un perfil de cliente asociado.');
            }

            return Inertia::render('Tickets/Create', [
                'customers' => collect([$customer]),
                'supports' => $supports,
                'companies' => collect([$customer->name]),
                'isCustomer' => true,
                'preselectedCustomer' => $customer,
                'duplicateFromTicket' => $duplicateFromTicket,
            ]);
        }

        // Para administradores y soporte: datos frescos desde la BD
        $customers = CacheService::getCustomersList();
        $companies = CacheService::getCompanyNames();

        // Para Comercial: vista simplificada con un solo campo "Cliente"
        if ($user && $user->hasRole('Comercial')) {
            return Inertia::render('Tickets/Create', [
                'customers' => $customers,
                'supports' => $supports,
                'companies' => $companies,
                'isCustomer' => false,
                'isComercial' => true,
                'duplicateFromTicket' => $duplicateFromTicket,
            ]);
        }

        return Inertia::render('Tickets/Create', [
            'customers' => $customers,
            'supports' => $supports,
            'companies' => $companies,
            'isCustomer' => false,
            'isComercial' => false,
            'duplicateFromTicket' => $duplicateFromTicket,
        ]);
    }

    public function duplicate(Ticket $ticket)
    {
        return redirect()->route('tickets.create', ['from_ticket' => $ticket->id]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $userId = Auth::id();
        $user = User::find($userId);

        // Si el usuario es cliente, verificar que solo cree tickets para él mismo
        if ($user && $user->hasRole('customer')) {
            $customer = Customer::where('email', $user->email)->first();
            if (!$customer) {
                return redirect()->back()->with('error', 'No tienes un perfil de cliente asociado.');
            }
            
            // Verificar que el customer_id enviado corresponda al cliente autenticado
            if ($request->customer_id != $customer->id) {
                return redirect()->back()->with('error', 'No puedes crear tickets para otros clientes.');
            }
        }

        try {
            $isComercial = $user && $user->hasRole('Comercial');

            // Validación base
            $rules = [
                'request_uuid' => 'required|string|max:80',
                'support_id' => 'nullable|exists:supports,id',
                'subject' => 'required|in:Mantenimiento Preventivo,Manchas,Atascos,Instalación,Configuración ó Escaner,Código de Error,Remoto,Servicio de Ingeniería,Solicitud de Toner,Contadores,Otros',
                'description' => 'required|string',
                'phone' => 'required|string|max:20',
                'nombre_contacto' => 'required|string|max:255',
                'address' => 'required|string|max:255',
                'status' => 'required|in:Open,In Progress,Closed',
                'documents.*' => 'nullable|file|max:10240|mimes:pdf,doc,docx,txt,jpg,jpeg,png,xlsx,xls'
            ];

            // Para Comercial: cliente_externo es obligatorio, customer_id no aplica
            if ($isComercial) {
                $rules['cliente_externo'] = 'required|string|max:255';
            } else {
                $rules['customer_id'] = 'required|exists:customers,id';
            }

            // Si el asunto es "Solicitud de Toner" o "Contadores", marca, modelo y serial son opcionales
            if ($request->subject === 'Solicitud de Toner' || $request->subject === 'Contadores') {
                $rules['brand'] = 'nullable|string|max:100';
                $rules['model'] = 'nullable|string|max:100';
                $rules['serial'] = 'nullable|string|max:100';
            } else {
                // Para otros asuntos, todos los campos son obligatorios
                $rules['brand'] = 'required|string|max:100';
                $rules['model'] = 'required|string|max:100';
                $rules['serial'] = 'required|string|max:100';
            }

            $validated = $request->validate($rules);

            // Idempotencia por usuario: evita creación duplicada por doble click/reintentos.
            $existingTicket = Ticket::where('user_id', $userId)
                ->where('request_uuid', $validated['request_uuid'])
                ->first();

            if ($existingTicket) {
                return redirect()
                    ->route('tickets.index')
                    ->with('info', 'Este ticket ya había sido creado previamente.');
            }

            // Para Comercial no hay customer_id
            if ($isComercial) {
                $validated['customer_id'] = null;
            }

            // Crear el ticket con timestamp correcto
            $validated['user_id'] = $userId;
            $validated['created_at'] = DateHelper::nowColombia();
            $validated['updated_at'] = DateHelper::nowColombia();
            
            // Si se asigna un técnico al crear, registrar assigned_at
            if (!empty($validated['support_id'])) {
                $validated['assigned_at'] = DateHelper::nowColombia();
            }
            
            // Capturar la ciudad del usuario automáticamente
            $validated['ciudad'] = $user->ciudad ?? 'No especificada';
            
            // Si los campos están vacíos, asignar "0" para conservar el comportamiento anterior
            $validated['brand'] = $validated['brand'] ?? '0';
            $validated['model'] = $validated['model'] ?? '0';
            $validated['serial'] = $validated['serial'] ?? '0';
            
            $ticket = Ticket::create($validated);

            // Procesar archivos si existen
            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $file) {
                    $originalName = $file->getClientOriginalName();
                    $fileName = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                    $filePath = $file->storeAs('ticket-documents', $fileName, config('filesystems.default'));

                    TicketDocument::create([
                        'ticket_id' => $ticket->id,
                        'original_name' => $originalName,
                        'file_name' => $fileName,
                        'file_path' => $filePath,
                        'disk_name' => config('filesystems.default'),
                        'mime_type' => $file->getMimeType(),
                        'file_size' => $file->getSize()
                    ]);
                }
            }

            // Registrar en el historial
            TicketHistory::create([
                'ticket_id' => $ticket->id,
                'user_id' => $userId,
                'action' => 'created',
                'field' => null,
                'old_value' => null,
                'new_value' => $ticket->status,
                'description' => 'Ticket creado'
            ]);

            return redirect()
                ->route('tickets.index')
                ->with('success', 'Ticket creado exitosamente!');
        } catch (QueryException $e) {
            // Si dos requests concurrentes usan el mismo request_uuid,
            // la restricción única evita duplicados y retornamos éxito idempotente.
            if ($e->getCode() === '23000') {
                return redirect()
                    ->route('tickets.index')
                    ->with('info', 'Este ticket ya había sido creado previamente.');
            }

            throw $e;
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Ocurrió un error inesperado: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Ticket $ticket)
    {
        $userId = Auth::id();
        $user = User::find($userId);

        // Si el usuario es técnico de soporte, verificar que el ticket esté asignado a él
        if ($user && $user->hasRole('support')) {
            $support = Support::where('email', $user->email)->first();
            if (!$support || $ticket->support_id !== $support->id) {
                abort(403, 'No tienes autorización para ver este ticket.');
            }
        }
        // Si el usuario es cliente, verificar que el ticket sea suyo
        elseif ($user && $user->hasRole('customer')) {
            $customer = Customer::where('email', $user->email)->first();
            if (!$customer || $ticket->customer_id !== $customer->id) {
                abort(403, 'No tienes autorización para ver este ticket.');
            }
        }
        // Si el usuario es Comercial, solo puede ver tickets que él creó
        elseif ($user && $user->hasRole('Comercial')) {
            if ($ticket->user_id !== $userId) {
                abort(403, 'No tienes autorización para ver este ticket.');
            }
        }

        $ticket->load([
            'customer:id,name,email,phone,name_user',
            'support:id,name,email,phone',
            'user:id,name,email',
            'documents:id,ticket_id,file_name,file_path,mime_type,file_size,created_at',
            'comments' => function($query) {
                $query->select('id', 'ticket_id', 'user_id', 'comment', 'created_at')
                      ->orderBy('created_at', 'desc');
            },
            'comments.user:id,name,email',
            'comments.attachments:id,ticket_comment_id,file_name,file_path,mime_type,file_size',
            'histories' => function($query) {
                $query->select('id', 'ticket_id', 'user_id', 'field', 'old_value', 'new_value', 'created_at')
                      ->orderBy('created_at', 'desc');
            },
            'histories.user:id,name',
            'pendingParts:id,ticket_id,user_id,completed_by_user_id,part_name,part_code,status,created_at,completed_at',
            'pendingParts.user:id,name'
        ]);
        
        return Inertia::render('Tickets/Show', [
            'ticket' => $ticket
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Ticket $ticket)
    {
        $userId = Auth::id();
        $user = User::find($userId);

        // Si el usuario es técnico de soporte, verificar que el ticket esté asignado a él
        if ($user && $user->hasRole('support')) {
            $support = Support::where('email', $user->email)->first();
            if (!$support || $ticket->support_id !== $support->id) {
                abort(403, 'No tienes autorización para editar este ticket.');
            }
        }
        // Si el usuario es cliente, verificar que el ticket sea suyo
        elseif ($user && $user->hasRole('customer')) {
            $customer = Customer::where('email', $user->email)->first();
            if (!$customer || $ticket->customer_id !== $customer->id) {
                abort(403, 'No tienes autorización para editar este ticket.');
            }
        }
        // Si el usuario es Comercial, solo puede editar tickets que él creó
        elseif ($user && $user->hasRole('Comercial')) {
            if ($ticket->user_id !== $userId) {
                abort(403, 'No tienes autorización para editar este ticket.');
            }
        }

        // Siempre consultar BD directamente para garantizar datos en tiempo real
        $customers = Customer::select('id', 'name', 'name_user', 'email')->orderBy('name')->get();
        $supports = Support::select('id', 'name', 'email', 'speciality')->orderBy('name')->get();

        return Inertia::render('Tickets/Edit', [
            'ticket' => $ticket->load([
                'customer:id,name',
                'support:id,name',
                'documents:id,ticket_id,file_name,file_path,file_size'
            ]),
            'customers' => $customers,
            'supports' => $supports
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Ticket $ticket)
    {
        $userId = Auth::id();
        $user = User::find($userId);
        $isCommercialTicket = filled($ticket->cliente_externo) || is_null($ticket->customer_id);

        // Si el usuario es técnico de soporte, verificar que el ticket esté asignado a él
        if ($user && $user->hasRole('support')) {
            $support = Support::where('email', $user->email)->first();
            if (!$support || $ticket->support_id !== $support->id) {
                return redirect()->back()->with('error', 'No tienes autorización para editar este ticket.');
            }
        }
        // Si el usuario es cliente, verificar que el ticket sea suyo
        elseif ($user && $user->hasRole('customer')) {
            $customer = Customer::where('email', $user->email)->first();
            if (!$customer || $ticket->customer_id !== $customer->id) {
                return redirect()->back()->with('error', 'No tienes autorización para editar este ticket.');
            }
        }
        // Si el usuario es Comercial, solo puede actualizar tickets que él creó
        elseif ($user && $user->hasRole('Comercial')) {
            if ($ticket->user_id !== $userId) {
                return redirect()->back()->with('error', 'No tienes autorización para editar este ticket.');
            }
        }

        try {
            // Validación base
            $rules = [
                'support_id' => 'nullable|exists:supports,id',
                'subject' => 'required|in:Mantenimiento Preventivo,Manchas,Atascos,Instalación,Configuración ó Escaner,Código de Error,Remoto,Servicio de Ingeniería,Solicitud de Toner,Contadores,Otros',
                'description' => 'required|string|min:1',
                'phone' => 'required|string|max:20',
                'nombre_contacto' => 'required|string|max:255',
                'address' => 'required|string|max:255',
                'ciudad' => 'nullable|string|max:100',
                'status' => 'required|in:Open,In Progress,Closed',
                'documents.*' => 'nullable|file|max:10240|mimes:pdf,doc,docx,txt,jpg,jpeg,png,xlsx,xls'
            ];

            if ($isCommercialTicket) {
                $rules['cliente_externo'] = 'required|string|max:255';
                $rules['customer_id'] = 'nullable';
            } else {
                $rules['customer_id'] = 'required|exists:customers,id';
                $rules['cliente_externo'] = 'nullable|string|max:255';
            }

            // Si el asunto es "Solicitud de Toner" o "Contadores", marca, modelo y serial son opcionales
            if ($request->subject === 'Solicitud de Toner' || $request->subject === 'Contadores') {
                $rules['brand'] = 'nullable|string|max:100';
                $rules['model'] = 'nullable|string|max:100';
                $rules['serial'] = 'nullable|string|max:100';
            } else {
                $rules['brand'] = 'required|string|max:100';
                $rules['model'] = 'required|string|max:100';
                $rules['serial'] = 'required|string|max:100';
            }

            $validated = $request->validate($rules);

            if ($isCommercialTicket) {
                unset($validated['customer_id']);
            } else {
                unset($validated['cliente_externo']);
            }

            if ($user && $user->hasRole('customer')) {
                $customer = Customer::where('email', $user->email)->first();
                if ($customer && isset($validated['customer_id']) && (int) $validated['customer_id'] !== (int) $customer->id) {
                    return redirect()->back()->with('error', 'No puedes cambiar el cliente del ticket.');
                }
            }

            // Asignar valores por defecto para Solicitud de Toner o Contadores si están vacíos
            if ($request->subject === 'Solicitud de Toner' || $request->subject === 'Contadores') {
                $validated['brand'] = $validated['brand'] ?? '0';
                $validated['model'] = $validated['model'] ?? '0';
                $validated['serial'] = $validated['serial'] ?? '0';
            }

            // Detectar cambios y registrar en historial
            $changes = [];
            
            // Cambio de estado
            if (isset($validated['status']) && $ticket->status !== $validated['status']) {
                $oldStatusEs = $this->translateStatus($ticket->status);
                $newStatusEs = $this->translateStatus($validated['status']);
                
                $changes[] = [
                    'action' => $validated['status'] === 'Open' ? 'reopened' : 'status_changed',
                    'field' => 'status',
                    'old_value' => $oldStatusEs,
                    'new_value' => $newStatusEs,
                    'description' => "Estado cambiado de {$oldStatusEs} a {$newStatusEs}"
                ];
            }

            // Cambio de técnico asignado
            if (isset($validated['support_id']) && $ticket->support_id !== $validated['support_id']) {
                $oldSupport = $ticket->support ? $ticket->support->name : 'Sin asignar';
                $newSupport = $validated['support_id'] ? Support::find($validated['support_id'])->name : 'Sin asignar';
                
                // Registrar assigned_at solo si se está asignando un técnico nuevo
                if ($validated['support_id'] && !$ticket->support_id) {
                    // Primera asignación
                    $validated['assigned_at'] = DateHelper::nowColombia();
                } elseif ($validated['support_id'] && $ticket->support_id !== $validated['support_id']) {
                    // Cambio de técnico - actualizar assigned_at
                    $validated['assigned_at'] = DateHelper::nowColombia();
                } elseif (!$validated['support_id']) {
                    // Se desasigna el técnico - limpiar assigned_at
                    $validated['assigned_at'] = null;
                }
                
                $changes[] = [
                    'action' => 'assigned',
                    'field' => 'support_id',
                    'old_value' => $oldSupport,
                    'new_value' => $newSupport,
                    'description' => "Técnico cambiado de {$oldSupport} a {$newSupport}"
                ];
            }

            // Otros cambios
            $fieldsToTrack = ['subject', 'description', 'phone', 'nombre_contacto', 'address', 'ciudad', 'brand', 'model', 'serial', 'cliente_externo', 'customer_id'];
            foreach ($fieldsToTrack as $field) {
                if (isset($validated[$field]) && $ticket->$field !== $validated[$field]) {
                    $fieldLabels = [
                        'subject' => 'Asunto',
                        'description' => 'Descripción',
                        'phone' => 'Teléfono',
                        'nombre_contacto' => 'Nombre de contacto',
                        'address' => 'Dirección',
                        'ciudad' => 'Ciudad',
                        'brand' => 'Marca',
                        'model' => 'Modelo',
                        'serial' => 'Serie',
                        'cliente_externo' => 'Cliente externo',
                        'customer_id' => 'Cliente'
                    ];

                    $oldValue = $ticket->$field;
                    $newValue = $validated[$field];

                    if ($field === 'customer_id') {
                        $oldValue = $ticket->customer?->name ?? 'Sin cliente';
                        $newValue = Customer::find($validated['customer_id'])?->name ?? 'Sin cliente';
                    }
                    
                    $changes[] = [
                        'action' => 'updated',
                        'field' => $field,
                        'old_value' => $oldValue,
                        'new_value' => $newValue,
                        'description' => "{$fieldLabels[$field]} actualizado"
                    ];
                }
            }

            $ticket->update($validated);

            // Registrar todos los cambios en el historial
            foreach ($changes as $change) {
                TicketHistory::create([
                    'ticket_id' => $ticket->id,
                    'user_id' => $userId,
                    'action' => $change['action'],
                    'field' => $change['field'],
                    'old_value' => $change['old_value'],
                    'new_value' => $change['new_value'],
                    'description' => $change['description']
                ]);
            }

            // Procesar nuevos archivos si existen
            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $file) {
                    $originalName = $file->getClientOriginalName();
                    $fileName = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                    $filePath = $file->storeAs('ticket-documents', $fileName, config('filesystems.default'));

                    TicketDocument::create([
                        'ticket_id' => $ticket->id,
                        'original_name' => $originalName,
                        'file_name' => $fileName,
                        'file_path' => $filePath,
                        'disk_name' => config('filesystems.default'),
                        'mime_type' => $file->getMimeType(),
                        'file_size' => $file->getSize()
                    ]);
                }
            }

            return redirect()
                ->route('tickets.index')
                ->with('success', 'Ticket actualizado exitosamente!');
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', 'No se pudo actualizar el ticket: ' . $e->getMessage());
        }
    }

    /**
     * Update only the status of the ticket (for support users)
     */
    public function updateStatus(Request $request, Ticket $ticket)
    {
        $userId = Auth::id();
        $user = User::find($userId);

        // Si el usuario es técnico de soporte, verificar que el ticket esté asignado a él
        if ($user && $user->hasRole('support')) {
            $support = Support::where('email', $user->email)->first();
            if (!$support || $ticket->support_id !== $support->id) {
                return redirect()->back()->with('error', 'No tienes autorización para actualizar este ticket.');
            }
        }
        // Si el usuario es cliente, no puede cambiar el estado
        elseif ($user && $user->hasRole('customer')) {
            return redirect()->back()->with('error', 'No tienes autorización para cambiar el estado.');
        }

        try {
            $validated = $request->validate([
                'status' => 'required|in:Open,In Progress,Closed',
            ]);

            $oldStatus = $ticket->status;
            
            $updateData = [
                'status' => $validated['status'],
                'updated_at' => DateHelper::nowColombia(),
            ];

            if ($validated['status'] === 'In Progress' && !$ticket->assigned_at) {
                $updateData['assigned_at'] = DateHelper::nowColombia();
            }

            // Si el estado es "Closed", establecer la fecha de cierre
            if ($validated['status'] === 'Closed') {
                $updateData['closed_at'] = DateHelper::nowColombia();
            } else {
                // Si se reabre el ticket, limpiar la fecha de cierre
                $updateData['closed_at'] = null;
            }

            $ticket->update($updateData);

            // Registrar cambio de estado en el historial
            $oldStatusEs = $this->translateStatus($oldStatus);
            $newStatusEs = $this->translateStatus($validated['status']);
            
            TicketHistory::create([
                'ticket_id' => $ticket->id,
                'user_id' => $userId,
                'action' => $validated['status'] === 'Open' && $oldStatus === 'Closed' ? 'reopened' : 'status_changed',
                'field' => 'status',
                'old_value' => $oldStatusEs,
                'new_value' => $newStatusEs,
                'description' => "Estado cambiado de {$oldStatusEs} a {$newStatusEs}"
            ]);

            return redirect()
                ->back()
                ->with('success', 'Estado del ticket actualizado exitosamente!');
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', 'No se pudo actualizar el estado: ' . $e->getMessage());
        }
    }

    public function createVisitReport(Ticket $ticket)
    {
        $userId = Auth::id();
        $user = User::find($userId);

        if ($user && $user->hasAnyRole(['support', 'Almacenista'])) {
            $support = Support::where('email', $user->email)->first();
            if (!$support || $ticket->support_id !== $support->id) {
                abort(403, 'No tienes autorización para generar este reporte.');
            }
        } elseif ($user && $user->hasRole('customer')) {
            $customer = Customer::where('email', $user->email)->first();
            if (!$customer || $ticket->customer_id !== $customer->id) {
                abort(403, 'No tienes autorización para generar este reporte.');
            }
        } elseif ($user && $user->hasRole('Comercial')) {
            if ($ticket->user_id !== $userId) {
                abort(403, 'No tienes autorización para generar este reporte.');
            }
        }

        $ticket->load(['customer:id,name,name_user,email,phone', 'support:id,name,email']);

        return view('tickets.reporte_visita', [
            'mode' => 'form',
            'ticket' => $ticket,
            'generatedAt' => DateHelper::nowColombia(),
            'arrivalAt' => null,
            'formData' => $this->buildReportFormDefaults($ticket),
        ]);
    }

    public function storeVisitReport(Request $request, Ticket $ticket)
    {
        $userId = Auth::id();
        $user = User::find($userId);

        if ($user && $user->hasAnyRole(['support', 'Almacenista'])) {
            $support = Support::where('email', $user->email)->first();
            if (!$support || $ticket->support_id !== $support->id) {
                abort(403, 'No tienes autorización para generar este reporte.');
            }
        } elseif ($user && $user->hasRole('customer')) {
            $customer = Customer::where('email', $user->email)->first();
            if (!$customer || $ticket->customer_id !== $customer->id) {
                abort(403, 'No tienes autorización para generar este reporte.');
            }
        } elseif ($user && $user->hasRole('Comercial')) {
            if ($ticket->user_id !== $userId) {
                abort(403, 'No tienes autorización para generar este reporte.');
            }
        }

        if (!$ticket->support_id || !$ticket->support) {
            return back()->with('error', 'El ticket debe tener un técnico asignado para generar el reporte.');
        }

        $validated = $request->validate([
            'cliente_nombre' => 'nullable|string|max:255',
            'cliente_direccion' => 'nullable|string|max:255',
            'cliente_ciudad' => 'nullable|string|max:255',
            'cliente_contacto' => 'nullable|string|max:255',
            'cliente_telefono' => 'nullable|string|max:255',
            'tecnico_nombre' => 'nullable|string|max:255',
            'equipo_marca' => 'nullable|string|max:255',
            'equipo_modelo' => 'nullable|string|max:255',
            'equipo_serial' => 'nullable|string|max:255',
            'contador_inicial' => 'required|string|max:255',
            'contador_final' => 'required|string|max:255',
            'arrival_at' => 'nullable|date_format:Y-m-d\TH:i',
            'departure_at' => 'nullable|date_format:Y-m-d\TH:i',
            'problema_reportado' => 'required|string|max:5000',
            'observacion_diagnostico' => 'required|string|max:5000',
            'observaciones_electricas' => 'nullable|string|max:5000',
            'nombre_cliente_firma' => 'required|string|max:255',
            'cargo_cliente' => 'nullable|string|max:255',
            'nombre_tecnico_firma' => 'required|string|max:255',
            'cargo_tecnico' => 'nullable|string|max:255',
            'parts' => 'nullable|array',
            'parts.*.nombre' => 'nullable|string|max:255',
            'parts.*.descripcion' => 'nullable|string|max:255',
            'parts.*.codigo' => 'nullable|string|max:255',
            'firma_cliente_base64' => 'required|string',
            'firma_tecnico_base64' => 'required|string',
        ]);

        $ticket->load(['customer:id,name,name_user,email,phone', 'support:id,name,email']);

        $renderStart = microtime(true);

        $pdf = Pdf::loadView('tickets.reporte_visita', [
            'mode' => 'pdf',
            'ticket' => $ticket,
            'generatedAt' => DateHelper::nowColombia(),
            'arrivalAt' => $validated['arrival_at'],
            'formData' => $validated,
        ])->setPaper('letter', 'portrait');

        $viewLoadedAt = microtime(true);

        $fileName = 'reporte_visita_ticket_' . $ticket->id . '_' . now()->format('Y-m-d_H-i-s') . '.pdf';

        // Debug: registrar qué ejecutable PHP y si GD está cargado durante la generación del PDF
        try {
            Log::info('PDF generation debug', [
                'php_binary' => PHP_BINARY,
                'php_ini' => php_ini_loaded_file(),
                'gd_loaded' => extension_loaded('gd') ? 'OK' : 'NO',
                'gd_info' => function_exists('gd_info') ? gd_info() : null,
                'timing_ms' => [
                    'load_view' => round(($viewLoadedAt - $renderStart) * 1000, 2),
                    'output' => null,
                ],
                'memory_mb' => round(memory_get_usage(true) / 1048576, 2),
            ]);
        } catch (\Throwable $e) {
            // No interrumpir la generación si el log falla
            Log::warning('Could not log PDF generation debug: ' . $e->getMessage());
        }

        $outputStart = microtime(true);
        $pdfOutput = $pdf->output();
        $outputEnd = microtime(true);

        try {
            Log::info('PDF output timing', [
                'output_ms' => round(($outputEnd - $outputStart) * 1000, 2),
                'total_ms' => round(($outputEnd - $renderStart) * 1000, 2),
                'memory_mb' => round(memory_get_usage(true) / 1048576, 2),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Could not log PDF output timing: ' . $e->getMessage());
        }

        return response($pdfOutput, 200)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="' . $fileName . '"');
    }

    public function storeVisitReportAndComment(Request $request, Ticket $ticket)
    {
        $userId = Auth::id();
        $user = User::find($userId);

        if ($user && $user->hasAnyRole(['support', 'Almacenista'])) {
            $support = Support::where('email', $user->email)->first();
            if (!$support || $ticket->support_id !== $support->id) {
                abort(403, 'No tienes autorización para generar este reporte.');
            }
        } elseif ($user && $user->hasRole('customer')) {
            $customer = Customer::where('email', $user->email)->first();
            if (!$customer || $ticket->customer_id !== $customer->id) {
                abort(403, 'No tienes autorización para generar este reporte.');
            }
        } elseif ($user && $user->hasRole('Comercial')) {
            if ($ticket->user_id !== $userId) {
                abort(403, 'No tienes autorización para generar este reporte.');
            }
        }

        if (!$ticket->support_id || !$ticket->support) {
            return back()->with('error', 'El ticket debe tener un técnico asignado para generar el reporte.');
        }

        $validated = $request->validate([
            'cliente_nombre' => 'nullable|string|max:255',
            'cliente_direccion' => 'nullable|string|max:255',
            'cliente_ciudad' => 'nullable|string|max:255',
            'cliente_contacto' => 'nullable|string|max:255',
            'cliente_telefono' => 'nullable|string|max:255',
            'tecnico_nombre' => 'nullable|string|max:255',
            'equipo_marca' => 'nullable|string|max:255',
            'equipo_modelo' => 'nullable|string|max:255',
            'equipo_serial' => 'nullable|string|max:255',
            'contador_inicial' => 'required|string|max:255',
            'contador_final' => 'required|string|max:255',
            'arrival_at' => 'nullable|date_format:Y-m-d\TH:i',
            'departure_at' => 'nullable|date_format:Y-m-d\TH:i',
            'problema_reportado' => 'required|string|max:5000',
            'observacion_diagnostico' => 'required|string|max:5000',
            'observaciones_electricas' => 'nullable|string|max:5000',
            'nombre_cliente_firma' => 'required|string|max:255',
            'cargo_cliente' => 'nullable|string|max:255',
            'nombre_tecnico_firma' => 'required|string|max:255',
            'cargo_tecnico' => 'nullable|string|max:255',
            'parts' => 'nullable|array',
            'parts.*.nombre' => 'nullable|string|max:255',
            'parts.*.descripcion' => 'nullable|string|max:255',
            'parts.*.codigo' => 'nullable|string|max:255',
            'firma_cliente_base64' => 'required|string',
            'firma_tecnico_base64' => 'required|string',
        ]);

        $ticket->load(['customer:id,name,name_user,email,phone', 'support:id,name,email']);

        $pdf = Pdf::loadView('tickets.reporte_visita', [
            'mode' => 'pdf',
            'ticket' => $ticket,
            'generatedAt' => DateHelper::nowColombia(),
            'arrivalAt' => $validated['arrival_at'] ?? null,
            'formData' => $validated,
        ])->setPaper('letter', 'portrait');

        $pdfOutput = $pdf->output();

        // Generar nombre del archivo con formato: fechaDeHoy-nombreCliente-numeroSerie
        $today = now()->format('Y-m-d');
            $clientName = isset($validated['cliente_nombre']) ? preg_replace('/[^a-zA-Z0-9-]/', '', str_replace(' ', '-', $validated['cliente_nombre'])) : 'cliente';
            $ticketNumber = str_pad((string) $ticket->id, 4, '0', STR_PAD_LEFT);
        $fileName = "{$today}-{$clientName}-{$ticketNumber}.pdf";

        // Guardar el PDF en la misma ruta que los adjuntos del ticket
        $filePath = 'ticket-documents/' . $fileName;
        Storage::disk(config('filesystems.default'))->put($filePath, $pdfOutput);

        // Crear comentario con el PDF adjunto
        $comment = TicketComment::create([
            'ticket_id' => $ticket->id,
            'user_id' => $userId,
            'comment' => 'Reporte de visita generado automáticamente.',
        ]);

        // Adjuntar el PDF al comentario
        TicketCommentAttachment::create([
            'ticket_comment_id' => $comment->id,
            'file_path' => $filePath,
            'file_name' => $fileName,
            'file_size' => strlen($pdfOutput),
            'mime_type' => 'application/pdf',
        ]);

        return redirect()->route('tickets.show', $ticket->id)->with('success', 'PDF generado y guardado en comentarios del ticket.');
    }

    private function buildReportFormDefaults(Ticket $ticket): array
    {
        return [
            'problema_reportado' => old('problema_reportado', ''),
            'observacion_diagnostico' => old('observacion_diagnostico', ''),
            'observaciones_electricas' => old('observaciones_electricas', ''),
            'nombre_cliente_firma' => old('nombre_cliente_firma', $ticket->customer?->name_user ?? $ticket->customer?->name ?? $ticket->cliente_externo ?? ''),
            'cargo_cliente' => old('cargo_cliente', ''),
            'nombre_tecnico_firma' => old('nombre_tecnico_firma', $ticket->support?->name ?? ''),
            'cargo_tecnico' => old('cargo_tecnico', 'Técnico'),
            'parts' => old('parts', [
                ['nombre' => '', 'descripcion' => '', 'codigo' => ''],
            ]),
            'firma_cliente' => null,
            'firma_tecnico' => null,
        ];
    }

    private function getTicketArrivalAt(Ticket $ticket): ?Carbon
    {
        $history = TicketHistory::where('ticket_id', $ticket->id)
            ->where('field', 'status')
            ->where('new_value', 'En Progreso')
            ->orderBy('created_at')
            ->first();

        return $history ? Carbon::parse($history->created_at) : null;
    }

    /**
     * Remove the specified resource from storage.
     */
    /* public function destroy(Ticket $ticket)
    {
        try {
            $ticket->delete();
            return redirect()->route('tickets.index')->with('success', 'Registry deleted successfully');
        } catch (\Exception $e) {
            return redirect()
            ->back()
            ->with('error', 'Could not delete the record: ' . $e->getMessage());
        }
    } */

    /**
     * Download ticket document
     */
    public function downloadDocument(TicketDocument $document)
    {
        $userId = Auth::id();
        $user = User::find($userId);
        $ticket = $document->ticket;

        // Si el usuario es técnico de soporte, verificar que el ticket esté asignado a él
        if ($user && $user->hasRole('support')) {
            $support = Support::where('email', $user->email)->first();
            if (!$support || $ticket->support_id !== $support->id) {
                abort(403, 'No tienes autorización para descargar este documento.');
            }
        }
        // Si el usuario es cliente, verificar que el ticket sea suyo
        elseif ($user && $user->hasRole('customer')) {
            $customer = Customer::where('email', $user->email)->first();
            if (!$customer || $ticket->customer_id !== $customer->id) {
                abort(403, 'No tienes autorización para descargar este documento.');
            }
        }
        // Si el usuario es Comercial, solo puede descargar documentos de tickets que él creó
        elseif ($user && $user->hasRole('Comercial')) {
            if ($ticket->user_id !== $userId) {
                abort(403, 'No tienes autorización para descargar este documento.');
            }
        }

        // Verificar si el archivo existe en el disco actual o en rutas/ discos heredados
        $filePath = $document->file_path;
        $diskNames = array_values(array_unique(array_filter([
            $document->disk_name,
            config('filesystems.default'),
            'local',
            'public',
            's3',
        ])));

        $file = null;
        $resolvedDisk = null;

        foreach ($diskNames as $diskName) {
            $disk = Storage::disk($diskName);
            if ($disk->exists($filePath)) {
                $file = $disk->get($filePath);
                $resolvedDisk = $diskName;
                break;
            }
        }

        if ($file === null) {
            Log::error('Archivo no encontrado', [
                'file_path' => $filePath,
                'disks' => $diskNames,
                'document_id' => $document->id,
                'ticket_id' => $ticket->id
            ]);

            return redirect()->back()->with('error', 'El archivo no existe. Por favor contacta al administrador.');
        }

        try {
            return response($file, 200)
                ->header('Content-Type', $document->mime_type)
                ->header('Content-Disposition', 'attachment; filename="' . $document->original_name . '"');
        } catch (\Exception $e) {
            Log::error('Error al descargar archivo', [
                'error' => $e->getMessage(),
                'file_path' => $filePath,
                'disk' => $resolvedDisk,
                'document_id' => $document->id
            ]);
            
            return redirect()->back()->with('error', 'Error al descargar el archivo. Por favor intenta de nuevo.');
        }
    }

    /**
     * Delete ticket document
     */
    public function deleteDocument(TicketDocument $document)
    {
        $userId = Auth::id();
        $user = User::find($userId);
        $ticket = $document->ticket;

        // Si el usuario es técnico de soporte, verificar que el ticket esté asignado a él
        if ($user && $user->hasRole('support')) {
            $support = Support::where('email', $user->email)->first();
            if (!$support || $ticket->support_id !== $support->id) {
                return redirect()->back()->with('error', 'No tienes autorización para eliminar este documento.');
            }
        }
        // Si el usuario es cliente, verificar que el ticket sea suyo
        elseif ($user && $user->hasRole('customer')) {
            $customer = Customer::where('email', $user->email)->first();
            if (!$customer || $ticket->customer_id !== $customer->id) {
                return redirect()->back()->with('error', 'No tienes autorización para eliminar este documento.');
            }
        }

        try {
            // Eliminar archivo del storage probando los discos conocidos
            $diskNames = array_values(array_unique(array_filter([
                $document->disk_name,
                config('filesystems.default'),
                'local',
                'public',
                's3',
            ])));

            foreach ($diskNames as $diskName) {
                if (!$diskName) {
                    continue;
                }

                $disk = Storage::disk($diskName);
                if ($disk->exists($document->file_path)) {
                    $disk->delete($document->file_path);
                    break;
                }
            }
            
            // Eliminar registro de la base de datos
            $document->delete();
            
            return redirect()->back()->with('success', 'Documento eliminado exitosamente.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Error al eliminar el documento: ' . $e->getMessage());
        }
    }

    /**
     * Store a new comment for a ticket
     */
    public function storeComment(Request $request, Ticket $ticket)
    {
        $userId = Auth::id();
        $user = User::find($userId);

        // Verificar permisos de acceso al ticket (solo para soporte y clientes, no admin ni coordinador)
        if ($user && $user->hasRole('support')) {
            $support = Support::where('email', $user->email)->first();
            if (!$support || $ticket->support_id !== $support->id) {
                return redirect()->back()->with('error', 'No tienes autorización para comentar en este ticket.');
            }
        } elseif ($user && $user->hasRole('customer')) {
            $customer = Customer::where('email', $user->email)->first();
            if (!$customer || $ticket->customer_id !== $customer->id) {
                return redirect()->back()->with('error', 'No tienes autorización para comentar en este ticket.');
            }
        } elseif ($user && $user->hasRole('Comercial')) {
            if ($ticket->user_id !== $user->id) {
                return redirect()->back()->with('error', 'No tienes autorización para comentar en este ticket.');
            }
        }
        // Los roles admin y Coordinador pueden comentar en cualquier ticket sin restricciones

        try {
            $validated = $request->validate([
                'comment' => 'nullable|string|max:5000',
                'attachments.*' => 'nullable|file|max:10240|mimes:pdf,doc,docx,txt,jpg,jpeg,png,xlsx,xls'
            ]);

            // Validar que al menos haya comentario o archivos
            if (empty($validated['comment']) && !$request->hasFile('attachments')) {
                return redirect()->back()->with('error', 'Debes agregar un comentario o adjuntar al menos un archivo.');
            }

            // Crear el comentario
            $comment = TicketComment::create([
                'ticket_id' => $ticket->id,
                'user_id' => $userId,
                'comment' => $validated['comment'] ?? '',
                'created_at' => DateHelper::nowColombia(),
                'updated_at' => DateHelper::nowColombia(),
            ]);

            // Procesar archivos adjuntos si existen
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $originalName = $file->getClientOriginalName();
                    $fileName = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                    // Guardar en la misma carpeta que los documentos del ticket
                    $filePath = $file->storeAs('ticket-documents', $fileName, config('filesystems.default'));

                    TicketCommentAttachment::create([
                        'ticket_comment_id' => $comment->id,
                        'file_name' => $originalName,
                        'file_path' => $filePath,
                        'mime_type' => $file->getMimeType(),
                        'file_size' => $file->getSize(),
                    ]);
                }
            }

            return redirect()->back()->with('success', 'Comentario agregado exitosamente.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Error al agregar el comentario: ' . $e->getMessage());
        }
    }

    /**
     * Download comment attachment
     */
    public function downloadCommentAttachment(TicketCommentAttachment $attachment)
    {
        $userId = Auth::id();
        $user = User::find($userId);
        $ticket = $attachment->comment->ticket;

        // Verificar permisos de acceso al ticket
        if ($user && $user->hasRole('support')) {
            $support = Support::where('email', $user->email)->first();
            if (!$support || $ticket->support_id !== $support->id) {
                abort(403, 'No tienes autorización para descargar este archivo.');
            }
        } elseif ($user && $user->hasRole('customer')) {
            $customer = Customer::where('email', $user->email)->first();
            if (!$customer || $ticket->customer_id !== $customer->id) {
                abort(403, 'No tienes autorización para descargar este archivo.');
            }
        } elseif ($user && $user->hasRole('Comercial')) {
            if ($ticket->user_id !== $user->id) {
                abort(403, 'No tienes autorización para descargar este archivo.');
            }
        }

        $diskNames = array_values(array_unique([
            config('filesystems.default'),
            'local',
            'public',
        ]));

        $pathCandidates = array_values(array_unique(array_filter([
            $attachment->file_path,
            str_replace('comment-attachments/', 'ticket-documents/', $attachment->file_path),
        ])));

        $file = null;
        $resolvedPath = null;
        $resolvedDisk = null;

        foreach ($diskNames as $diskName) {
            $disk = Storage::disk($diskName);

            foreach ($pathCandidates as $candidatePath) {
                if ($disk->exists($candidatePath)) {
                    $file = $disk->get($candidatePath);
                    $resolvedPath = $candidatePath;
                    $resolvedDisk = $diskName;
                    break 2;
                }
            }
        }

        if ($file === null) {
            Log::error('Archivo de comentario no encontrado', [
                'attachment_id' => $attachment->id,
                'ticket_id' => $ticket->id,
                'file_path' => $attachment->file_path,
                'candidate_paths' => $pathCandidates,
                'disks' => $diskNames,
            ]);

            return redirect()->back()->with('error', 'El archivo no existe.');
        }
        
        return response($file, 200)
            ->header('Content-Type', $attachment->mime_type)
            ->header('Content-Disposition', 'attachment; filename="' . $attachment->file_name . '"');
    }
}
