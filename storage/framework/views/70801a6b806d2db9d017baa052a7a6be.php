<?php echo $__env->make('errors._layout', [
    'code' => '403',
    'highlight' => 'Acceso denegado',
    'description' => 'No tienes los permisos necesarios para acceder a este recurso.',
    'subcopy' => 'Si crees que deberías tener acceso, contacta al administrador del sistema.',
    'icon' => 'lock',
    'gradientFrom' => 'from-rose-500',
    'gradientTo' => 'to-red-500',
    'shadowColor' => 'shadow-rose-500/30',
    'tipTitle' => '¿Por qué veo esto?',
    'tipBody' => 'Tu rol actual no permite esta acción. Solicita acceso al equipo administrador si lo necesitas.',
], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH C:\laragon\www\auxora-main\resources\views\errors\403.blade.php ENDPATH**/ ?>