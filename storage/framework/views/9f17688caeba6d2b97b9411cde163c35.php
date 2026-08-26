<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Restablece tu contraseña - <?php echo e(config('app.name')); ?></title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding: 24px 0;">
<tr><td align="center">
  <?php $logoCid = $message->embed(public_path('images/logo-transparent-128.png')); ?>
  <table width="600" cellpadding="0" cellspacing="0" style="width:100%; max-width:600px; margin:0 auto;">
    <tr><td>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(15,23,42,0.06); border:1px solid #e2e8f0;">
        <tr><td align="center" style="background: linear-gradient(135deg, #1e40af 0%, #2563eb 45%, #06b6d4 100%); padding:32px 40px;">
          <img src="<?php echo e($logoCid); ?>" width="56" height="56" alt="Auxora" style="display:block; width:56px; height:56px; margin:0 auto; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.2));">
          <h1 style="color:#ffffff; font-size:22px; font-weight:800; margin:16px 0 6px 0; line-height:1.2;"><?php echo e(config('app.name')); ?></h1>
          <p style="color:rgba(255,255,255,0.9); font-size:13px; margin:0; font-weight:500;">Restablecimiento de Contraseña</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <h2 style="color:#0f172a; font-size:18px; font-weight:700; margin:0 0 16px 0;">¡Hola, <?php echo e($userName); ?>!</h2>
          <p style="color:#334155; font-size:15px; line-height:1.6; margin:0 0 16px 0;">Recibiste este correo porque solicitaste restablecer tu contraseña en <strong style="color:#0f172a;"><?php echo e(config('app.name')); ?></strong>.</p>
          <p style="color:#334155; font-size:15px; line-height:1.6; margin:0 0 16px 0;">Haz clic en el botón de abajo para crear una nueva contraseña. El enlace es seguro y de un solo uso.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
            <tr><td align="center">
              <!--[if mso]><v:roundrect href="<?php echo e($url); ?>" style="height:44px;v-text-anchor:middle;width:260px;" arcsize="12%" fillcolor="#2563eb"><center style="color:#fff;font-family:sans-serif;font-size:14px;font-weight:700;">Restablecer mi contraseña</center></v:roundrect><![endif]-->
              <!--[if !mso]><!--><a href="<?php echo e($url); ?>" style="display:inline-block; background: linear-gradient(135deg, #dc2626 0%, #f97316 100%); background-color:#dc2626; color:#ffffff; text-decoration:none; font-size:14px; font-weight:700; padding:14px 32px; border-radius:10px; box-shadow: 0 4px 14px rgba(220,38,38,0.3);">Restablecer mi contraseña &nbsp;→</a><!--<![endif]-->
            </td></tr>
          </table>
          <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 12px 0;">🔒 Por seguridad, este enlace expira en <strong><?php echo e($expire); ?> minutos</strong>.</p>
          <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 16px 0;">Si no solicitaste este cambio, ignora este mensaje. Tu contraseña actual seguirá siendo válida.</p>
          <p style="color:#334155; font-size:14px; line-height:1.6; margin:24px 0 0 0;">¿Necesitas ayuda? Responde a este correo.</p>
          <p style="color:#334155; font-size:14px; font-weight:600; margin:4px 0 0 0;">El equipo de <?php echo e(config('app.name')); ?></p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px; border-top:1px solid #e2e8f0; padding-top:24px;">
            <tr><td style="background:#f8fafc; border:1px solid #f1f5f9; border-radius:8px; padding:16px;">
              <p style="color:#64748b; font-size:12px; font-weight:600; margin:0 0 8px 0;">¿Problemas con el botón?</p>
              <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:6px; padding:10px 12px; word-break:break-all; font-size:12px; color:#475569; line-height:1.5;">
                Copia y pega esta URL en tu navegador:<br>
                <a href="<?php echo e($url); ?>" style="color:#2563eb; word-break:break-all;"><?php echo e($url); ?></a>
              </div>
            </td></tr>
          </table>
        </td></tr>
        </table>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>
<?php /**PATH C:\laragon\www\auxora-main\resources\views\emails\reset.blade.php ENDPATH**/ ?>