@include('errors._layout', [
    'code' => '404',
    'highlight' => 'Página no encontrada',
    'description' => 'La página que buscas no existe o ha sido movida.',
    'subcopy' => 'Verifica la URL o regresa al inicio para seguir navegando.',
    'showIcon' => false,
    'gradientFrom' => 'from-slate-500',
    'gradientTo' => 'to-slate-700',
    'shadowColor' => 'shadow-slate-500/30',
    'tipTitle' => '¿Qué hago ahora?',
    'tipBody' => 'Revisa la dirección web o usa el menú principal para encontrar lo que necesitas.',
])
