<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Certificaci&oacute;n de Prestaci&oacute;n de Servicio #{{ $ticket->id }}</title>
    <style>
        @page { margin: 10mm; size: A4 portrait; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 7px;
            color: #000;
        }
        .outer {
            border: 1.5px solid #000;
            width: 100%;
        }
        .section-table {
            width: 100%;
            border-collapse: collapse;
        }
        .cb-box {
            display: inline-block;
            border: 0.8px solid #000;
            width: 9px;
            height: 9px;
            font-size: 6px;
            text-align: center;
            vertical-align: middle;
            line-height: 9px;
        }
        .gray-header {
            background: #e0e0e0;
            font-size: 7px;
            font-weight: bold;
            text-align: center;
            border-bottom: 1px solid #000;
            padding: 2px 0;
        }
    </style>
</head>
<body>
@php
    use Carbon\Carbon;
    $tz = config('app.timezone', 'America/Bogota');
    $fmt = function($dt) use ($tz) {
        return $dt ? Carbon::parse($dt)->setTimezone($tz)->format('d/m/Y H:i') : '';
    };

    $clienteName = $ticket->cliente_externo ?? $ticket->customer?->name ?? '';
    $subject     = $ticket->subject ?? '';

    $checks = [
        'acta_instalacion' => $subject === 'Instalación',
        'correctivo'       => in_array($subject, ['Manchas', 'Atascos', 'Código de Error', 'Configuración ó Escaner', 'Otros']),
        'preventivo'       => $subject === 'Mantenimiento Preventivo',
        'reinstalacion'    => false,
        'acta_instruccion' => false,
        'traslado'         => false,
        'cotizacion_tm'    => in_array($subject, ['Solicitud de Toner', 'Contadores']),
        'reparacion_tm'    => in_array($subject, ['Remoto', 'Servicio de Ingeniería']),
    ];

    $cb = function(string $key) use ($checks): string {
        return $checks[$key] ? 'X' : '&nbsp;';
    };

    $parts    = $ticket->pendingParts ?? collect();
    $partsArr = $parts->values()->toArray();
@endphp

