<?php $attributes ??= new \Illuminate\View\ComponentAttributeBag;

$__newAttributes = [];
$__propNames = \Illuminate\View\ComponentAttributeBag::extractPropNames(([
    'code' => '500',
    'title' => 'Algo salió mal',
    'highlight' => '¡Ups!',
    'description' => 'Ha ocurrido un error inesperado. Estamos trabajando para solucionarlo.',
    'subcopy' => null,
    'icon' => 'alert', // alert | clock | key | lock | compass | server | wifi
    'showIcon' => false,
    'gradientFrom' => 'from-brand-500',
    'gradientTo' => 'to-brand-cyan',
    'shadowColor' => 'shadow-brand-500/30',
    'tipTitle' => '¿Qué puedo hacer?',
    'tipBody' => 'Intenta recargar la página o volver más tarde.',
]));

foreach ($attributes->all() as $__key => $__value) {
    if (in_array($__key, $__propNames)) {
        $$__key = $$__key ?? $__value;
    } else {
        $__newAttributes[$__key] = $__value;
    }
}

$attributes = new \Illuminate\View\ComponentAttributeBag($__newAttributes);

unset($__propNames);
unset($__newAttributes);

foreach (array_filter(([
    'code' => '500',
    'title' => 'Algo salió mal',
    'highlight' => '¡Ups!',
    'description' => 'Ha ocurrido un error inesperado. Estamos trabajando para solucionarlo.',
    'subcopy' => null,
    'icon' => 'alert', // alert | clock | key | lock | compass | server | wifi
    'showIcon' => false,
    'gradientFrom' => 'from-brand-500',
    'gradientTo' => 'to-brand-cyan',
    'shadowColor' => 'shadow-brand-500/30',
    'tipTitle' => '¿Qué puedo hacer?',
    'tipBody' => 'Intenta recargar la página o volver más tarde.',
]), 'is_string', ARRAY_FILTER_USE_KEY) as $__key => $__value) {
    $$__key = $$__key ?? $__value;
}

$__defined_vars = get_defined_vars();

foreach ($attributes->all() as $__key => $__value) {
    if (array_key_exists($__key, $__defined_vars)) unset($$__key);
}

unset($__defined_vars, $__key, $__value); ?>

<?php
$gradients = [
    'brand' => ['from' => 'from-brand-500', 'to' => 'to-brand-cyan', 'shadow' => 'shadow-brand-500/30'],
    'amber' => ['from' => 'from-amber-500', 'to' => 'to-orange-500', 'shadow' => 'shadow-amber-500/30'],
    'rose'  => ['from' => 'from-rose-500',  'to' => 'to-red-500',   'shadow' => 'shadow-rose-500/30'],
    'slate' => ['from' => 'from-slate-500', 'to' => 'to-slate-700', 'shadow' => 'shadow-slate-500/30'],
    'violet'=> ['from' => 'from-violet-500','to' => 'to-purple-500', 'shadow' => 'shadow-violet-500/30'],
    'cyan'  => ['from' => 'from-cyan-500',  'to' => 'to-blue-500',   'shadow' => 'shadow-cyan-500/30'],
];
$palette = match(true) {
    str_contains($gradientFrom, 'amber')  => $gradients['amber'],
    str_contains($gradientFrom, 'rose')   => $gradients['rose'],
    str_contains($gradientFrom, 'slate')  => $gradients['slate'],
    str_contains($gradientFrom, 'violet') => $gradients['violet'],
    str_contains($gradientFrom, 'cyan')   => $gradients['cyan'],
    default                                => $gradients['brand'],
};
$inlineGradient = match($palette['from']) {
    'from-amber-500'  => 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
    'from-rose-500'   => 'linear-gradient(135deg, #f43f5e 0%, #ef4444 100%)',
    'from-slate-500'  => 'linear-gradient(135deg, #64748b 0%, #334155 100%)',
    'from-violet-500' => 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
    'from-cyan-500'   => 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    default           => 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
};
?>

<!DOCTYPE html>
<html lang="<?php echo e(str_replace('_', '-', app()->getLocale())); ?>" class="dark">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <title><?php echo e($title); ?> — <?php echo e(config('app.name', 'Auxora')); ?></title>
    <link rel="icon" type="image/png" href="<?php echo e(asset('images/logo-128.png')); ?>">
    <style>
        @keyframes floaty {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        @keyframes ring-pulse {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 0; transform: scale(1.4); }
        }
        .floaty { animation: floaty 4s ease-in-out infinite; }
        .ring-pulse { animation: ring-pulse 3s ease-out infinite; }
    </style>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        brand: { 50:'#eff6ff', 100:'#dbeafe', 500:'#2563eb', 600:'#1e40af', 700:'#1e3a8a', cyan:'#06b6d4' }
                    },
                    fontFamily: { sans: ['Inter','system-ui','-apple-system','Segoe UI','Roboto','sans-serif'] }
                }
            }
        }
    </script>
