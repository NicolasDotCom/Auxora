<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword as BaseResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends BaseResetPassword
{
    public function toMail($notifiable)
    {
        if (static::$toMailCallback) {
            return call_user_func(static::$toMailCallback, $notifiable, $this->token);
        }

        $name = $notifiable?->name ? explode(' ', trim($notifiable->name))[0] : 'Administrador';
        $expire = config('auth.passwords.'.config('auth.defaults.passwords').'.expire', 60);

        return (new MailMessage)
            ->subject('Restablece tu contraseña en '.config('app.name', 'Auxora').' 🔐')
            ->view('emails.reset', [
                'url' => $this->resetUrl($notifiable),
                'userName' => $name,
                'expire' => $expire,
            ]);
    }
}
