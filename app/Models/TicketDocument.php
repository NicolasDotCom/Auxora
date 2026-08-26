<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Storage;

class TicketDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'original_name',
        'file_name',
        'file_path',
        'disk_name',
        'mime_type',
        'file_size'
    ];

    // Relación con Ticket
    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    // Accessor para obtener la URL del archivo
    public function getFileUrlAttribute(): string
    {
        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk($this->disk_name ?: config('filesystems.default'));
        
        // Generar URL según el disco (local o S3)
        return $disk->url($this->file_path);
    }

    // Accessor para obtener el tamaño formateado
    public function getFormattedSizeAttribute()
    {
        $bytes = $this->file_size;
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . ' GB';
        } elseif ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        } elseif ($bytes > 1) {
            return $bytes . ' bytes';
        } elseif ($bytes == 1) {
            return $bytes . ' byte';
        } else {
            return '0 bytes';
        }
    }
}
