<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketCommentAttachment extends Model
{
    protected $fillable = [
        'ticket_comment_id',
        'file_name',
        'file_path',
        'file_size',
        'mime_type',
    ];

    public function comment(): BelongsTo
    {
        return $this->belongsTo(TicketComment::class, 'ticket_comment_id');
    }
}
