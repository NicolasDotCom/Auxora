@include('errors._layout', [
    'code' => '503',
    'highlight' => 'Servicio no disponible',
    'description' => 'Estamos realizando tareas de mantenimiento programado.',
    'subcopy' => 'Volveremos a estar en línea en breve. Gracias por tu paciencia.',
    'icon' => 'wifi',
    'gradientFrom' => 'from-cyan-500',
    'gradientTo' => 'to-blue-500',
    'shadowColor' => 'shadow-cyan-500/30',
    'tipTitle' => 'Mantenimiento en curso',
    'tipBody' => 'Estamos mejorando el servicio. Mientras tanto, tus datos están seguros y todo volverá a la normalidad pronto.',
])