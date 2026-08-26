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
        Schema::create('ticket_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('action'); // 'created', 'status_changed', 'assigned', 'updated', 'reopened'
            $table->string('field')->nullable(); // Campo modificado
            $table->text('old_value')->nullable(); // Valor anterior
            $table->text('new_value')->nullable(); // Valor nuevo
            $table->text('description'); // Descripción del cambio
            $table->timestamps();
            
            $table->index('ticket_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticket_histories');
    }
};
