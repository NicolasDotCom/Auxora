<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Auth\Events\Registered;

class TestEmailVerification extends Command
{
    protected $signature = 'test:email-verification {email}';
    protected $description = 'Probar envío de correo de verificación a un usuario existente';

    public function handle()
    {
        $email = $this->argument('email');
        
        $user = User::where('email', $email)->first();
        
        if (!$user) {
            $this->error("No se encontró un usuario con el email: {$email}");
            return 1;
        }
        
        $this->info("Usuario encontrado: {$user->name} ({$user->email})");
        $this->info("Email verificado: " . ($user->email_verified_at ? 'Sí' : 'No'));
        
        if ($user->email_verified_at) {
            $this->warn("⚠️ Este usuario ya tiene su email verificado.");
            if (!$this->confirm('¿Deseas reenviar el correo de verificación de todas formas?')) {
                return 0;
            }
        }
        
        $this->info("\n🚀 Enviando correo de verificación...");
        
        try {
            // Disparar el evento Registered que envía el email de verificación
            event(new Registered($user));
            
            $this->info("✅ Correo de verificación enviado exitosamente!");
            $this->info("\n📧 Revisa:");
            $this->info("   - Si usas Resend: Verifica en https://resend.com/emails");
            $this->info("   - Si usas LOG: Revisa storage/logs/laravel.log");
            $this->info("   - Bandeja de entrada de: {$user->email}");
            
            return 0;
        } catch (\Exception $e) {
            $this->error("❌ Error al enviar el correo: " . $e->getMessage());
            $this->error("\n🔧 Posibles soluciones:");
            $this->error("   1. Verifica que MAIL_MAILER esté configurado en .env");
            $this->error("   2. Si usas Resend, verifica que RESEND_KEY sea válido");
            $this->error("   3. Ejecuta: php artisan config:clear");
            
            return 1;
        }
    }
}
