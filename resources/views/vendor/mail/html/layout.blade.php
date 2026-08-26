<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
<title>{{ config('app.name') }}</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<style>
@media only screen and (max-width: 600px) {
  .email-wrapper { width: 100% !important; }
  .email-content { width: 100% !important; }
  .email-body_inner { width: 100% !important; }
  .content-cell { padding: 24px !important; }
  .email-masthead { padding: 24px 0 !important; }
}
@media only screen and (max-width: 500px) {
  .button { width: 100% !important; text-align: center !important; }
}
a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
</style>
{!! $head ?? '' !!}
</head>
<body style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b; height: 100%; line-height: 1.6; margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: none;">
@php
  $logoPath = public_path('images/logo-transparent-128.png');
  $logoCid = null;
  if (isset($message) && file_exists($logoPath)) {
      $logoCid = $message->embed($logoPath);
  } elseif (file_exists($logoPath)) {
      $logoCid = 'data:image/png;base64,'.base64_encode(file_get_contents($logoPath));
  }
@endphp
<table class="wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="box-sizing: border-box; background-color: #f1f5f9; margin: 0; padding: 0; width: 100%;">
<tr>
<td align="center" style="box-sizing: border-box; padding: 0;">
<table class="content" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="box-sizing: border-box; margin: 0; padding: 0; width: 100%;">
<!-- Logo / Brand minimal top -->
<tr>
<td align="center" style="box-sizing: border-box; padding: 32px 0 16px 0;">
  <a href="{{ config('app.url') }}" style="display: inline-block; text-decoration: none;">
    @if($logoCid)
      <img src="{{ $logoCid }}" width="48" height="48" alt="Auxora" style="display: block; width: 48px; height: 48px; margin: 0 auto; border: 0;">
    @else
      <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%); border-radius: 12px; display: inline-block; line-height: 48px; text-align: center; color: white; font-weight: 800; font-size: 20px;">A</div>
    @endif
  </a>
  <div style="margin-top: 12px; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #64748b;">{{ config('app.name', 'Auxora') }}</div>
</td>
</tr>

<!-- Email Body Card -->
<tr>
<td class="body" width="100%" cellpadding="0" cellspacing="0" style="box-sizing: border-box; background-color: #f1f5f9; margin: 0; padding: 0; width: 100%;">
<table class="inner-body" align="center" width="600" cellpadding="0" cellspacing="0" role="presentation" style="box-sizing: border-box; background-color: #ffffff; margin: 0 auto; padding: 0; width: 600px; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
<!-- Header with gradient -->
<tr>
<td style="box-sizing: border-box; background: linear-gradient(135deg, #1e40af 0%, #2563eb 45%, #06b6d4 100%); padding: 36px 40px; text-align: center;">
  @if($logoCid)
    <img src="{{ $logoCid }}" width="56" height="56" alt="Auxora" style="display: block; width: 56px; height: 56px; margin: 0 auto; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.2));">
  @endif
  <h1 style="box-sizing: border-box; color: #ffffff; font-size: 22px; font-weight: 800; line-height: 1.2; margin: 16px 0 6px 0; text-align: center; letter-spacing: -0.02em;">{{ config('app.name', 'Auxora') }}</h1>
  <p style="box-sizing: border-box; color: rgba(255,255,255,0.9); font-size: 13px; line-height: 1.4; margin: 0; text-align: center; font-weight: 500; letter-spacing: 0.02em;">Plataforma de Gestión de Tickets</p>
</td>
</tr>
<!-- Body content -->
<tr>
<td class="content-cell" style="box-sizing: border-box; max-width: 100vw; padding: 36px 40px;">
{!! Illuminate\Mail\Markdown::parse($slot) !!}

{!! $subcopy ?? '' !!}
</td>
</tr>
<!-- Footer inside card -->
<tr>
<td style="box-sizing: border-box; background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 20px 40px; text-align: center;">
  <p style="box-sizing: border-box; color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
    Este correo fue enviado por <strong style="color: #334155;">{{ config('app.name') }}</strong> • Sistema de Tickets<br>
    <span style="color: #64748b;">Si no esperabas este mensaje, puedes ignorarlo de forma segura.</span>
  </p>
</td>
</tr>
</table>
</td>
</tr>

<!-- Outer Footer -->
<tr>
<td style="box-sizing: border-box; padding: 24px 0 32px 0;">
<table class="footer" align="center" width="600" cellpadding="0" cellspacing="0" role="presentation" style="box-sizing: border-box; margin: 0 auto; padding: 0; text-align: center; width: 600px;">
<tr>
<td class="content-cell" align="center" style="box-sizing: border-box; max-width: 100vw; padding: 0 24px; text-align: center;">
  <p style="box-sizing: border-box; color: #94a3b8; font-size: 11px; line-height: 1.6; margin: 0 0 8px 0; text-align: center;">
    © {{ date('Y') }} {{ config('app.name') }}. Todos los derechos reservados.
  </p>
  <p style="box-sizing: border-box; color: #cbd5e1; font-size: 11px; line-height: 1.5; margin: 0; text-align: center;">
    <a href="{{ config('app.url') }}" style="color: #64748b; text-decoration: none; font-weight: 500;">{{ parse_url(config('app.url'), PHP_URL_HOST) }}</a>
    <span style="color: #e2e8f0; margin: 0 6px;">•</span>
    <span style="color: #94a3b8;">Soporte: {{ config('mail.from.address') }}</span>
  </p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>
