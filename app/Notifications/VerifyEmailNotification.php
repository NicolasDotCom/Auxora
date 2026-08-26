<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail as BaseVerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

class VerifyEmailNotification extends BaseVerifyEmail
{
    public function toMail($notifiable)
    {
        $verificationUrl = $this->verificationUrl($notifiable);

        if (static::$toMailCallback) {
            return call_user_func(static::$toMailCallback, $notifiable, $verificationUrl);
        }

        $name = $notifiable?->name ? explode(' ', trim($notifiable->name))[0] : 'Administrador';

        return (new MailMessage)
            ->subject('Verifica tu correo en '.config('app.name', 'Auxora').' ✉️')
            ->view('emails.verify', [
                'url' => $verificationUrl,
                'userName' => $name,
            ]);
    }
}
