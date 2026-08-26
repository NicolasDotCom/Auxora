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
        // Primero eliminar la columna existente
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn('subject');
        });

        // Luego agregar la columna con tipo enum
        Schema::table('tickets', function (Blueprint $table) {
            $table->enum('subject', [
                'Atascos',
                'Manchas',
                'Configuración',
                'Solicitud de Toner',
                'Servicio de Ingeniería',
                'Otros'
            ])->nullable()->after('support_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn('subject');
            $table->string('subject')->nullable()->after('support_id');
        });
    }
};
