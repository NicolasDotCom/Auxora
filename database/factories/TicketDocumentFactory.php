<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TicketDocument>
 */
class TicketDocumentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $fileNames = [
            'documento_soporte.pdf',
            'captura_pantalla.png',
            'manual_usuario.docx',
            'log_sistema.txt',
            'reporte_errores.xlsx'
        ];

        $originalName = fake()->randomElement($fileNames);
        $fileName = time() . '_' . uniqid() . '.' . pathinfo($originalName, PATHINFO_EXTENSION);

        return [
            'original_name' => $originalName,
            'file_name' => $fileName,
            'file_path' => 'ticket-documents/' . $fileName,
            'mime_type' => $this->getMimeType($originalName),
            'file_size' => fake()->numberBetween(1024, 5242880), // 1KB a 5MB
        ];
    }

    private function getMimeType($fileName): string
    {
        $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        
        return match($extension) {
            'pdf' => 'application/pdf',
            'png' => 'image/png',
            'jpg', 'jpeg' => 'image/jpeg',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'doc' => 'application/msword',
            'txt' => 'text/plain',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'xls' => 'application/vnd.ms-excel',
            default => 'application/octet-stream'
        };
    }
}
