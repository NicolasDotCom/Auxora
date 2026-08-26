<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            // Índices para mejorar el rendimiento de consultas frecuentes
            $table->index('status', 'idx_tickets_status');
            $table->index('customer_id', 'idx_tickets_customer_id');
            $table->index('support_id', 'idx_tickets_support_id');
            $table->index('created_at', 'idx_tickets_created_at');
            $table->index('closed_at', 'idx_tickets_closed_at');
            
            // Índice compuesto para consultas comunes de analytics
            $table->index(['support_id', 'status', 'closed_at'], 'idx_tickets_analytics');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropIndex('idx_tickets_status');
            $table->dropIndex('idx_tickets_customer_id');
            $table->dropIndex('idx_tickets_support_id');
            $table->dropIndex('idx_tickets_created_at');
            $table->dropIndex('idx_tickets_closed_at');
            $table->dropIndex('idx_tickets_analytics');
        });
    }
};

