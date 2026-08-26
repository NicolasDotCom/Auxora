<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Verificar si la columna subject_temp ya existe
        if (!Schema::hasColumn('tickets', 'subject_temp')) {
            // Paso 1: Agregar columna temporal como TEXT
            Schema::table('tickets', function (Blueprint $table) {
                $table->text('subject_temp')->nullable()->after('support_id');
            });
        }
        
        // Paso 2: Copiar datos asegurando que no haya NULLs (solo si subject existe)
        if (Schema::hasColumn('tickets', 'subject')) {
            DB::statement("UPDATE tickets SET subject_temp = COALESCE(subject, 'Otros')");
            
            // Paso 3: Actualizar valores específicos
            DB::table('tickets')
                ->where('subject_temp', 'Configuración')
                ->update(['subject_temp' => 'Configuración ó Escaner']);
        }
        
        // Paso 4: Asegurar que subject_temp no tenga NULLs ni valores vacíos
        DB::statement("UPDATE tickets SET subject_temp = 'Otros' WHERE subject_temp IS NULL OR subject_temp = ''");
        
        // Paso 5: Mapear valores no reconocidos a 'Otros'
        $validSubjects = [
            'Mantenimiento Preventivo',
            'Manchas',
            'Atascos',
            'Configuración ó Escaner',
            'Código de Error',
            'Remoto',
            'Servicio de Ingeniería',
            'Solicitud de Toner',
            'Otros'
        ];
        
        DB::table('tickets')
            ->whereNotIn('subject_temp', $validSubjects)
            ->orWhereNull('subject_temp')
            ->update(['subject_temp' => 'Otros']);
        
        // Paso 6: Eliminar columna subject original (si existe)
        if (Schema::hasColumn('tickets', 'subject')) {
            Schema::table('tickets', function (Blueprint $table) {
                $table->dropColumn('subject');
            });
        }
        
        // Paso 7: Crear nueva columna subject con ENUM correcto (si no existe)
        if (!Schema::hasColumn('tickets', 'subject')) {
            DB::statement("ALTER TABLE tickets ADD COLUMN subject ENUM(
                'Mantenimiento Preventivo',
                'Manchas',
                'Atascos',
                'Configuración ó Escaner',
                'Código de Error',
                'Remoto',
                'Servicio de Ingeniería',
                'Solicitud de Toner',
                'Otros'
            ) NOT NULL DEFAULT 'Otros' AFTER support_id");
        }
        
        // Paso 8: Copiar datos limpiando NULLs con COALESCE
        DB::statement("UPDATE tickets SET subject = COALESCE(subject_temp, 'Otros')");
        
        // Paso 9: Eliminar columna temporal (si existe)
        if (Schema::hasColumn('tickets', 'subject_temp')) {
            Schema::table('tickets', function (Blueprint $table) {
                $table->dropColumn('subject_temp');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Agregar columna temporal
        Schema::table('tickets', function (Blueprint $table) {
            $table->text('subject_temp')->nullable()->after('support_id');
        });
        
        // Copiar datos
        DB::statement('UPDATE tickets SET subject_temp = subject');
        
        // Eliminar columna subject
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn('subject');
        });
        
        // Revertir valores
        DB::table('tickets')
            ->where('subject_temp', 'Configuración ó Escaner')
            ->update(['subject_temp' => 'Configuración']);
        
        // Crear columna con ENUM anterior
        DB::statement("ALTER TABLE tickets ADD COLUMN subject ENUM(
            'Mantenimiento Preventivo',
            'Manchas',
            'Atascos',
            'Configuración',
            'Código de Error',
            'Remoto',
            'Servicio de Ingeniería',
            'Solicitud de Toner',
            'Otros'
        ) NOT NULL DEFAULT 'Otros' AFTER support_id");
        
        // Copiar datos de vuelta
        DB::statement('UPDATE tickets SET subject = subject_temp');
        
        // Eliminar columna temporal
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn('subject_temp');
        });
    }
};
