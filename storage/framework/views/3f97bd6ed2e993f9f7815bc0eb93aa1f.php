<?php
    use Carbon\Carbon;

    $mode = $mode ?? 'form';
    $tz = config('app.timezone', 'America/Bogota');
    $now = isset($generatedAt) ? Carbon::parse($generatedAt)->setTimezone($tz) : now($tz);

    $clientName = $ticket->customer?->name ?? $ticket->cliente_externo ?? '';
    $clientContact = $ticket->nombre_contacto ?? '';
    $clientPhone = $ticket->phone ?? '';
    $clientAddress = $ticket->address ?? '';
    $clientCity = $ticket->ciudad ?? '';
    $techName = $ticket->support?->name ?? '';
    $ticketNumber = str_pad((string) $ticket->id, 4, '0', STR_PAD_LEFT);

    $formData = $formData ?? [];
    $parts = $formData['parts'] ?? [];
    $parts = is_array($parts) ? $parts : [];
    $parts = array_values($parts);
    if (empty($parts)) {
        $parts = [['nombre' => '', 'descripcion' => '', 'codigo' => '']];
    }

    $oldValue = function (string $key, $default = '') use ($formData) {
        return old($key, $formData[$key] ?? $default);
    };

    $oldPartValue = function (int $index, string $key, string $default = '') use ($parts) {
        return old("parts.$index.$key", $parts[$index][$key] ?? $default);
    };

    $subject = $ticket->subject ?? '';
    $check = function (string $label) use ($subject): string {
        $map = [
            'Acta de Instalación' => $subject === 'Instalación',
            'Correctivo' => in_array($subject, ['Manchas', 'Atascos', 'Código de Error', 'Configuración ó Escaner', 'Otros'], true),
            'Preventivo' => $subject === 'Mantenimiento Preventivo',
            'Reinstalación' => false,
            'Acta Instrucción' => false,
            'Traslado' => false,
            'Cotización T&M' => in_array($subject, ['Solicitud de Toner', 'Contadores'], true),
            'Reparación T&M' => in_array($subject, ['Remoto', 'Servicio de Ingeniería'], true),
        ];

        return !empty($map[$label]) ? 'X' : '';
    };

    $formatDate = function ($value) use ($tz) {
        return $value ? Carbon::parse($value)->setTimezone($tz)->format('d/m/Y H:i') : '';
    };

    $formatForInput = function ($value) use ($tz) {
        return $value ? Carbon::parse($value)->setTimezone($tz)->format("Y-m-d\\TH:i") : '';
    };

    if (!empty($formData['arrival_at'])) {
        $arrivalAtText = $formatDate($formData['arrival_at']);
    } else {
        $arrivalAtText = isset($arrivalAt) && $arrivalAt ? $formatDate($arrivalAt) : '';
    }

    $arrivalAtInput = !empty($formData['arrival_at']) ? $formatForInput($formData['arrival_at']) : (isset($arrivalAt) && $arrivalAt ? $formatForInput($arrivalAt) : '');
    $departureAtInput = !empty($formData['departure_at']) ? $formatForInput($formData['departure_at']) : $now->format("Y-m-d\\TH:i");
    $departureAtText = !empty($formData['departure_at']) ? $formatDate($formData['departure_at']) : $now->format('d/m/Y H:i');
?>

