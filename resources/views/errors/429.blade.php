@include('errors._layout', [
    'code' => '429',
    'highlight' => 'Demasiadas solicitudes',
    'description' => 'Has realizado demasiadas peticiones en poco tiempo.',
    'subcopy' => 'Por favor espera un momento antes de intentar de nuevo.',
    'icon' => 'clock',
    'gradientFrom' => 'from-violet-500',
    'gradientTo' => 'to-purple-500',
    'shadowColor' => 'shadow-violet-500/30',
    'tipTitle' => 'Rate limiting',
    'tipBody' => 'El sistema limita las solicitudes para protegerse de abusos. Espera unos segundos e inténtalo de nuevo.',
])