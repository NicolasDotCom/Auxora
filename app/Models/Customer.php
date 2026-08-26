<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'name_user',
        'phone',
        'nit',
        'additional_nits',
    ];

    protected $casts = [
        'additional_nits' => 'array',
    ];

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }

}
