<?php echo $__env->make('errors._layout', [
    'code' => '419',
    'highlight' => 'Sesión expirada',
    'description' => 'Por seguridad, tu sesión ha caducado después de un tiempo de inactividad.',
    'subcopy' => 'Recarga la página e inténtalo de nuevo — no perderás los datos que ya enviaste.',
    'icon' => 'clock',
    'gradientFrom' => 'from-amber-400',
    'gradientTo' => 'to-orange-500',
    'shadowColor' => 'shadow-amber-500/30',
    'tipTitle' => '¿Por qué ocurrió esto?',
    'tipBody' => 'Laravel protege tu sesión contra ataques CSRF. Si la página estuvo inactiva demasiado tiempo, el token expira por seguridad.',
], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH C:\laragon\www\auxora-main\resources\views\errors\419.blade.php ENDPATH**/ ?>