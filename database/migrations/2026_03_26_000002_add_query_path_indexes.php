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
            // Soporta listados por rol y filtros + orden por created_at.
            $table->index(['support_id', 'created_at'], 'idx_tickets_support_created_at');
            $table->index(['customer_id', 'created_at'], 'idx_tickets_customer_created_at');
            $table->index(['user_id', 'created_at'], 'idx_tickets_user_created_at');

            // Soporta filtros comunes en listados/API.
            $table->index('serial', 'idx_tickets_serial');
            $table->index('subject', 'idx_tickets_subject');
        });

        Schema::table('ticket_comments', function (Blueprint $table) {
            // Optimiza ticket comments paginados por fecha.
            $table->index(['ticket_id', 'created_at'], 'idx_comments_ticket_created_at');
        });

        Schema::table('ticket_histories', function (Blueprint $table) {
            // Optimiza historial paginado por fecha.
            $table->index(['ticket_id', 'created_at'], 'idx_histories_ticket_created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropIndex('idx_tickets_support_created_at');
            $table->dropIndex('idx_tickets_customer_created_at');
            $table->dropIndex('idx_tickets_user_created_at');
            $table->dropIndex('idx_tickets_serial');
            $table->dropIndex('idx_tickets_subject');
        });

        Schema::table('ticket_comments', function (Blueprint $table) {
            $table->dropIndex('idx_comments_ticket_created_at');
        });

        Schema::table('ticket_histories', function (Blueprint $table) {
            $table->dropIndex('idx_histories_ticket_created_at');
        });
    }
};
