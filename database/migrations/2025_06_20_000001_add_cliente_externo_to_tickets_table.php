<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Agregar columna cliente_externo como nullable
        Schema::table('tickets', function (Blueprint $table) {
            $table->string('cliente_externo')->nullable()->after('customer_id');
        });

        // Hacer customer_id nullable (sintaxis varía según el motor)
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE tickets DROP FOREIGN KEY tickets_customer_id_foreign');
            DB::statement('ALTER TABLE tickets MODIFY COLUMN customer_id BIGINT UNSIGNED NULL');
            DB::statement('ALTER TABLE tickets ADD CONSTRAINT tickets_customer_id_foreign FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE');
        } else {
            Schema::table('tickets', function (Blueprint $table) {
                $table->unsignedBigInteger('customer_id')->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        // Revertir customer_id a NOT NULL
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE tickets DROP FOREIGN KEY tickets_customer_id_foreign');
            DB::statement('ALTER TABLE tickets MODIFY COLUMN customer_id BIGINT UNSIGNED NOT NULL');
            DB::statement('ALTER TABLE tickets ADD CONSTRAINT tickets_customer_id_foreign FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE');
        } else {
            Schema::table('tickets', function (Blueprint $table) {
                $table->unsignedBigInteger('customer_id')->nullable(false)->change();
            });
        }

        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn('cliente_externo');
        });
    }
};
