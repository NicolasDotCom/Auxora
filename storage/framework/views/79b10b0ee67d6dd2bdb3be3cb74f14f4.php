<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Exportación de Tickets</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 9px;
            color: #1f2937;
            padding: 15px;
            background-color: #f3f4f6;
        }
        
        .container {
            background: white;
            border: 2px solid #3b82f6;
        }
        
        .header {
            background-color: #3b82f6;
            color: white;
            text-align: center;
            padding: 20px 15px;
            border-bottom: 4px solid #fbbf24;
        }
        
        .header h1 {
            font-size: 22px;
            margin-bottom: 8px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .header p {
            font-size: 10px;
            margin: 4px 0;
        }
        
        .header .total {
            display: inline-block;
            background-color: rgba(255, 255, 255, 0.2);
            padding: 6px 16px;
            border-radius: 15px;
            margin-top: 8px;
            font-weight: bold;
            font-size: 11px;
        }
        
        .content {
            padding: 12px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            border: 1px solid #d1d5db;
        }
        
        thead {
            background-color: #1e40af;
            color: white;
        }
        
        thead tr {
            border-bottom: 3px solid #fbbf24;
        }
        
        th {
            padding: 10px 4px;
            text-align: center;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-right: 1px solid rgba(255,255,255,0.3);
            border-bottom: 3px solid #fbbf24;
        }
        
        th:last-child {
            border-right: none;
        }
        
        td {
            padding: 7px 4px;
            border-bottom: 1px solid #e5e7eb;
            border-right: 1px solid #f3f4f6;
            font-size: 8px;
            line-height: 1.3;
            vertical-align: middle;
        }
        
        td:last-child {
            border-right: none;
        }
        
        tbody tr:nth-child(odd) {
            background-color: #ffffff;
        }
        
        tbody tr:nth-child(even) {
            background-color: #f9fafb;
        }
        
        tbody tr:last-child td {
            border-bottom: 2px solid #3b82f6;
        }
        
        .footer {
            background-color: #f9fafb;
            text-align: center;
            font-size: 8px;
            color: #6b7280;
            padding: 12px;
            border-top: 3px solid #3b82f6;
        }
        
        .footer strong {
            color: #3b82f6;
            font-weight: bold;
        }
        
        .status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 7px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            text-align: center;
        }
        
        .status-abierto {
            background-color: #fee2e2;
            color: #991b1b;
            border: 1px solid #dc2626;
        }
        
        .status-progreso {
            background-color: #ffedd5;
            color: #9a3412;
            border: 1px solid #f97316;
        }
        
        .status-cerrado {
            background-color: #dcfce7;
            color: #166534;
            border: 1px solid #16a34a;
        }
        
        .ticket-number {
            font-weight: bold;
            color: #3b82f6;
        }
        
        .text-center {
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>REPORTE DE TICKETS</h1>
            <p>Generado el <?php echo e(now()->setTimezone(config('app.timezone'))->format('d/m/Y H:i:s')); ?></p>
            <p class="total">Total de registros: <?php echo e(count($tickets)); ?></p>
        </div>
        
        <div class="content">
            <table>
                <thead>
                    <tr>
                        <th style="width: 6%;">NÚMERO</th>
                        <th style="width: 11%;">ASUNTO</th>
                        <th style="width: 9%;">CLIENTE</th>
                        <th style="width: 9%;">CONTACTO</th>
                        <th style="width: 11%;">DIRECCIÓN</th>
                        <th style="width: 8%;">TÉCNICO</th>
                        <th style="width: 7%;">ESTADO</th>
                        <th style="width: 8%;">F. CREACIÓN</th>
                        <th style="width: 7%;">MARCA</th>
                        <th style="width: 7%;">MODELO</th>
                        <th style="width: 9%;">SERIE</th>
                        <th style="width: 8%;">F. CIERRE</th>
                    </tr>
                </thead>
                <tbody>
                    <?php $__currentLoopData = $tickets; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $ticket): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <tr>
                        <td class="text-center"><span class="ticket-number"><?php echo e($ticket['numero']); ?></span></td>
                        <td><?php echo e($ticket['asunto']); ?></td>
                        <td><?php echo e($ticket['cliente']); ?></td>
                        <td><?php echo e($ticket['nombre_contacto']); ?></td>
                        <td><?php echo e($ticket['direccion']); ?></td>
                        <td><?php echo e($ticket['tecnico']); ?></td>
                        <td class="text-center">
                            <span class="status-badge 
                                <?php if($ticket['estado'] == 'Abierto'): ?> status-abierto 
                                <?php elseif($ticket['estado'] == 'En Progreso'): ?> status-progreso 
                                <?php elseif($ticket['estado'] == 'Cerrado'): ?> status-cerrado 
                                <?php endif; ?>">
                                <?php echo e($ticket['estado']); ?>

                            </span>
                        </td>
                        <td class="text-center"><?php echo e($ticket['fecha_creacion']); ?></td>
                        <td><?php echo e($ticket['marca']); ?></td>
                        <td><?php echo e($ticket['modelo']); ?></td>
                        <td><?php echo e($ticket['serial']); ?></td>
                        <td class="text-center"><?php echo e($ticket['fecha_cierre']); ?></td>
                    </tr>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                </tbody>
            </table>
        </div>
        
        <div class="footer">
            <p>Documento generado automáticamente por el <strong>Sistema de Gestión de Tickets</strong></p>
            <p>&copy; <?php echo e(date('Y')); ?> - Todos los derechos reservados</p>
        </div>
    </div>
</body>
</html>
<?php /**PATH C:\laragon\www\auxora-main\resources\views\exports\tickets-pdf.blade.php ENDPATH**/ ?>