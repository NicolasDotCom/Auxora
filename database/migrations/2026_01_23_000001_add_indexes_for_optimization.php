<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Agrega índices en todas las tablas para optimizar consultas frecuentes:
     * - Búsquedas por email, nombre, teléfono
     * - Filtros por estado
     * - Relaciones FK
     * - Ordenamiento por fechas
     */
    public function up(): void
    {
        // CUSTOMERS - Optimizar búsquedas
        Schema::table('customers', function (Blueprint $table) {
            $table->index('name', 'idx_customers_name');
            $table->index('phone', 'idx_customers_phone');
            // email ya tiene unique, que incluye índice
        });

        // SUPPORTS - Optimizar búsquedas y filtros
        Schema::table('supports', function (Blueprint $table) {
            $table->index('name', 'idx_supports_name');
            $table->index('speciality', 'idx_supports_speciality');
            $table->index('phone', 'idx_supports_phone');
            // email ya tiene unique
        });

        // USERS - Optimizar búsquedas
        Schema::table('users', function (Blueprint $table) {
            $table->index('name', 'idx_users_name');
            // email ya tiene unique
        });

        // TICKET_COMMENTS - Optimizar carga de comentarios
        Schema::table('ticket_comments', function (Blueprint $table) {
            $table->index('ticket_id', 'idx_comments_ticket_id');
            $table->index('user_id', 'idx_comments_user_id');
            $table->index('created_at', 'idx_comments_created_at');
        });

        // TICKET_COMMENT_ATTACHMENTS - Optimizar carga de adjuntos
        Schema::table('ticket_comment_attachments', function (Blueprint $table) {
            $table->index('ticket_comment_id', 'idx_attachments_comment_id');
        });

        // TICKET_DOCUMENTS - Optimizar carga de documentos
        Schema::table('ticket_documents', function (Blueprint $table) {
            $table->index('ticket_id', 'idx_documents_ticket_id');
        });

        // PENDING_PARTS - Optimizar filtros
        Schema::table('pending_parts', function (Blueprint $table) {
            $table->index('ticket_id', 'idx_pending_parts_ticket_id');
            $table->index('status', 'idx_pending_parts_status');
            $table->index('user_id', 'idx_pending_parts_user_id');
            $table->index('completed_by_user_id', 'idx_pending_parts_completed_by');
            $table->index(['status', 'created_at'], 'idx_pending_parts_status_date');
        });

        // TICKET_HISTORIES - Optimizar auditoría
        Schema::table('ticket_histories', function (Blueprint $table) {
            $table->index('user_id', 'idx_histories_user_id');
            $table->index('created_at', 'idx_histories_created_at');
        });

        // HOLIDAYS - Optimizar cálculo de días laborables
        Schema::table('holidays', function (Blueprint $table) {
            $table->index('date', 'idx_holidays_date');
        });

        // TICKETS - Índices compuestos adicionales para queries complejas
        Schema::table('tickets', function (Blueprint $table) {
            $table->index(['customer_id', 'status'], 'idx_tickets_customer_status');
            $table->index(['support_id', 'status'], 'idx_tickets_support_status');
            $table->index(['status', 'created_at'], 'idx_tickets_status_date');
            $table->index('user_id', 'idx_tickets_user_id');
            $table->index('assigned_at', 'idx_tickets_assigned_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropIndex('idx_customers_name');
            $table->dropIndex('idx_customers_phone');
        });

        Schema::table('supports', function (Blueprint $table) {
            $table->dropIndex('idx_supports_name');
            $table->dropIndex('idx_supports_speciality');
            $table->dropIndex('idx_supports_phone');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_name');
        });

        Schema::table('ticket_comments', function (Blueprint $table) {
            $table->dropIndex('idx_comments_ticket_id');
            $table->dropIndex('idx_comments_user_id');
            $table->dropIndex('idx_comments_created_at');
        });

        Schema::table('ticket_comment_attachments', function (Blueprint $table) {
            $table->dropIndex('idx_attachments_comment_id');
        });

        Schema::table('ticket_documents', function (Blueprint $table) {
            $table->dropIndex('idx_documents_ticket_id');
        });

        Schema::table('pending_parts', function (Blueprint $table) {
            $table->dropIndex('idx_pending_parts_ticket_id');
            $table->dropIndex('idx_pending_parts_status');
            $table->dropIndex('idx_pending_parts_user_id');
            $table->dropIndex('idx_pending_parts_completed_by');
            $table->dropIndex('idx_pending_parts_status_date');
        });

        Schema::table('ticket_histories', function (Blueprint $table) {
            $table->dropIndex('idx_histories_user_id');
            $table->dropIndex('idx_histories_created_at');
        });

        Schema::table('holidays', function (Blueprint $table) {
            $table->dropIndex('idx_holidays_date');
        });

        Schema::table('tickets', function (Blueprint $table) {
            $table->dropIndex('idx_tickets_customer_status');
            $table->dropIndex('idx_tickets_support_status');
            $table->dropIndex('idx_tickets_status_date');
            $table->dropIndex('idx_tickets_user_id');
            $table->dropIndex('idx_tickets_assigned_at');
        });
    }
};
