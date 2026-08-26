<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Ticket extends Model
{
    use HasFactory;

    protected $fillable = [
        'request_uuid',
        'user_id',
        'customer_id',
        'cliente_externo',
        'support_id',
        'assigned_at',
        'subject',
        'description',
        'phone',
        'nombre_contacto',
        'address',
        'brand',
        'model',
        'serial',
        'status',
        'ciudad',
        'closed_at',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'closed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The attributes that should be mutated to dates.
     */
    protected $dates = [
        'created_at',
        'updated_at',
        'assigned_at',
        'closed_at',
    ];

    //Relación con Customer
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    //Relación con Support
    public function support()
    {
        return $this->belongsTo(Support::class, 'support_id');
    }

    //Relación con TicketDocument
    public function documents()
    {
        return $this->hasMany(TicketDocument::class);
    }

    //Relación con TicketComment
    public function comments()
    {
        return $this->hasMany(TicketComment::class);
    }

    //Relación con User (creador del ticket)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    //Relación con TicketHistory
    public function histories()
    {
        return $this->hasMany(TicketHistory::class)->orderBy('created_at', 'desc');
    }

    //Relación con PendingPart
    public function pendingParts()
    {
        return $this->hasMany(PendingPart::class);
    }
}
