@include('errors._layout', [
    'code' => '500',
    'highlight' => 'Error del servidor',
    'description' => 'Algo salió mal en nuestros servidores.',
    'subcopy' => 'Nuestro equipo ha sido notificado. Inténtalo de nuevo en unos minutos.',
    'icon' => 'server',
    'gradientFrom' => 'from-rose-500',
    'gradientTo' => 'to-red-600',
    'shadowColor' => 'shadow-rose-500/30',
    'tipTitle' => 'Estamos trabajando en ello',
    'tipBody' => 'Si el problema persiste, contacta al equipo de soporte técnico con la hora exacta del incidente.',
])