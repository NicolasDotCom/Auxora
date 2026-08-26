<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Estadisticas de Tickets</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', Arial, sans-serif; font-size: 10px; color: #1f2937; padding: 16px; }
        .header { margin-bottom: 12px; border-bottom: 2px solid #1d4ed8; padding-bottom: 8px; }
        .header h1 { font-size: 18px; color: #1e40af; margin-bottom: 4px; }
        .muted { color: #6b7280; font-size: 9px; }
        .grid { width: 100%; margin: 10px 0; }
        .grid td { width: 50%; vertical-align: top; padding-right: 8px; }
        .card { border: 1px solid #d1d5db; border-radius: 4px; padding: 8px; margin-bottom: 8px; }
        .card h3 { font-size: 11px; color: #111827; margin-bottom: 6px; }
        table { width: 100%; border-collapse: collapse; margin-top: 4px; }
        th, td { border: 1px solid #e5e7eb; padding: 5px; font-size: 9px; text-align: left; }
        th { background: #f3f4f6; }
        .summary td { font-size: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Estadisticas de Tickets</h1>
        <p class="muted">
            Periodo:
            <?php if($date_from || $date_to): ?>
                <?php echo e($date_from ?: 'Todos'); ?> - <?php echo e($date_to ?: 'Todos'); ?>

            <?php else: ?>
                Todos los registros
            <?php endif; ?>
            | Cliente: <?php echo e($customer_name ?: 'Todos'); ?>

        </p>
        <p class="muted">Generado el <?php echo e(now()->setTimezone(config('app.timezone'))->format('d/m/Y H:i')); ?></p>
    </div>

    <div class="card">
        <h3>Resumen General</h3>
        <table class="summary">
            <tbody>
                <tr><td>Total tickets</td><td><?php echo e($summary['total']); ?></td></tr>
                <tr><td>Cerrados</td><td><?php echo e($summary['closed']); ?></td></tr>
                <tr><td>En progreso</td><td><?php echo e($summary['in_progress']); ?></td></tr>
                <tr><td>Abiertos</td><td><?php echo e($summary['open']); ?></td></tr>
                <tr><td>Tasa de resolucion</td><td><?php echo e($summary['resolution_rate']); ?>%</td></tr>
            </tbody>
        </table>
    </div>

    <table class="grid">
        <tr>
            <td>
                <div class="card">
                    <h3>Top Clientes</h3>
                    <table>
                        <thead><tr><th>Cliente</th><th>Total</th></tr></thead>
                        <tbody>
                            <?php $__empty_1 = true; $__currentLoopData = $top_customers; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $row): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                                <tr><td><?php echo e($row['name']); ?></td><td><?php echo e($row['total']); ?></td></tr>
                            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                                <tr><td colspan="2">Sin datos</td></tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </td>
            <td>
                <div class="card">
                    <h3>Top Asuntos</h3>
                    <table>
                        <thead><tr><th>Asunto</th><th>Total</th></tr></thead>
                        <tbody>
                            <?php $__empty_1 = true; $__currentLoopData = $top_subjects; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $row): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                                <tr><td><?php echo e($row['subject']); ?></td><td><?php echo e($row['total']); ?></td></tr>
                            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                                <tr><td colspan="2">Sin datos</td></tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </td>
        </tr>
        <tr>
            <td>
                <div class="card">
                    <h3>Top Seriales</h3>
                    <table>
                        <thead><tr><th>Serial</th><th>Total</th></tr></thead>
                        <tbody>
                            <?php $__empty_1 = true; $__currentLoopData = $top_serials; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $row): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                                <tr><td><?php echo e($row['serial']); ?></td><td><?php echo e($row['total']); ?></td></tr>
                            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                                <tr><td colspan="2">Sin datos</td></tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </td>
            <td>
                <div class="card">
                    <h3>Top Ciudades</h3>
                    <table>
                        <thead><tr><th>Ciudad</th><th>Total</th></tr></thead>
                        <tbody>
                            <?php $__empty_1 = true; $__currentLoopData = $top_cities; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $row): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                                <tr><td><?php echo e($row['city']); ?></td><td><?php echo e($row['total']); ?></td></tr>
                            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                                <tr><td colspan="2">Sin datos</td></tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </td>
        </tr>
        <tr>
            <td>
                <div class="card">
                    <h3>Tickets por Dia</h3>
                    <table>
                        <thead><tr><th>Dia</th><th>Total</th></tr></thead>
                        <tbody>
                            <?php $__empty_1 = true; $__currentLoopData = $tickets_by_day; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $row): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                                <tr><td><?php echo e($row['day']); ?></td><td><?php echo e($row['total']); ?></td></tr>
                            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                                <tr><td colspan="2">Sin datos</td></tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </td>
            <td>
                <div class="card">
                    <h3>Tickets por Mes</h3>
                    <table>
                        <thead><tr><th>Mes</th><th>Total</th></tr></thead>
                        <tbody>
                            <?php $__empty_1 = true; $__currentLoopData = $tickets_by_month; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $row): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                                <tr><td><?php echo e($row['label']); ?></td><td><?php echo e($row['total']); ?></td></tr>
                            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                                <tr><td colspan="2">Sin datos</td></tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </td>
        </tr>
    </table>

    <div class="card">
        <h3>Top Tecnicos</h3>
        <table>
            <thead><tr><th>Tecnico</th><th>Total</th></tr></thead>
            <tbody>
                <?php $__empty_1 = true; $__currentLoopData = $top_technicians; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $row): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                    <tr><td><?php echo e($row['name']); ?></td><td><?php echo e($row['total']); ?></td></tr>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                    <tr><td colspan="2">Sin datos</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</body>
</html>
<?php /**PATH C:\laragon\www\auxora-main\resources\views\exports\ticket-stats-pdf.blade.php ENDPATH**/ ?>