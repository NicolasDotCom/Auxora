<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function  __construct()
    {
        $this->middleware('permission:view customer')->only(['index']);
        $this->middleware('permission:create customer')->only(['create', 'store']);
        $this->middleware('permission:edit customer')->only(['edit', 'update']);
        $this->middleware('permission:delete customer')->only(['destroy']);
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->query('search');
        $nombre = $request->query('nombre');
        $nit    = $request->query('nit');
        $phone  = $request->query('phone');

        // Optimización: Select específico de campos necesarios
        $query = Customer::select('id', 'name', 'email', 'name_user', 'phone', 'nit', 'created_at')
            ->withCount('tickets')
            ->when($search, function ($q, $search) {
                $q->where(function ($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%")
                       ->orWhere('email', 'like', "%{$search}%")
                       ->orWhere('name_user', 'like', "%{$search}%")
                       ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($nombre, fn($q, $v) => $q->where('name', 'like', "%{$v}%"))
            ->when($nit,    fn($q, $v) => $q->where('nit',  'like', "%{$v}%"))
            ->when($phone,  fn($q, $v) => $q->where('phone','like', "%{$v}%"));

        $hasFilters = $search || $nombre || $nit || $phone;

        // Si hay filtros activos, mostrar todos los resultados en una página
        if ($hasFilters) {
            $allCustomers = $query->get();
            $customers = new \Illuminate\Pagination\LengthAwarePaginator(
                $allCustomers,
                $allCustomers->count(),
                max($allCustomers->count(), 1),
                1,
                ['path' => $request->url(), 'query' => $request->query()]
            );
        } else {
            $customers = $query->paginate(10)->withQueryString();
        }

        return Inertia::render('Customers/Index', [
            'customers' => $customers
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Customers/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:155',
                'email' => 'required|email|unique:customers,email',
                'name_user' => 'required|string|max:255',
                'phone' => 'nullable|string|max:20',
            ]);
            Customer::create($validated);
            
            // Limpiar caché de clientes
            \App\Services\CacheService::clearCustomersCache();
            
            return redirect()
                ->route('customers.index')
                ->with('info', '¡Record created successfully!');
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', 'Failed to create record: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Customer $customer)
    {
        return Inertia::render('Customers/Edit', [
            'customer' => $customer
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Customer $customer)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string',
                'email' => 'required|email|unique:customers,email,' . $customer->id,
                'name_user' => 'required|string|max:255',
                'phone' => 'nullable|string',
            ]);
            $customer->update($validated);
            
            // Limpiar caché de clientes
            \App\Services\CacheService::clearCustomersCache();
            
            return redirect()
                ->route('customers.index')
                ->with('success', '¡Record updated successfully!');
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', 'Failed to create record: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Customer $customer)
    {
        try {

            $ticketCount = $customer->tickets()->count();
            $confirm = $request->input('confirm', false);

            if($ticketCount > 0 && !$confirm) {
                return redirect()
                    ->back()
                    ->with('warning', "This customer has {$ticketCount} ticket(s) associated. Please confirm deletion.");
            }

            $customer->delete();
            
            // Limpiar caché de clientes
            \App\Services\CacheService::clearCustomersCache();

            return redirect()

            ->route('customers.index')
            ->with('success', 'Customer and their tickets successfully deleted.');
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', 'Could not delete client: ' . $e->getMessage());
        }
    }
}