<?php if(($mode ?? 'form') === 'form'): ?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generar reporte de visita #<?php echo e($ticketNumber); ?></title>
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            background: #f3f4f6;
            color: #111827;
            padding: 24px;
        }
        .page {
            max-width: 1100px;
            margin: 0 auto;
            background: #fff;
            border: 1px solid #d1d5db;
            border-radius: 12px;
            overflow: hidden;
        }
        .header {
            background: linear-gradient(90deg, #0f172a 0%, #111827 100%);
            color: #fff;
            padding: 18px 22px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
        }
        .header h1 {
            margin: 0;
            font-size: 18px;
            letter-spacing: .4px;
        }
        .header p { margin: 4px 0 0; color: #cbd5e1; font-size: 13px; }
        .ticket-box {
            text-align: right;
            font-size: 13px;
            color: #cbd5e1;
        }
        .content { padding: 18px 22px 24px; }
        table { width: 100%; border-collapse: collapse; }
        .meta td {
            border: 1px solid #d1d5db;
            padding: 10px;
            vertical-align: top;
            font-size: 14px;
        }
        .meta label, .parts label, .signatures label {
            display: block;
            font-size: 12px;
            font-weight: 700;
            margin-bottom: 5px;
            color: #374151;
        }
        input[type="text"], textarea {
            width: 100%;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 12px;
            font-size: 14px;
            outline: none;
            background: #fff;
        }
        textarea { min-height: 100px; resize: vertical; }
        input[readonly] { background: #f8fafc; }
        .section-title {
            margin: 18px 0 10px;
            font-size: 15px;
            font-weight: 700;
            color: #111827;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
        }
        .checkbox-grid td {
            border: 1px solid #d1d5db;
            padding: 8px 10px;
            font-size: 13px;
        }
        .checkbox {
            font-weight: 700;
            margin-right: 6px;
        }
        .parts-table th, .parts-table td {
            border: 1px solid #d1d5db;
            padding: 8px;
            font-size: 13px;
            vertical-align: top;
        }
        .parts-table th {
            background: #f8fafc;
            text-align: left;
        }
        .btn-row {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 18px;
        }
        .btn {
            border: 0;
            border-radius: 10px;
            padding: 12px 16px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        .btn-primary { background: #2563eb; color: #fff; }
        .btn-secondary { background: #e5e7eb; color: #111827; }
        .alert {
            border: 1px solid #fecaca;
            background: #fef2f2;
            color: #991b1b;
            padding: 12px 14px;
            border-radius: 10px;
            margin-bottom: 16px;
            font-size: 14px;
        }
        .error {
            color: #b91c1c;
            font-size: 12px;
            margin-top: 6px;
        }
        .hint {
            color: #6b7280;
            font-size: 12px;
        }
        .readonly-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0;
        }
        .readonly-grid > div {
            border: 1px solid #d1d5db;
            padding: 10px;
            min-height: 68px;
        }
        .readonly-grid .wide { grid-column: span 2; }
        .parts-toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            margin: 10px 0;
        }
        .parts-toolbar button {
            border: 0;
            background: #111827;
            color: #fff;
            border-radius: 8px;
            padding: 8px 12px;
            cursor: pointer;
            font-weight: 700;
        }
        .signature-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
        }
        .signature-pad {
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            overflow: hidden;
            background: #fff;
        }
        .signature-pad .signature-canvas {
            width: 100%;
            height: 440px;
            display: block;
            touch-action: none;
            background: repeating-linear-gradient(
                to bottom,
                #ffffff,
                #ffffff 30px,
                #f8fafc 30px,
                #f8fafc 31px
            );
        }
        .signature-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            border-top: 1px solid #e5e7eb;
            background: #f8fafc;
        }
        .signature-actions button {
            border: 0;
            background: #2563eb;
            color: #fff;
            border-radius: 8px;
            padding: 7px 10px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
        }
        .signature-actions .secondary {
            background: #e5e7eb;
            color: #111827;
        }
        @media (max-width: 900px) {
            .readonly-grid { grid-template-columns: repeat(2, 1fr); }
            .signature-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
            .page { padding: 12px; }
            .content { padding: 12px; }
            .header { padding: 12px; }
            table.meta { width: 100%; }
            table.meta td { display: block; width: 100%; box-sizing: border-box; border-left: none; border-right: none; }
            .meta td input, .meta td label { width: 100%; }
            input[type="datetime-local"], input[type="date"], input[type="time"] {
                width: 100%;
                max-width: 100%;
            }
            .signature-pad .signature-canvas { height: 120px; }
            .parts-table, .parts-table th, .parts-table td { font-size: 13px; }
        }
        @media print {
            body { background: #fff; padding: 0; }
            .page { border: 0; border-radius: 0; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="header no-print">
            <div>
                <h1>Generar reporte de visita</h1>
                <p>Complete los campos solicitados para crear el documento imprimible.</p>
            </div>
            <div class="ticket-box">
                Ticket #<?php echo e($ticketNumber); ?><br>
                Técnico: <?php echo e($techName ?: 'Sin asignar'); ?>

            </div>
        </div>

        <div class="content">
            <?php if(session('error')): ?>
                <div class="alert"><?php echo e(session('error')); ?></div>
            <?php endif; ?>

            <?php if($errors->any()): ?>
                <div class="alert">
                    Corrige los campos marcados antes de generar el reporte.
                </div>
            <?php endif; ?>

            <form method="POST" action="<?php echo e(route('tickets.reporte-visita.store', $ticket->id)); ?>" target="_blank" enctype="multipart/form-data">
                <?php echo csrf_field(); ?>

                <div class="section-title">Datos tomados del ticket</div>
                <table class="meta">
                    <tr>
                        <td><label>Número de ticket</label><input type="text" value="#<?php echo e($ticketNumber); ?>" readonly></td>
                        <td><label>Nombre o razón social</label><input type="text" name="cliente_nombre" value="<?php echo e(old('cliente_nombre', $clientName)); ?>"></td>
                    </tr>
                    <tr>
                        <td><label>Dirección</label><input type="text" name="cliente_direccion" value="<?php echo e(old('cliente_direccion', $clientAddress)); ?>"></td>
                        <td><label>Ciudad</label><input type="text" name="cliente_ciudad" value="<?php echo e(old('cliente_ciudad', $clientCity)); ?>"></td>
                    </tr>
                    <tr>
                        <td><label>Contacto</label><input type="text" name="cliente_contacto" value="<?php echo e(old('cliente_contacto', $clientContact)); ?>"></td>
                        <td><label>Teléfono</label><input type="text" name="cliente_telefono" value="<?php echo e(old('cliente_telefono', $clientPhone)); ?>"></td>
                    </tr>
                    <tr>
                        <td><label>Técnico asignado</label><input type="text" name="tecnico_nombre" value="<?php echo e(old('tecnico_nombre', $techName ?: 'Sin asignar')); ?>"></td>
                        <td><label>Marca</label><input type="text" name="equipo_marca" value="<?php echo e(old('equipo_marca', $ticket->brand ?? '')); ?>"></td>
                    </tr>
                    <tr>
                        <td><label>Modelo</label><input type="text" name="equipo_modelo" value="<?php echo e(old('equipo_modelo', $ticket->model ?? '')); ?>"></td>
                        <td><label>N. de serie</label><input type="text" name="equipo_serial" value="<?php echo e(old('equipo_serial', $ticket->serial ?? '')); ?>"></td>
                    </tr>
                    <tr>
                        <td>
                            <label>Fecha y hora de llegada</label>
                            <input type="datetime-local" name="arrival_at" value="<?php echo e(old('arrival_at', $arrivalAtInput)); ?>">
                            <?php $__errorArgs = ['arrival_at'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?><div class="error"><?php echo e($message); ?></div><?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>
                        </td>
                        <td>
                            <label>Fecha y hora de salida</label>
                            <input type="datetime-local" name="departure_at" value="<?php echo e(old('departure_at', $departureAtInput)); ?>">
                            <?php $__errorArgs = ['departure_at'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?><div class="error"><?php echo e($message); ?></div><?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>
                        </td>
                    </tr>
                    <tr>
                        <td><label>Contador Inicial <span style="color: red;">*</span></label><input type="text" name="contador_inicial" value="<?php echo e(old('contador_inicial', '')); ?>" required>
                            <?php $__errorArgs = ['contador_inicial'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?><div class="error"><?php echo e($message); ?></div><?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>
                        </td>
                        <td><label>Contador Final <span style="color: red;">*</span></label><input type="text" name="contador_final" value="<?php echo e(old('contador_final', '')); ?>" required>
                            <?php $__errorArgs = ['contador_final'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?><div class="error"><?php echo e($message); ?></div><?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>
                        </td>
                    </tr>
                </table>

                <div class="section-title">Datos del reporte</div>
                <div class="readonly-grid">
                    <div class="wide">
                        <label>Problema reportado <span style="color: red;">*</span></label>
                        <textarea name="problema_reportado" placeholder="Escriba aquí el problema reportado"><?php echo e($oldValue('problema_reportado')); ?></textarea>
                        <?php $__errorArgs = ['problema_reportado'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?><div class="error"><?php echo e($message); ?></div><?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>
                    </div>
                    <div class="wide">
                        <label>Observación o diagnóstico <span style="color: red;">*</span></label>
                        <textarea name="observacion_diagnostico" placeholder="Escriba aquí la observación o diagnóstico"><?php echo e($oldValue('observacion_diagnostico')); ?></textarea>
                        <?php $__errorArgs = ['observacion_diagnostico'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?><div class="error"><?php echo e($message); ?></div><?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>
                    </div>
                    <div>
                        <label>Nombre cliente firma <span style="color: red;">*</span></label>
                        <input type="text" name="nombre_cliente_firma" value="<?php echo e($oldValue('nombre_cliente_firma', $clientName)); ?>">
                        <?php $__errorArgs = ['nombre_cliente_firma'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?><div class="error"><?php echo e($message); ?></div><?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>
                    </div>
                    <div>
                        <label>Cargo cliente</label>
                        <input type="text" name="cargo_cliente" value="<?php echo e($oldValue('cargo_cliente')); ?>">
                        <?php $__errorArgs = ['cargo_cliente'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?><div class="error"><?php echo e($message); ?></div><?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>
                    </div>
                    <div>
                        <label>Nombre técnico firma <span style="color: red;">*</span></label>
                        <input type="text" name="nombre_tecnico_firma" value="<?php echo e($oldValue('nombre_tecnico_firma', $techName)); ?>">
                        <?php $__errorArgs = ['nombre_tecnico_firma'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?><div class="error"><?php echo e($message); ?></div><?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>
                    </div>
                    <div>
                        <label>Cargo técnico</label>
                        <input type="text" name="cargo_tecnico" value="<?php echo e($oldValue('cargo_tecnico', 'Técnico')); ?>">
                        <?php $__errorArgs = ['cargo_tecnico'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?><div class="error"><?php echo e($message); ?></div><?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>
                    </div>
                    <div class="wide">
                        <label>Firma del cliente (obligatoria)</label>
                        <input type="hidden" name="firma_cliente_base64" id="firma_cliente_base64" value="<?php echo e(old('firma_cliente_base64')); ?>">
                        <div class="signature-pad">
                            <canvas id="signature-client" class="signature-canvas"></canvas>
                            <div class="signature-actions">
                                <span class="hint">Firme dentro del recuadro</span>
                                <button type="button" class="secondary" data-clear-signature="signature-client">Limpiar</button>
                            </div>
                        </div>
                        <?php $__errorArgs = ['firma_cliente_base64'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?><div class="error"><?php echo e($message); ?></div><?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>
                    </div>
                    <div class="wide">
                        <label>Firma del técnico (obligatoria)</label>
                        <input type="hidden" name="firma_tecnico_base64" id="firma_tecnico_base64" value="<?php echo e(old('firma_tecnico_base64')); ?>">
                        <div class="signature-pad">
                            <canvas id="signature-tech" class="signature-canvas"></canvas>
                            <div class="signature-actions">
                                <span class="hint">Firme dentro del recuadro</span>
                                <button type="button" class="secondary" data-clear-signature="signature-tech">Limpiar</button>
                            </div>
                        </div>
                        <?php $__errorArgs = ['firma_tecnico_base64'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?><div class="error"><?php echo e($message); ?></div><?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>
                    </div>
                </div>

                <div class="section-title">Repuestos</div>
                <div class="parts-toolbar no-print">
                    <span class="hint">Complete al menos un repuesto con descripción y código.</span>
                    <button type="button" onclick="addPartRow()">+ Agregar repuesto</button>
                </div>
                <table class="parts-table" id="parts-table">
                    <thead>
                        <tr>
                            <th>Descripción</th>
                            <th style="width: 25%;">Código</th>
                            <th style="width: 10%;" class="no-print">Acción</th>
                        </tr>
                    </thead>
                    <tbody id="parts-body">
                        <?php $__currentLoopData = $parts; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $index => $part): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                            <tr>
                                <td>
                                    <input type="text" name="parts[<?php echo e($index); ?>][descripcion]" value="<?php echo e($oldPartValue($index, 'descripcion')); ?>">
                                    <?php $__errorArgs = ['parts.' . $index . '.descripcion'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?><div class="error"><?php echo e($message); ?></div><?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>
                                </td>
                                <td>
                                    <input type="text" name="parts[<?php echo e($index); ?>][codigo]" value="<?php echo e($oldPartValue($index, 'codigo')); ?>">
                                    <?php $__errorArgs = ['parts.' . $index . '.codigo'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?><div class="error"><?php echo e($message); ?></div><?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>
                                </td>
                                <td class="no-print" style="text-align:center;"><button type="button" onclick="removePartRow(this)">Quitar</button></td>
                            </tr>
                        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                    </tbody>
                </table>
                <?php $__errorArgs = ['parts'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?><div class="error"><?php echo e($message); ?></div><?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>

                <div class="btn-row no-print">
                    <a class="btn btn-secondary" href="<?php echo e(route('tickets.show', $ticket->id)); ?>">Cancelar</a>
                    <button type="submit" formaction="<?php echo e(route('tickets.reporte-visita.store', $ticket->id)); ?>" formtarget="_blank" class="btn btn-primary">Abrir PDF</button>
                    <button type="submit" formaction="<?php echo e(route('tickets.reporte-visita.store-and-comment', $ticket->id)); ?>" class="btn btn-primary">Generar PDF</button>
                </div>
            </form>
        </div>
    </div>

    <template id="part-row-template">
        <tr>
            <td><input type="text" name="__DESC__" value=""></td>
            <td><input type="text" name="__CODE__" value=""></td>
            <td class="no-print" style="text-align:center;"><button type="button" onclick="removePartRow(this)">Quitar</button></td>
        </tr>
    </template>

    <script>
        let partIndex = <?php echo e(count($parts)); ?>;

        function addPartRow() {
            const template = document.getElementById('part-row-template');
            const tbody = document.getElementById('parts-body');
            const clone = template.content.cloneNode(true);
            const row = clone.querySelector('tr');
            row.querySelectorAll('input')[0].name = `parts[${partIndex}][descripcion]`;
            row.querySelectorAll('input')[1].name = `parts[${partIndex}][codigo]`;
            tbody.appendChild(clone);
            partIndex++;
        }

        function removePartRow(button) {
            const tbody = document.getElementById('parts-body');
            if (tbody.rows.length > 1) {
                button.closest('tr').remove();
            }
        }

        function setupSignaturePad(canvasId, hiddenId) {
            const canvas = document.getElementById(canvasId);
            const hidden = document.getElementById(hiddenId);
            if (!canvas || !hidden) return;

            const ctx = canvas.getContext('2d');
            let drawing = false;
            let lastX = 0;
            let lastY = 0;
            let hasInk = Boolean(hidden.value);
            let strokes = [];
            let currentStroke = null;
            canvas.dataset.dirty = hidden.value ? '1' : '0';

            const escapeXml = (value) => String(value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');

            const svgToDataUri = (svgMarkup) => {
                return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgMarkup)));
            };

            const buildSignatureSvg = (width, height) => {
                const paths = strokes.map((stroke) => {
                    if (!stroke.length) return '';
                    const commands = stroke.map((point, index) => {
                        const x = point.x.toFixed(2);
                        const y = point.y.toFixed(2);
                        return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                    }).join(' ');
                    return `<path d="${commands}" fill="none" stroke="#111827" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />`;
                }).join('');

                return `
                    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
                        <rect width="100%" height="100%" fill="#ffffff" />
                        ${paths}
                    </svg>
                `;
            };

            const syncHiddenFromStrokes = () => {
                if (!hasInk || strokes.length === 0) {
                    hidden.value = '';
                    return;
                }

                const width = canvas.clientWidth || 320;
                const height = canvas.clientHeight || 160;
                hidden.value = svgToDataUri(buildSignatureSvg(width, height));
            };

            const resizeCanvas = () => {
                const dataUrl = hidden.value;
                const rect = canvas.getBoundingClientRect();
                const ratio = window.devicePixelRatio || 1;
                const width = Math.max(320, rect.width || canvas.clientWidth || 320);
                const height = Math.max(160, rect.height || canvas.clientHeight || 160);
                canvas.width = width * ratio;
                canvas.height = height * ratio;
                canvas.style.width = width + 'px';
                canvas.style.height = height + 'px';
                ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.strokeStyle = '#111827';
                ctx.lineWidth = 2.2;
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, width, height);

                if (dataUrl) {
                    const img = new Image();
                    img.onload = () => {
                        ctx.drawImage(img, 0, 0, width, height);
                        hasInk = true;
                        canvas.dataset.dirty = '1';
                    };
                    img.src = dataUrl;
                }
            };

            const getPosition = (event) => {
                const rect = canvas.getBoundingClientRect();
                const touch = event.touches && event.touches[0];
                const clientX = touch ? touch.clientX : event.clientX;
                const clientY = touch ? touch.clientY : event.clientY;
                return {
                    x: clientX - rect.left,
                    y: clientY - rect.top,
                };
            };

            const startDraw = (event) => {
                drawing = true;
                const pos = getPosition(event);
                lastX = pos.x;
                lastY = pos.y;
                currentStroke = [{ x: pos.x, y: pos.y }];
                strokes.push(currentStroke);
            };

            const draw = (event) => {
                if (!drawing) return;
                event.preventDefault();
                const pos = getPosition(event);
                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
                lastX = pos.x;
                lastY = pos.y;
                hasInk = true;
                canvas.dataset.dirty = '1';
                currentStroke?.push({ x: pos.x, y: pos.y });
                syncHiddenFromStrokes();
            };

            const stopDraw = () => {
                drawing = false;
                syncHiddenFromStrokes();
                currentStroke = null;
            };

            canvas.addEventListener('mousedown', startDraw);
            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('mouseup', stopDraw);
            canvas.addEventListener('mouseleave', stopDraw);
            canvas.addEventListener('touchstart', startDraw, { passive: true });
            canvas.addEventListener('touchmove', draw, { passive: false });
            canvas.addEventListener('touchend', stopDraw);

            window.addEventListener('resize', resizeCanvas);
            resizeCanvas();

            if (hidden.value) {
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    hasInk = true;
                    canvas.dataset.dirty = '1';
                };
                img.src = hidden.value;
            }

            document.querySelector(`[data-clear-signature="${canvasId}"]`)?.addEventListener('click', () => {
                hidden.value = '';
                hasInk = false;
                canvas.dataset.dirty = '0';
                strokes = [];
                currentStroke = null;
                resizeCanvas();
            });

            return { canvas, hidden, resizeCanvas };
        }

        const signatureClient = setupSignaturePad('signature-client', 'firma_cliente_base64');
        const signatureTech = setupSignaturePad('signature-tech', 'firma_tecnico_base64');

        document.querySelector('form')?.addEventListener('submit', () => {
            if (signatureClient) {
                signatureClient.hidden.value = signatureClient.hidden.value || '';
            }
            if (signatureTech) {
                signatureTech.hidden.value = signatureTech.hidden.value || '';
            }
        });
    </script>
</body>
</html>
<?php else: ?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Certificación de Prestación de Servicio #<?php echo e($ticketNumber); ?></title>
    <style>
        @page {
            size: letter portrait;
            margin: 0.2cm 2cm 0.2cm 2cm;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: DejaVu Sans, Arial, Helvetica, sans-serif;
            font-size: 7.8pt;
            color: #111;
            line-height: 1.08;
            padding: 0 2cm;
            margin: 0;
        }
        .container {
            border: 0;
            width: 100%;
            table-layout: fixed;
            margin: 0;
            padding: 0;
        }
        .container-cell {
            border: 0 !important;
            padding: 10pt 0 0.5pt 0 !important;
            margin: 0 !important;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        .sheet {
            border: 1.1pt solid #000;
            width: 100%;
            margin: 0;
            margin-bottom: 0;
            padding: 0;
        }
        .sheet:first-of-type {
            border: 0;
        }
        .sheet:first-of-type td:first-child {
            border-left: 0;
        }
        .sheet:first-of-type td:last-child {
            border-right: 0;
        }
        .sheet:first-of-type tr:first-child td {
            border-top: 0;
        }
        .sheet:first-of-type tr:last-child td {
            border-bottom: 0;
        }
        .signatures-sheet {
            border-left: 0;
            border-right: 0;
        }
        .signatures-sheet tr > td:first-child {
            border-left: 0;
        }
        .signatures-sheet tr > td:last-child {
            border-right: 0;
        }
        td, th {
            border: 0 !important;
            vertical-align: top;
            padding: 2.2pt 2.4pt;
            word-wrap: break-word;
        }
        .no-border { border: 0 !important; }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: 700; }
        .tiny { font-size: 4pt; }
        .small { font-size: 6.8pt; }
        .medium { font-size: 7.8pt; }
        .title {
            font-size: 11pt;
            font-weight: 700;
            letter-spacing: 0.2pt;
            text-transform: uppercase;
            color: #c41e3a;
        }
        .brand {
            font-size: 9pt;
            font-weight: 700;
            line-height: 0.8;
            text-transform: uppercase;
            color: #c41e3a;
        }
        .brand-hp { color: #c41e3a; }
        .brand-ricoh { color: #c41e3a; }
        .brand-xerox { color: #c41e3a; }
        .brand-brother { color: #c41e3a; }
        .brand-kyocera { color: #c41e3a; }
        .section-label {
            background: #d0d0d0;
            font-weight: 700;
            font-size: 8pt;
            padding: 1.6pt 1.8pt;
            border: 0;
        }
        .field-label {
            font-size: 7.8pt;
            color: #000;
            font-weight: 600;
            line-height: 1;
            margin-bottom: 0.6pt;
            background: #e8e8e8;
            padding: 1.5pt 1.5pt;
        }
        .field-value {
            font-size: 9pt;
            font-weight: 600;
            min-height: 9.5pt;
            line-height: 1.06;
        }
        .checkbox-cell {
            font-size: 7.2pt;
            padding: 5pt 1.6pt 7pt 1.6pt;
            text-align: left;
        }
        .checkbox-box {
            display: inline-block;
            width: 7.5pt;
            height: 7.5pt;
            border: 0.8pt solid #444;
            margin-right: 3.5pt;
            vertical-align: middle;
        }
        .sign-box {
            min-height: 144pt;
            border: 0;
            padding: 7.2pt 7.2pt;
        }
        .lines div {
            border-bottom: 0;
            height: 10pt;
            margin-bottom: 3.5pt;
        }
        .legal {
            font-size: 6.5pt;
            line-height: 1.14;
            text-align: justify;
            padding: 2.4pt 2.4pt;
        }
        .parts-table th, .parts-table td {
            font-size: 6.8pt;
            padding: 1.8pt 1.6pt;
            border: 0 !important;
        }
        .parts-table th {
            background: #d8d8d8;
            font-weight: 700;
        }
        .electric-table td {
            font-size: 6.2pt;
            padding: 1.4pt 1.3pt;
            border: 0 !important;
        }
        .logo-img {
            max-width: 144pt;
            max-height: 120pt;
            display: block;
            margin: 0 auto;
        }
        .client-data-grid td {
            border: 0.9pt solid #000 !important;
        }
        .client-data-grid .section-label {
            border: 0.9pt solid #000 !important;
        }
        .client-data-grid .field-label {
            font-weight: 700;
            color: #111;
            font-size: 7.8pt;
        }
        .client-data-grid .field-value {
            font-weight: 400;
            color: #555;
            font-size: 9pt;
        }
        @media print {
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
<!-- CONTENEDOR PRINCIPAL -->
<table class="container">
    <tr>
        <td class="container-cell">
<!-- ENCABEZADO CON LOGO AUXORA Y MARCAS -->
<table class="sheet" style="margin-bottom: 0;">
    <tr style="height: 76pt; padding-top: 8pt;">
        <td style="width: 12%; padding: 8pt 1.4pt 1.4pt 8pt; border-right: 0; text-align: left; vertical-align: middle;">
            <?php
                $__logo_path = public_path('images/logo.png');
                $__logo_png = file_exists($__logo_path) ? base64_encode(file_get_contents($__logo_path)) : null;
            ?>
            <?php if($__logo_png): ?>
                <img src="data:image/png;base64,<?php echo e($__logo_png); ?>" class="logo-img" alt="Logo Auxora">
            <?php else: ?>
                <div style="height:28pt;"></div>
            <?php endif; ?>
        </td>
        <td style="width: 88%; padding: 0; text-align: center; vertical-align: top;">
            <div style="padding: 51pt 4pt 0 4pt; text-align: center; font-size: 6.2pt;">
                <span class="brand brand-ricoh" style="margin-right: 6pt;">RICOH</span>
                <span class="brand brand-kyocera" style="margin-right: 6pt;">KYOCERA</span>
                <span class="brand brand-hp" style="margin-right: 6pt;">HP</span>
                <span class="brand brand-xerox" style="margin-right: 6pt;">XEROX</span>
                <span class="brand brand-brother">BROTHER</span>
            </div>
            <table style="width: 100%; border: 0; margin: 0; padding: 0; margin-top: 2pt;">
                <tr>
                    <td style="border: 0; padding: 3.5pt 4pt; text-align: center;">
                        <div class="title" style="letter-spacing: 0.9pt;">Certificación de Prestación de Servicio</div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>

<!-- CHECKBOXES DE TIPO - 2 FILAS DE 4 -->
<table class="sheet signatures-sheet">
    <tr>
        <td style="width: 25%;" class="checkbox-cell"><span class="checkbox-box"></span><span style="font-size: 7.2pt;">Acta de Instalación</span></td>
        <td style="width: 25%;" class="checkbox-cell"><span class="checkbox-box"></span><span style="font-size: 7.2pt;">Mantenimiento Preventivo</span></td>
        <td style="width: 25%;" class="checkbox-cell"><span class="checkbox-box"></span><span style="font-size: 7.2pt;">Mantenimiento Correctivo</span></td>
        <td style="width: 25%;" class="checkbox-cell"><span class="checkbox-box"></span><span style="font-size: 7.2pt;">Cambio de Repuesto</span></td>
    </tr>
</table>

<!-- DATOS DEL CLIENTE Y EQUIPO -->
<table class="sheet client-data-grid">
    <tr>
        <td colspan="3" class="section-label">DATOS DEL CLIENTE Y DEL EQUIPO</td>
        <td class="center section-label" style="width: 25%;">
            <div style="font-size: 9.5pt; font-weight: 700; white-space: nowrap;">TICKET: #<?php echo e($ticketNumber); ?></div>
        </td>
    </tr>
    <!-- Fila 1: Nombre, Dirección, Ciudad, Contacto -->
    <tr>
        <td style="width: 25%;">
            <div class="field-label">Nombre o Razón social</div>
            <div class="field-value"><?php echo e($formData['cliente_nombre'] ?? $clientName); ?></div>
        </td>
        <td style="width: 25%;">
            <div class="field-label">Dirección</div>
            <div class="field-value"><?php echo e($formData['cliente_direccion'] ?? $clientAddress); ?></div>
        </td>
        <td style="width: 25%;">
            <div class="field-label">Ciudad</div>
            <div class="field-value"><?php echo e($formData['cliente_ciudad'] ?? $clientCity); ?></div>
        </td>
        <td style="width: 25%;">
            <div class="field-label">Contacto</div>
            <div class="field-value"><?php echo e($formData['cliente_contacto'] ?? $clientContact); ?></div>
        </td>
    </tr>
    <!-- Fila 2: Teléfono, Marca, Modelo, N° Serie -->
    <tr>
        <td>
            <div class="field-label">Teléfono</div>
            <div class="field-value"><?php echo e($formData['cliente_telefono'] ?? $clientPhone); ?></div>
        </td>
        <td>
            <div class="field-label">MARCA</div>
            <div class="field-value"><?php echo e($formData['equipo_marca'] ?? ($ticket->brand ?? '')); ?></div>
        </td>
        <td>
            <div class="field-label">MODELO</div>
            <div class="field-value"><?php echo e($formData['equipo_modelo'] ?? ($ticket->model ?? '')); ?></div>
        </td>
        <td>
            <div class="field-label">N° de Serie</div>
            <div class="field-value"><?php echo e($formData['equipo_serial'] ?? ($ticket->serial ?? '')); ?></div>
        </td>
    </tr>
    <!-- Fila 3: Contador Inicial, Contador Final, Fechas -->
    <tr>
        <td>
            <div class="field-label">Contador Inicial</div>
            <div class="field-value"><?php echo e($formData['contador_inicial'] ?? ''); ?></div>
        </td>
        <td>
            <div class="field-label">Contador Final</div>
            <div class="field-value"><?php echo e($formData['contador_final'] ?? ''); ?></div>
        </td>
        <td>
            <div class="field-label">Fecha y hora de llegada</div>
            <div class="field-value"><?php echo e($formatDate($formData['arrival_at'] ?? $arrivalAtText)); ?></div>
        </td>
        <td>
            <div class="field-label">Fecha y hora de Salida</div>
            <div class="field-value"><?php echo e($formatDate($formData['departure_at'] ?? $departureAtText)); ?></div>
        </td>
    </tr>
</table>

<!-- PROBLEMA REPORTADO -->
<table class="sheet">
    <tr>
        <td class="section-label">PROBLEMA REPORTADO POR EL CLIENTE:</td>
    </tr>
    <tr>
        <td style="border: 0.9pt solid #000; padding: 4pt 4pt;">
            <div style="font-size: 7.8pt; line-height: 1.1;"><?php echo e($formData['problema_reportado'] ?? $subject); ?></div>
        </td>
    </tr>
</table>

<!-- OBSERVACIÓN O DIAGNÓSTICO -->
<table class="sheet">
    <tr>
        <td class="section-label">Observación o Diagnóstico</td>
    </tr>
    <tr>
        <td style="padding: 4pt 4pt; min-height: 500pt;">
            <div style="font-size: 7.8pt; line-height: 1.13; white-space: pre-wrap;"><?php echo e($formData['observacion_diagnostico'] ?? ''); ?></div>
        </td>
    </tr>
</table>

<!-- REPUESTOS -->
<table class="sheet">
    <tr>
        <td class="section-label" style="text-align: center;">REPUESTOS</td>
    </tr>
    <tr>
        <td style="padding: 0; vertical-align: top;">
            <!-- REPUESTOS TABLA ÚNICA -->
            <table class="parts-table" style="width: 100%; table-layout: fixed;">
                <tr>
                    <th style="width: 35%; border-right: 0.8pt solid #000;">Descripción</th>
                    <th style="width: 15%; border-right: 0.8pt solid #000;">Código</th>
                    <th style="width: 35%;">Descripción</th>
                    <th style="width: 15%;">Código</th>
                </tr>
                <?php
                    $pdfParts = $formData['parts'] ?? [];
                    $pdfParts = is_array($pdfParts) ? array_values(array_filter($pdfParts, fn ($part) => !empty(trim($part['descripcion'] ?? '')) || !empty(trim($part['codigo'] ?? '')))) : [];
                    $rowsToShow = 4;
                ?>
                <?php for($i = 0; $i < $rowsToShow; $i++): ?>
                    <?php 
                        $part1 = $pdfParts[$i] ?? ['descripcion' => '', 'codigo' => ''];
                        $part2 = $pdfParts[$rowsToShow + $i] ?? ['descripcion' => '', 'codigo' => ''];
                    ?>
                    <tr>
                        <td style="border-right: 0.8pt solid #000;"><?php echo e($part1['descripcion'] ?? ''); ?></td>
                        <td style="border-right: 0.8pt solid #000;"><?php echo e($part1['codigo'] ?? ''); ?></td>
                        <td><?php echo e($part2['descripcion'] ?? ''); ?></td>
                        <td><?php echo e($part2['codigo'] ?? ''); ?></td>
                    </tr>
                <?php endfor; ?>
            </table>
        </td>
    </tr>
</table>

<!-- TEXTO LEGAL -->
<table class="sheet">
    <tr>
        <td class="legal">
            Con la firma del presente documento se declara recibido el equipo funcionando correctamente y a entera satisfacción. En caso de instalación el cliente acepta a partir de la fecha la facturación y/o cobro que se genere por la entrega del equipo.<br><br>
            <span class="bold">GARANTIA DEL REPUESTO CAMBIADO: 30 DÍAS.</span><br>
            <span class="bold">GARANTIA DE MANO DE OBRA: 30 DÍAS DESPUÉS DEL REPORTE DEL PRODUCTO.</span><br><br>
            El propietario del equipo declara que autoriza a Auxora para que, en caso de no reclamo después de 60 días a partir de la fecha Auxora pueda vender dicho equipo, con el fin de pagarse con el producto de dicha venta, valores como reparación, bodegaje y los posibles daños y perjuicios que se hubiesen podido ocasionar.
        </td>
    </tr>
</table>

<!-- FIRMAS -->
<table class="sheet">
    <tr>
        <td class="section-label" colspan="2">FIRMAS</td>
    </tr>
    <tr>
        <td style="width: 50%; padding: 1.2pt 1.2pt;">
            <div class="center bold small" style="margin-bottom: 2.2pt; font-size: 9.2pt;">Firma y sello del cliente</div>
            <div class="sign-box">
                <div class="field-label">Firma</div>
                <?php if(!empty($formData['firma_cliente_base64'])): ?>
                    <div style="text-align: center; margin: 1pt 0; min-height: 48pt;">
                        <img src="<?php echo e($formData['firma_cliente_base64']); ?>" style="max-height: 84pt; max-width: 95%; object-fit: contain;" alt="Firma cliente">
                    </div>
                <?php else: ?>
                    <div style="height: 76pt; margin: 1pt 0;"></div>
                <?php endif; ?>
                <div style="padding-top: -2pt; margin-top: -2pt;">
                    <div class="field-label">Nombre</div>
                    <div class="field-value"><?php echo e($formData['nombre_cliente_firma'] ?? $clientName); ?></div>
                    <div class="field-label">Cargo</div>
                    <div class="field-value"><?php echo e($formData['cargo_cliente'] ?? ''); ?></div>
                </div>
            </div>
        </td>
        <td style="width: 50%; padding: 1.2pt 1.2pt;">
            <div class="center bold small" style="margin-bottom: 2.2pt; font-size: 9.2pt;">Firma del representante Técnico</div>
            <div class="sign-box">
                <div class="field-label">Firma</div>
                <?php if(!empty($formData['firma_tecnico_base64'])): ?>
                    <div style="text-align: center; margin: 1pt 0; min-height: 48pt;">
                        <img src="<?php echo e($formData['firma_tecnico_base64']); ?>" style="max-height: 84pt; max-width: 95%; object-fit: contain;" alt="Firma técnico">
                    </div>
                <?php else: ?>
                    <div style="height: 76pt; margin: 1pt 0;"></div>
                <?php endif; ?>
                <div style="padding-top: -2pt; margin-top: -2pt;">
                    <div class="field-label">Nombre</div>
                    <div class="field-value"><?php echo e($formData['nombre_tecnico_firma'] ?? $techName); ?></div>
                    <div class="field-label">Cargo</div>
                    <div class="field-value"><?php echo e($formData['cargo_tecnico'] ?? 'Técnico'); ?></div>
                </div>
            </div>
        </td>
    </tr>
</table>

        </td>
    </tr>
</table>
<!-- FIN CONTENEDOR PRINCIPAL -->

</body>
</html>
<?php endif; ?>
<?php /**PATH C:\laragon\www\auxora-main\resources\views\tickets\reporte_visita.blade.php ENDPATH**/ ?>