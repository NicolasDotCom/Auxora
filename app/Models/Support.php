<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Support extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'speciality',
    ];

    public function tickets()
    {
        return $this->hasMany(Ticket::class, 'support_id');
    }
}