<div class="outer">

    {{-- ============= HEADER ============= --}}
    <table class="section-table">
        <tr>
            {{-- Logo TES --}}
            <td style="width:18%; border-right:1px solid #000; border-bottom:1px solid #000; padding:5px 4px; text-align:center; vertical-align:middle;">
                @if(!empty($logoSrc))
                    <img src="{{ $logoSrc }}" style="max-height:38px; max-width:100%;" />
                @else
                    <div style="font-size:16px; font-weight:bold; color:#b71c1c; line-height:1;">TES</div>
                    <div style="font-size:5.5px; color:#444; margin-top:2px;">TECNOLOGIA EQUIPOS<br>Y SUMINISTROS</div>
                @endif
            </td>
            {{-- Marcas + Título --}}
            <td style="border-bottom:1px solid #000; padding:0; vertical-align:bottom;">
                <div style="padding:5px 10px 4px 10px; text-align:center;">
                    <span style="font-size:9px; font-weight:bold; color:#b71c1c; letter-spacing:0.4px;">RICOH</span>
                    &nbsp;&nbsp;
                    <span style="font-size:9px; font-weight:bold; color:#b71c1c; letter-spacing:0.4px;">KYOCERA</span>
                    &nbsp;&nbsp;
                    <span style="font-size:10px; font-weight:bold; color:#1565c0; letter-spacing:0.4px;">hp</span>
                    &nbsp;&nbsp;
                    <span style="font-size:9px; font-weight:bold; color:#b71c1c; letter-spacing:0.4px;">xerox</span>
                    &nbsp;&nbsp;
                    <span style="font-size:9px; font-weight:bold; color:#1565c0; letter-spacing:0.4px;">brother</span>
                </div>
                <div style="background:#b71c1c; color:#fff; font-size:11px; font-weight:bold; text-align:center; padding:4px 6px; letter-spacing:1px; text-transform:uppercase;">
                    CERTIFICACI&Oacute;N DE PRESTACI&Oacute;N DE SERVICIO
                </div>
            </td>
        </tr>
    </table>

    {{-- ============= CHECKBOXES ============= --}}
    <table class="section-table">
        <tr style="height:15px;">
            <td style="width:25%; border-right:1px solid #ccc; border-bottom:0.5px solid #ccc; padding:2px 8px;">
                <span class="cb-box">{!! $cb('acta_instalacion') !!}</span>&nbsp; Acta de Instalaci&oacute;n
            </td>
            <td style="width:25%; border-right:1px solid #ccc; border-bottom:0.5px solid #ccc; padding:2px 8px;">
                <span class="cb-box">{!! $cb('correctivo') !!}</span>&nbsp; Correctivo
            </td>
            <td style="width:25%; border-right:1px solid #ccc; border-bottom:0.5px solid #ccc; padding:2px 8px;">
                <span class="cb-box">{!! $cb('preventivo') !!}</span>&nbsp; Preventivo
            </td>
            <td style="width:25%; border-bottom:0.5px solid #ccc; padding:2px 8px;">
                <span class="cb-box">{!! $cb('reinstalacion') !!}</span>&nbsp; Reinstalaci&oacute;n
            </td>
        </tr>
        <tr style="height:15px;">
            <td style="border-right:1px solid #ccc; border-bottom:1px solid #000; padding:2px 8px;">
                <span class="cb-box">{!! $cb('acta_instruccion') !!}</span>&nbsp; Acta Instrucci&oacute;n
            </td>
            <td style="border-right:1px solid #ccc; border-bottom:1px solid #000; padding:2px 8px;">
                <span class="cb-box">{!! $cb('traslado') !!}</span>&nbsp; Traslado
            </td>
            <td style="border-right:1px solid #ccc; border-bottom:1px solid #000; padding:2px 8px;">
                <span class="cb-box">{!! $cb('cotizacion_tm') !!}</span>&nbsp; Cotizaci&oacute;n T&amp;M
            </td>
            <td style="border-bottom:1px solid #000; padding:2px 8px;">
                <span class="cb-box">{!! $cb('reparacion_tm') !!}</span>&nbsp; Reparaci&oacute;n T&amp;M
            </td>
        </tr>
    </table>

    {{-- ============= CABECERA DATOS DEL CLIENTE ============= --}}
    <table class="section-table">
        <tr>
            <td style="width:70%; background:#e0e0e0; font-size:7.5px; font-weight:bold;
                       border-right:1px solid #000; border-bottom:1px solid #000; padding:3px 5px;">
                Datos del cliente y del equipo
            </td>
            <td style="border-bottom:1px solid #000; padding:2px 5px; vertical-align:top;">
                <div style="font-size:5.5px; font-weight:bold; color:#555;">N&deg; DE LLAMADA O TICK:</div>
                <div style="font-size:14px; font-weight:bold; line-height:1.15;">#{{ str_pad($ticket->id, 4, '0', STR_PAD_LEFT) }}</div>
            </td>
        </tr>
    </table>

    {{-- ============= FILA 1: Nombre, Dirección, Ciudad, Contacto ============= --}}
    <table class="section-table">
        <tr>
            <td style="width:30%; border-right:1px solid #000; border-bottom:1px solid #000; padding:1px 3px;">
                <div style="font-size:5.5px; color:#666;">Nombre o Raz&oacute;n social</div>
                <div style="font-size:8px; font-weight:bold; min-height:11px;">{{ $clienteName }}</div>
            </td>
            <td style="width:30%; border-right:1px solid #000; border-bottom:1px solid #000; padding:1px 3px;">
                <div style="font-size:5.5px; color:#666;">Direcci&oacute;n</div>
                <div style="font-size:8px; font-weight:bold; min-height:11px;">{{ $ticket->address ?? '' }}</div>
            </td>
            <td style="width:15%; border-right:1px solid #000; border-bottom:1px solid #000; padding:1px 3px;">
                <div style="font-size:5.5px; color:#666;">Ciudad</div>
                <div style="font-size:8px; font-weight:bold; min-height:11px;">{{ $ticket->ciudad ?? '' }}</div>
            </td>
            <td style="width:25%; border-bottom:1px solid #000; padding:1px 3px;">
                <div style="font-size:5.5px; color:#666;">Contacto</div>
                <div style="font-size:8px; font-weight:bold; min-height:11px;">{{ $ticket->nombre_contacto ?? '' }}</div>
            </td>
        </tr>
    </table>

    {{-- ============= FILA 2: Teléfono, Fechas, Marca, Modelo, Serial ============= --}}
    <table class="section-table">
        <tr>
            <td style="width:10%; border-right:1px solid #000; border-bottom:1px solid #000; padding:1px 3px;">
                <div style="font-size:5.5px; color:#666;">Tel&eacute;fono</div>
                <div style="font-size:7px; font-weight:bold; min-height:11px;">{{ $ticket->phone ?? '' }}</div>
            </td>
            <td style="width:15%; border-right:1px solid #000; border-bottom:1px solid #000; padding:1px 3px;">
                <div style="font-size:5.5px; color:#666;">Fecha y hora de Llamada</div>
                <div style="font-size:7px; font-weight:bold; min-height:11px;">{!! $fmt($ticket->created_at) !!}</div>
            </td>
            <td style="width:12%; border-right:1px solid #000; border-bottom:1px solid #000; padding:1px 3px;">
                <div style="font-size:5.5px; color:#666;">MARCA</div>
                <div style="font-size:7px; font-weight:bold; min-height:11px;">{{ $ticket->brand ?? '' }}</div>
            </td>
            <td style="width:13%; border-right:1px solid #000; border-bottom:1px solid #000; padding:1px 3px;">
                <div style="font-size:5.5px; color:#666;">MODELO</div>
                <div style="font-size:7px; font-weight:bold; min-height:11px;">{{ $ticket->model ?? '' }}</div>
            </td>
            <td style="width:17%; border-right:1px solid #000; border-bottom:1px solid #000; padding:1px 3px;">
                <div style="font-size:5.5px; color:#666;">N&deg; de Serie</div>
                <div style="font-size:7px; font-weight:bold; min-height:11px;">{{ $ticket->serial ?? '' }}</div>
            </td>
            <td style="width:16%; border-right:1px solid #000; border-bottom:1px solid #000; padding:1px 3px;">
                <div style="font-size:5.5px; color:#666;">Fecha y hora de Llegada</div>
                <div style="font-size:7px; font-weight:bold; min-height:11px;">{!! $fmt($ticket->assigned_at) !!}</div>
            </td>
            <td style="width:17%; border-bottom:1px solid #000; padding:1px 3px;">
                <div style="font-size:5.5px; color:#666;">Fecha y hora de Salida</div>
                <div style="font-size:7px; font-weight:bold; min-height:11px;">{!! $fmt($ticket->closed_at) !!}</div>
            </td>
        </tr>
    </table>

    {{-- ============= FILA 3: Contadores + Problema ============= --}}
    <table class="section-table">
        <tr>
            <td style="width:13%; border-right:1px solid #000; border-bottom:1px solid #000; padding:1px 3px;">
                <div style="font-size:5.5px; color:#666;">Contador Inicial</div>
                <div style="font-size:7px; min-height:12px;">&nbsp;</div>
            </td>
            <td style="width:13%; border-right:1px solid #000; border-bottom:1px solid #000; padding:1px 3px;">
                <div style="font-size:5.5px; color:#666;">Contador Final</div>
                <div style="font-size:7px; min-height:12px;">&nbsp;</div>
            </td>
            <td style="border-bottom:1px solid #000; padding:1px 4px; vertical-align:top;">
                <span style="font-size:6.5px; font-weight:bold;">PROBLEMA REPORTADO POR EL CLIENTE:</span>
                <span style="font-size:8px; margin-left:4px;">{{ $subject }}</span>
            </td>
        </tr>
    </table>

    {{-- ============= OBSERVACIÓN O DIAGNÓSTICO ============= --}}
    <table class="section-table">
        <tr>
            <td style="border-bottom:1px solid #000; padding:3px 4px; vertical-align:top;">
                <div style="font-size:7.5px; font-weight:bold; margin-bottom:2px;">Observaci&oacute;n o Diagn&oacute;stico</div>
                <div style="font-size:8px; min-height:60px; white-space:pre-wrap; word-wrap:break-word; line-height:1.5;">{{ $ticket->description ?? '' }}</div>
            </td>
        </tr>
    </table>

    {{-- ============= OBSERVACIONES (espacio en blanco) ============= --}}
    <table class="section-table">
        <tr>
            <td style="border-bottom:1px solid #000; padding:3px 4px; vertical-align:top;">
                <div style="font-size:7.5px; font-weight:bold; margin-bottom:5px;">Observaciones :</div>
                <div style="border-bottom:0.5px solid #bbb; margin-bottom:9px; height:1px;"></div>
                <div style="border-bottom:0.5px solid #bbb; margin-bottom:9px; height:1px;"></div>
                <div style="height:1px;"></div>
            </td>
        </tr>
    </table>

    {{-- ============= SECCIÓN INFERIOR 3 COLUMNAS ============= --}}
    <table class="section-table">
        <tr style="vertical-align:top;">

            {{-- Instalaciones Eléctricas --}}
            <td style="width:17%; border-right:1px solid #000; border-bottom:1px solid #000; padding:0;">
                <div class="gray-header">Inst. El&eacute;ctricas</div>
                <table style="width:100%; border-collapse:collapse;">
                    <tr>
                        <td style="width:55%; border-right:1px solid #000; border-bottom:0.5px solid #ccc; padding:2px 3px; font-size:6px; text-align:center;">Voltaje</td>
                        <td style="border-bottom:0.5px solid #ccc; padding:2px 3px;">&nbsp;</td>
                    </tr>
                    <tr>
                        <td style="border-right:1px solid #000; border-bottom:0.5px solid #ccc; padding:3px 3px; font-size:6px;">Fase / Neutro</td>
                        <td style="border-bottom:0.5px solid #ccc; padding:3px 3px; height:13px;">&nbsp;</td>
                    </tr>
                    <tr>
                        <td style="border-right:1px solid #000; border-bottom:0.5px solid #ccc; padding:3px 3px; font-size:6px;">Fase / Tierra</td>
                        <td style="border-bottom:0.5px solid #ccc; padding:3px 3px; height:13px;">&nbsp;</td>
                    </tr>
                    <tr>
                        <td style="border-right:1px solid #000; padding:3px 3px; font-size:6px;">Neutro / Tierra</td>
                        <td style="padding:3px 3px; height:13px;">&nbsp;</td>
                    </tr>
                </table>
            </td>

            {{-- Repuestos --}}
            <td style="width:56%; border-right:1px solid #000; border-bottom:1px solid #000; padding:0;">
                <div class="gray-header">Repuestos</div>
                <table style="width:100%; border-collapse:collapse;">
                    <tr>
                        <td style="width:65%; border-right:1px solid #000; border-bottom:1px solid #000; padding:2px 3px; font-size:6.5px; font-weight:bold;">Descripci&oacute;n</td>
                        <td style="border-bottom:1px solid #000; padding:2px 3px; font-size:6.5px; font-weight:bold;">C&oacute;digo</td>
                    </tr>
                    @for ($i = 0; $i < 5; $i++)
                    <tr>
                        <td style="border-right:1px solid #000; border-bottom:{{ $i < 4 ? '0.5px solid #ccc' : 'none' }}; padding:2.5px 3px; font-size:7.5px; height:13px;">{{ isset($partsArr[$i]) ? ($partsArr[$i]['part_name'] ?? '') : '' }}</td>
                        <td style="border-bottom:{{ $i < 4 ? '0.5px solid #ccc' : 'none' }}; padding:2.5px 3px; font-size:7.5px;">{{ isset($partsArr[$i]) ? ($partsArr[$i]['part_code'] ?? '') : '' }}</td>
                    </tr>
                    @endfor
                </table>
            </td>

            {{-- Evaluación del servicio --}}
            <td style="width:27%; border-bottom:1px solid #000; padding:0;">
                <div class="gray-header">Evaluaci&oacute;n del servicio</div>
                <div style="font-size:6.5px; font-weight:bold; text-align:center; border-bottom:0.8px solid #ccc; padding:2px 3px;">Calificaci&oacute;n</div>
                <table style="width:100%; border-collapse:collapse;">
                    <tr>
                        <td style="padding:3px 8px; font-size:7px; border-bottom:0.5px solid #ccc; border-right:1px solid #000; width:72%;">1. Excelente</td>
                        <td style="padding:3px 3px; border-bottom:0.5px solid #ccc; width:28%;"></td>
                    </tr>
                    <tr>
                        <td style="padding:3px 8px; font-size:7px; border-bottom:0.5px solid #ccc; border-right:1px solid #000;">2. Bueno</td>
                        <td style="padding:3px 3px; border-bottom:0.5px solid #ccc;"></td>
                    </tr>
                    <tr>
                        <td style="padding:3px 8px; font-size:7px; border-bottom:0.5px solid #ccc; border-right:1px solid #000;">3. Regular</td>
                        <td style="padding:3px 3px; border-bottom:0.5px solid #ccc;"></td>
                    </tr>
                    <tr>
                        <td style="padding:3px 8px; font-size:7px; border-right:1px solid #000;">4. Malo</td>
                        <td style="padding:3px 3px;"></td>
                    </tr>
                </table>
            </td>

        </tr>
    </table>

    {{-- ============= TEXTO LEGAL ============= --}}
    <div style="font-size:5.5px; font-style:italic; padding:3px 5px; border-bottom:1px solid #000; line-height:1.5; color:#111;">
        Con la firma del presente documento se declara recibido el equipo funcionando correctamente y a entera satisfacci&oacute;n.
        En caso de instalaci&oacute;n el cliente acepta a partir de la fecha la facturaci&oacute;n y/o cobro que se genere por la entrega del equipo.
        GARANT&Iacute;A DEL REPUESTO CAMBIADO: 30 D&Iacute;AS. GARANT&Iacute;A DE MANO DE OBRA: 30 D&Iacute;AS PROBLEMA REPORTADO.
        El propietario del equipo de arriba descrito autoriza a Auxora para que en caso de no reclamo despu&eacute;s de 60 d&iacute;as
        a partir de la fecha Auxora pueda disponer del equipo para pagarse valores como reparaci&oacute;n, bodegaje y los posibles
        da&ntilde;os y perjuicios ocasionados.
    </div>

    {{-- ============= FIRMAS ============= --}}
    <table class="section-table">
        <tr style="vertical-align:top;">

            {{-- Firma cliente --}}
            <td style="width:50%; border-right:1px solid #000; padding:6px 12px;">
                <div style="font-size:8px; font-weight:bold; text-decoration:underline; text-align:center; margin-bottom:6px;">Firma y sello del Cliente</div>
                <div style="border-bottom:0.5px solid #000; margin:20px 0 3px 0; height:1px;"></div>
                <div style="font-size:7px; margin-bottom:10px;">Firma</div>
                <div style="font-size:7px; margin-bottom:9px;">Nombre _________________________________</div>
                <div style="font-size:7px; margin-bottom:8px;">Cargo &nbsp;&nbsp;&nbsp; _________________________________</div>
                <table style="border-collapse:collapse; width:75%; margin-top:6px;">
                    <tr>
                        <td style="border:0.8px solid #000; width:33%; text-align:center; padding:3px; font-size:6px;">D&Iacute;A</td>
                        <td style="border:0.8px solid #000; width:33%; text-align:center; padding:3px; font-size:6px;">MES</td>
                        <td style="border:0.8px solid #000; width:34%; text-align:center; padding:3px; font-size:6px;">A&Ntilde;O</td>
                    </tr>
                    <tr>
                        <td style="border:0.8px solid #000; text-align:center; padding:5px; font-size:7px;">&nbsp;</td>
                        <td style="border:0.8px solid #000; text-align:center; padding:5px; font-size:7px;">&nbsp;</td>
                        <td style="border:0.8px solid #000; text-align:center; padding:5px; font-size:7px;">&nbsp;</td>
                    </tr>
                </table>
            </td>

            {{-- Firma técnico --}}
            <td style="width:50%; padding:6px 12px;">
                <div style="font-size:8px; font-weight:bold; text-decoration:underline; text-align:center; margin-bottom:6px;">Firma del representante T&eacute;cnico</div>
                <div style="border-bottom:0.5px solid #000; margin:20px 0 3px 0; height:1px;"></div>
                <div style="font-size:7px; margin-bottom:10px;">Firma</div>
                <div style="font-size:7px; margin-bottom:9px;">Nombre <strong>{{ $ticket->support?->name ?? '' }}</strong></div>
                <div style="font-size:7px; margin-bottom:8px;">Cargo &nbsp;&nbsp;&nbsp; _________________________________</div>
                <table style="border-collapse:collapse; width:75%; margin-top:6px;">
                    <tr>
                        <td style="border:0.8px solid #000; width:33%; text-align:center; padding:3px; font-size:6px;">D&Iacute;A</td>
                        <td style="border:0.8px solid #000; width:33%; text-align:center; padding:3px; font-size:6px;">MES</td>
                        <td style="border:0.8px solid #000; width:34%; text-align:center; padding:3px; font-size:6px;">A&Ntilde;O</td>
                    </tr>
                    <tr>
                        <td style="border:0.8px solid #000; text-align:center; padding:5px; font-size:7px;">&nbsp;</td>
                        <td style="border:0.8px solid #000; text-align:center; padding:5px; font-size:7px;">&nbsp;</td>
                        <td style="border:0.8px solid #000; text-align:center; padding:5px; font-size:7px;">&nbsp;</td>
                    </tr>
                </table>
            </td>

        </tr>
    </table>

</div>{{-- end .outer --}}
</body>
</html>
