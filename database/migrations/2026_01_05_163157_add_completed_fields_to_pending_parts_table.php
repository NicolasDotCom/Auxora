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
        Schema::table('pending_parts', function (Blueprint $table) {
            $table->foreignId('completed_by_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('completed_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pending_parts', function (Blueprint $table) {
            $table->dropForeign(['completed_by_user_id']);
            $table->dropColumn(['completed_by_user_id', 'completed_at']);
        });
    }
};