</head>
<body class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 font-sans antialiased overflow-hidden">
    <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div class="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-20" style="background: <?php echo e($inlineGradient); ?>;"></div>
        <div class="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-20" style="background: <?php echo e($inlineGradient); ?>;"></div>
    </div>

    <div class="relative min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div class="w-full max-w-2xl text-center">
            <a href="<?php echo e(url('/')); ?>" class="inline-flex items-center gap-3 mb-10 group">
                <div class="relative">
                    <div class="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-cyan rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
                    <img src="<?php echo e(asset('images/logo-128.png')); ?>" alt="Auxora" class="relative w-12 h-12 rounded-xl ring-1 ring-slate-200/50 dark:ring-slate-700/50 shadow-sm">
                </div>
                <span class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Auxora</span>
            </a>

            <?php if($showIcon): ?>
            <div class="relative inline-block floaty mb-6">
                <div class="absolute inset-0 rounded-full ring-pulse" style="background: <?php echo e($inlineGradient); ?>;"></div>
                <div class="relative w-20 h-20 mx-auto rounded-full shadow-2xl <?php echo e($shadowColor); ?> flex items-center justify-center" style="background: <?php echo e($inlineGradient); ?>;">
                    <?php if($icon === 'clock'): ?>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-10 h-10 text-white"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <?php elseif($icon === 'key'): ?>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-10 h-10 text-white"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>
                    <?php elseif($icon === 'lock'): ?>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-10 h-10 text-white"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <?php elseif($icon === 'compass'): ?>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 text-white"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
                    <?php elseif($icon === 'server'): ?>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-10 h-10 text-white"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>
                    <?php elseif($icon === 'wifi'): ?>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-10 h-10 text-white"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" x2="12.01" y1="20" y2="20"/></svg>
                    <?php else: ?>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-10 h-10 text-white"><path d="m10.29 3.86-8.18 14a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                    <?php endif; ?>
                </div>
            </div>
            <?php endif; ?>

            <h1 class="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
                <?php echo e($highlight); ?>

            </h1>

            <p class="text-lg text-slate-600 dark:text-slate-300 mb-2 max-w-md mx-auto">
                <?php echo e($description); ?>

            </p>
            <?php if($subcopy): ?>
            <p class="text-base text-slate-500 dark:text-slate-400 mb-10 max-w-md mx-auto">
                <?php echo e($subcopy); ?>

            </p>
            <?php else: ?>
            <div class="mb-10"></div>
            <?php endif; ?>

            <div class="inline-flex items-center gap-2 px-3 py-1.5 mb-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium">
                <span class="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse"></span>
                Error <?php echo e($code); ?>

            </div>

            <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button onclick="location.reload()" class="group inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold shadow-lg <?php echo e($shadowColor); ?> hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200" style="background: <?php echo e($inlineGradient); ?>;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 group-hover:rotate-180 transition-transform duration-500"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                    Recargar página
                </button>
                <a href="<?php echo e(url('/')); ?>" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:-translate-y-0.5 transition-all duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    Ir al inicio
                </a>
            </div>

            <div class="mt-12 inline-flex items-start gap-3 max-w-md text-left p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur border border-slate-200/60 dark:border-slate-700/60">
                <div class="shrink-0 w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-500">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                </div>
                <div class="text-sm">
                    <p class="font-semibold text-slate-800 dark:text-slate-100 mb-0.5"><?php echo e($tipTitle); ?></p>
                    <p class="text-slate-600 dark:text-slate-400 leading-relaxed"><?php echo e($tipBody); ?></p>
                </div>
            </div>
        </div>

        <p class="mt-12 text-xs text-slate-400 dark:text-slate-500">
            © <?php echo e(date('Y')); ?> <?php echo e(config('app.name', 'Auxora')); ?> · Plataforma de Gestión de Tickets
        </p>
    </div>
</body>
</html>
<?php /**PATH C:\laragon\www\auxora-main\resources\views/errors/_layout.blade.php ENDPATH**/ ?>