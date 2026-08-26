<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Ranking de Rendimiento</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

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
            background-color: #1e40af;
            color: white;
            text-align: center;
            padding: 18px 15px;
            border-bottom: 4px solid #fbbf24;
        }

        .header h1 {
            font-size: 20px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 6px;
        }

        .header p { font-size: 9px; margin: 3px 0; }

        .header .badge {
            display: inline-block;
            background-color: rgba(255,255,255,0.2);
            padding: 5px 14px;
            border-radius: 12px;
            margin-top: 6px;
            font-weight: bold;
            font-size: 10px;
        }

        .content { padding: 12px; }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            border: 1px solid #d1d5db;
        }

        thead { background-color: #1e40af; color: white; }
        thead tr { border-bottom: 3px solid #fbbf24; }

        th {
            padding: 9px 4px;
            text-align: center;
            font-size: 7.5px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-right: 1px solid rgba(255,255,255,0.3);
        }
        th:last-child { border-right: none; }

        td {
            padding: 7px 4px;
            border-bottom: 1px solid #e5e7eb;
            border-right: 1px solid #f3f4f6;
            font-size: 8px;
            vertical-align: middle;
            text-align: center;
        }
        td.left  { text-align: left; }
        td:last-child { border-right: none; }

        tbody tr:nth-child(odd)  { background-color: #ffffff; }
        tbody tr:nth-child(even) { background-color: #f9fafb; }
        tbody tr:last-child td   { border-bottom: 2px solid #3b82f6; }

        .rank-1 { font-weight: bold; color: #d97706; font-size: 10px; }
        .rank   { font-weight: bold; color: #374151; }

        .score       { font-weight: bold; font-size: 10px; }
        .score-exc   { color: #16a34a; }
        .score-good  { color: #2563eb; }
        .score-med   { color: #ca8a04; }
        .score-low   { color: #dc2626; }

        .trend-up    { color: #16a34a; font-weight: bold; }
        .trend-down  { color: #dc2626; font-weight: bold; }
        .trend-flat  { color: #6b7280; }

        .badge-closed   { background: #16a34a; color: white; border-radius: 8px; padding: 2px 6px; font-size: 7.5px; }
        .badge-progress { background: #ea580c; color: white; border-radius: 8px; padding: 2px 6px; font-size: 7.5px; }
        .badge-open     { background: #dc2626; color: white; border-radius: 8px; padding: 2px 6px; font-size: 7.5px; }

        .footer {
            background-color: #f9fafb;
            text-align: center;
            font-size: 8px;
            color: #6b7280;
            padding: 10px;
            border-top: 1px solid #e5e7eb;
        }

        .formula-note {
            font-size: 7.5px;
            color: #6b7280;
            padding: 6px 12px 0;
            font-style: italic;
        }
    </style>
</head>
<body>
<div class="container">

    <div class="header">
        <h1>Ranking de Rendimiento de Tecnicos</h1>
        @if($date_from || $date_to)
            <p>
                Periodo:
                @if($date_from && $date_to)
                    {{ \Carbon\Carbon::parse($date_from)->format('d/m/Y') }} — {{ \Carbon\Carbon::parse($date_to)->format('d/m/Y') }}
                @elseif($date_from)
                    Desde {{ \Carbon\Carbon::parse($date_from)->format('d/m/Y') }}
                @else
                    Hasta {{ \Carbon\Carbon::parse($date_to)->format('d/m/Y') }}
                @endif
            </p>
        @else
            <p>Todos los registros</p>
        @endif
        <p>Generado el {{ now()->setTimezone(config('app.timezone'))->format('d/m/Y H:i') }}</p>
        <div class="badge">{{ count($technicians) }} tecnicos</div>
    </div>

    <div class="content">
        <p class="formula-note">Puntuacion: 33% tasa de resolucion | 34% rapidez (max. 72h) | 33% volumen (max. 100 tickets) | Horario: L-V 08:00-18:00, Sab 08:00-10:00{{ $has_trend ? '  |  Variacion vs periodo equivalente anterior' : '' }}</p>

        <table>
            <thead>
                <tr>
                    <th style="width:25px">#</th>
                    <th style="text-align:left; width:130px">Tecnico</th>
                    <th style="width:55px">Puntuacion</th>
                    @if($has_trend)
                    <th style="width:45px">Variacion</th>
                    @endif
                    <th style="width:40px">Tickets</th>
                    <th style="width:40px">Cerrados</th>
                    <th style="width:45px">En Progreso</th>
                    <th style="width:35px">Abiertos</th>
                    <th style="width:50px">Tasa Res.</th>
                    <th style="width:60px">T. Resolucion</th>
                </tr>
            </thead>
            <tbody>
                @foreach($technicians as $i => $tech)
                    @php
                        $scoreClass = $tech['efficiency_score'] >= 70 ? 'score-exc'
                            : ($tech['efficiency_score'] >= 50 ? 'score-good'
                            : ($tech['efficiency_score'] >= 30 ? 'score-med' : 'score-low'));

                        $label = $tech['efficiency_score'] >= 70 ? 'Excelente'
                            : ($tech['efficiency_score'] >= 50 ? 'Bueno'
                            : ($tech['efficiency_score'] >= 30 ? 'Regular' : 'Por mejorar'));

                        $h = $tech['avg_resolution_hours'];
                        if ($h == 0) {
                            $resTime = 'N/A';
                        } elseif ($h < 1) {
                            $resTime = round($h * 60) . ' min';
                        } elseif ($h < 24) {
                            $resTime = number_format($h, 1) . 'h';
                        } else {
                            $days = floor($h / 24);
                            $rem  = round(fmod($h, 24));
                            $resTime = $rem > 0 ? "{$days}d {$rem}h" : "{$days}d";
                        }

                        $trend = $has_trend ? ($tech['score_trend'] ?? null) : null;
                        $prevScore = $has_trend ? ($tech['prev_score'] ?? null) : null;
                    @endphp
                    <tr>
                        <td class="{{ $i === 0 ? 'rank-1' : 'rank' }}">{{ $i === 0 ? '★ 1' : $i + 1 }}</td>
                        <td class="left">
                            <strong>{{ $tech['name'] }}</strong><br>
                            <span style="color:#6b7280; font-size:7px">{{ $tech['email'] }}</span>
                        </td>
                        <td>
                            <span class="score {{ $scoreClass }}">{{ $tech['efficiency_score'] }}</span><br>
                            <span style="font-size:7px; color:#6b7280">{{ $label }}</span>
                        </td>
                        @if($has_trend)
                        <td>
                            @if($trend !== null && $prevScore !== null)
                                @if($trend > 0.5)
                                    <span class="trend-up">▲ +{{ $trend }}</span>
                                @elseif($trend < -0.5)
                                    <span class="trend-down">▼ {{ $trend }}</span>
                                @else
                                    <span class="trend-flat">— {{ $trend == 0 ? '=' : $trend }}</span>
                                @endif
                                <br><span style="color:#9ca3af; font-size:7px">antes: {{ $prevScore }}</span>
                            @else
                                <span style="color:#9ca3af">-</span>
                            @endif
                        </td>
                        @endif
                        <td>{{ $tech['total_tickets'] }}</td>
                        <td><span class="badge-closed">{{ $tech['closed_tickets'] }}</span></td>
                        <td><span class="badge-progress">{{ $tech['in_progress_tickets'] }}</span></td>
                        <td><span class="badge-open">{{ $tech['open_tickets'] }}</span></td>
                        <td>{{ $tech['resolution_rate'] }}%</td>
                        <td>{{ $resTime }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="footer">
        Sistema de Tickets &mdash; Ranking generado automaticamente &mdash; {{ now()->setTimezone(config('app.timezone'))->format('d/m/Y H:i:s') }}
    </div>

</div>
</body>
</html>
