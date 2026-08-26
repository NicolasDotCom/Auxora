<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Holiday;
use Carbon\Carbon;

class HolidaySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Días festivos de Colombia para 2026
        $holidays = [
            ['date' => '2026-01-01', 'name' => 'Año Nuevo', 'description' => 'Celebración del año nuevo'],
            ['date' => '2026-01-12', 'name' => 'Día de los Reyes Magos', 'description' => 'Epifanía del Señor'],
            ['date' => '2026-03-23', 'name' => 'Día de San José', 'description' => 'San José'],
            ['date' => '2026-04-02', 'name' => 'Jueves Santo', 'description' => 'Semana Santa'],
            ['date' => '2026-04-03', 'name' => 'Viernes Santo', 'description' => 'Semana Santa'],
            ['date' => '2026-05-01', 'name' => 'Día del Trabajo', 'description' => 'Día Internacional del Trabajo'],
            ['date' => '2026-05-18', 'name' => 'Ascensión del Señor', 'description' => 'Ascensión de Jesús'],
            ['date' => '2026-06-08', 'name' => 'Corpus Christi', 'description' => 'Cuerpo y Sangre de Cristo'],
            ['date' => '2026-06-15', 'name' => 'Sagrado Corazón de Jesús', 'description' => 'Sagrado Corazón'],
            ['date' => '2026-06-29', 'name' => 'San Pedro y San Pablo', 'description' => 'Santos Pedro y Pablo'],
            ['date' => '2026-07-20', 'name' => 'Día de la Independencia', 'description' => 'Independencia de Colombia'],
            ['date' => '2026-08-07', 'name' => 'Batalla de Boyacá', 'description' => 'Batalla de Boyacá'],
            ['date' => '2026-08-17', 'name' => 'Asunción de la Virgen', 'description' => 'Asunción de María'],
            ['date' => '2026-10-12', 'name' => 'Día de la Raza', 'description' => 'Descubrimiento de América'],
            ['date' => '2026-11-02', 'name' => 'Día de Todos los Santos', 'description' => 'Todos los Santos'],
            ['date' => '2026-11-16', 'name' => 'Independencia de Cartagena', 'description' => 'Independencia de Cartagena'],
            ['date' => '2026-12-08', 'name' => 'Inmaculada Concepción', 'description' => 'Inmaculada Concepción de María'],
            ['date' => '2026-12-25', 'name' => 'Navidad', 'description' => 'Celebración del nacimiento de Jesús'],
        ];

        foreach ($holidays as $holiday) {
            Holiday::create($holiday);
        }
    }
}

