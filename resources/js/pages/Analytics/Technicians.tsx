import AppLayout from "@/layouts/app-layout";
import { Head, Link, router } from "@inertiajs/react";
import { PageProps } from "@/types";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Trophy, TrendingUp, TrendingDown, Minus, Clock, Target,
    Users2, X, Download, FileText, Filter, Calendar,
    ChevronDown, ChevronUp, Mail,
} from "lucide-react";
import { Fragment, useState } from "react";
import { cn } from "@/lib/utils";

interface TechnicianAnalytics {
    id: number;
    name: string;
    email: string;
    total_tickets: number;
    closed_tickets: number;
    in_progress_tickets: number;
    open_tickets: number;
    resolution_rate: number;
    avg_resolution_hours: number;
    avg_comments: number;
    efficiency_score: number;
    score_breakdown: {
        summary: string;
        items: string[];
    };
    slowest_tickets: {
        id: number;
        subject: string | null;
        customer_name: string | null;
        working_hours: number;
        closed_at: string | null;
    }[];
    prev_score: number | null;
    score_trend: number | null;
}

interface AnalyticsSummary {
    total_technicians: number;
    total_tickets_handled: number;
    avg_resolution_rate: number;
    avg_resolution_hours: number;
}

interface Props extends PageProps {
    technicians: TechnicianAnalytics[];
    summary: AnalyticsSummary;
    date_from: string;
    date_to: string;
}

function formatHours(hours: number): string {
    if (hours === 0) return "N/A";
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    const days = Math.floor(hours / 24);
    const rem = Math.round(hours % 24);
    return rem > 0 ? `${days}d ${rem}h` : `${days}d`;
}

function getEfficiencyBadge(score: number) {
    if (score >= 70) return <Badge className="bg-green-500 hover:bg-green-600 text-white text-[10px] sm:text-xs">Excelente</Badge>;
    if (score >= 50) return <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-[10px] sm:text-xs">Bueno</Badge>;
    if (score >= 30) return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white text-[10px] sm:text-xs">Regular</Badge>;
    return <Badge className="bg-red-500 hover:bg-red-600 text-white text-[10px] sm:text-xs">Por mejorar</Badge>;
}

function TrendIndicator({ trend, prevScore }: { trend: number | null; prevScore: number | null }) {
    if (trend === null || prevScore === null) return null;

    if (trend > 0.5) {
        return (
            <span className="flex items-center gap-0.5 text-green-600 dark:text-green-400 text-xs font-semibold">
                <TrendingUp className="h-3 w-3" />
                +{trend}
            </span>
        );
    }
    if (trend < -0.5) {
        return (
            <span className="flex items-center gap-0.5 text-red-500 dark:text-red-400 text-xs font-semibold">
                <TrendingDown className="h-3 w-3" />
                {trend}
            </span>
        );
    }
    return (
        <span className="flex items-center gap-0.5 text-muted-foreground text-xs">
            <Minus className="h-3 w-3" />
            {trend === 0 ? "=" : trend}
        </span>
    );
}

export default function Technicians({ technicians, summary, date_from, date_to }: Props) {
    const [from, setFrom] = useState(date_from ?? "");
    const [to, setTo] = useState(date_to ?? "");
    const [expandedTechnicianId, setExpandedTechnicianId] = useState<number | null>(null);

    const applyFilter = () => {
        const params: Record<string, string> = {};
        if (from) params.date_from = from;
        if (to)   params.date_to   = to;
        router.get("/analytics/technicians", params, { preserveState: false });
    };

    const clearFilter = () => {
        setFrom("");
        setTo("");
        router.get("/analytics/technicians", {}, { preserveState: false });
    };

    const hasFilter = !!(date_from || date_to);
    const hasTrend  = !!(date_from && date_to);

    const exportToCSV = () => {
        const periodLabel = date_from && date_to
            ? `${date_from}_${date_to}`
            : date_from ? `desde_${date_from}`
            : date_to   ? `hasta_${date_to}`
            : "todos";

        const headers = [
            "Posicion", "Tecnico", "Email",
            "Puntuacion", ...(hasTrend ? ["Puntuacion Anterior", "Variacion"] : []),
            "Tickets Totales", "Cerrados", "En Progreso", "Abiertos",
            "Tasa Resolucion (%)", "T. Resolucion Prom. (h)",
        ];

        const rows = technicians.map((tech, i) => [
            i + 1,
            tech.name,
            tech.email,
            tech.efficiency_score,
            ...(hasTrend ? [
                tech.prev_score ?? "",
                tech.score_trend !== null ? (tech.score_trend > 0 ? `+${tech.score_trend}` : tech.score_trend) : "",
            ] : []),
            tech.total_tickets,
            tech.closed_tickets,
            tech.in_progress_tickets,
            tech.open_tickets,
            tech.resolution_rate,
            tech.avg_resolution_hours,
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
            .join("\n");

        const bom = "\uFEFF";
        const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href     = url;
        a.download = `ranking_tecnicos_${periodLabel}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportToPdf = () => {
        const params = new URLSearchParams();
        if (date_from) params.set("date_from", date_from);
        if (date_to)   params.set("date_to",   date_to);
        const qs = params.toString();
        window.location.href = `/analytics/technicians/export-pdf${qs ? `?${qs}` : ""}`;
    };

    const detailColSpan = hasTrend ? 9 : 8;

    const toggleTechnician = (technicianId: number) => {
        setExpandedTechnicianId((current) => current === technicianId ? null : technicianId);
    };

    // Componente del bloque de detalle expandido (reutilizado en mobile y desktop)
    const renderExpandedDetail = (tech: TechnicianAnalytics) => (
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-lg border bg-background/60 p-3 sm:p-4 min-w-0">
                <h3 className="text-sm font-semibold">3 tickets con mayor tiempo de cierre</h3>
                <div className="mt-3 space-y-3">
                    {tech.slowest_tickets.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay tickets cerrados para mostrar en este periodo.</p>
                    ) : (
                        tech.slowest_tickets.map((ticket, ticketIndex) => (
                            <Link
                                key={ticket.id}
                                href={route('tickets.index', { ticket_id: ticket.id })}
                                className="block rounded-md border border-border/70 bg-muted/30 p-3 min-w-0 transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                title={`Ver ticket #${ticket.id}`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 min-w-0">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium break-words">#{ticket.id} {ticket.subject ?? "Sin asunto"}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {ticket.customer_name ? `Cliente: ${ticket.customer_name}` : "Cliente no disponible"}
                                        </p>
                                        {ticket.closed_at && (
                                            <p className="text-xs text-muted-foreground">Cerrado: {ticket.closed_at}</p>
                                        )}
                                        <p className="text-[11px] text-primary/90 mt-1">Toca para ver en Tickets</p>
                                    </div>
                                    <Badge variant="outline" className="text-xs shrink-0 self-start">
                                        Top {ticketIndex + 1}: {formatHours(ticket.working_hours)}
                                    </Badge>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
            <div className="rounded-lg border bg-background/60 p-3 sm:p-4 min-w-0">
                <h3 className="text-sm font-semibold">Motivo de la calificacion</h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground whitespace-normal break-words [overflow-wrap:anywhere]">
                    {tech.score_breakdown.summary}
                </p>
                <div className="mt-3 space-y-2">
                    {tech.score_breakdown.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="rounded-md border border-border/70 bg-muted/30 px-2.5 py-2 sm:px-3 sm:py-2.5 min-w-0">
                            <div className="flex items-start gap-2 min-w-0">
                                <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                                    {itemIndex + 1}
                                </span>
                                <p className="text-xs sm:text-sm leading-relaxed whitespace-normal break-words [overflow-wrap:anywhere] min-w-0">
                                    {item}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <AppLayout breadcrumbs={[
            { title: "Inicio", href: "/dashboard" },
            { title: "Rendimiento de Tecnicos", href: "/analytics/technicians" },
        ]}>
            <Head title="Rendimiento de Tecnicos" />

            <div className="mx-auto flex h-full w-full max-w-full flex-1 flex-col gap-3 sm:gap-4 rounded-xl p-3 sm:p-4 overflow-x-hidden">

                {/* Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold">Rendimiento de Tecnicos</h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                            Tiempo laborable desde asignacion hasta cierre (L-V 08:00-18:00, Sab 08:00-10:00)
                        </p>
                    </div>
                    {technicians.length > 0 && (
                        <div className="flex w-full sm:w-auto flex-wrap gap-2 sm:shrink-0">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={exportToCSV}
                                className="gap-1.5 text-xs flex-1 sm:flex-initial"
                            >
                                <Download className="h-3.5 w-3.5" />
                                CSV
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={exportToPdf}
                                className="gap-1.5 text-xs flex-1 sm:flex-initial"
                            >
                                <FileText className="h-3.5 w-3.5" />
                                PDF
                            </Button>
                        </div>
                    )}
                </div>

                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 sm:p-4 rounded-xl border border-border bg-muted/40">
                    <div className="col-span-full flex flex-wrap items-center gap-2 pb-2 border-b border-border/60">
                        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filtros</span>
                        <div className="ml-auto flex w-full sm:w-auto items-center justify-end gap-2">
                            <Button size="sm" onClick={applyFilter} className="h-7 text-xs flex-1 sm:flex-initial">Aplicar</Button>
                            {hasFilter && (
                                <Button size="sm" variant="outline" onClick={clearFilter} className="h-7 text-xs gap-1 flex-1 sm:flex-initial">
                                    <X className="h-3 w-3" /> Limpiar
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="date_from" className="text-xs font-semibold text-gray-700 dark:text-gray-300">Desde</label>
                        <div className="relative">
                            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            <Input
                                id="date_from"
                                type="date"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                className="h-9 pl-8"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="date_to" className="text-xs font-semibold text-gray-700 dark:text-gray-300">Hasta</label>
                        <div className="relative">
                            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            <Input
                                id="date_to"
                                type="date"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="h-9 pl-8"
                            />
                        </div>
                    </div>
                    {hasFilter && (
                        <p className="col-span-full text-xs text-muted-foreground">
                            Mostrando tickets creados
                            {date_from ? ` desde ${date_from}` : ""}
                            {date_to   ? ` hasta ${date_to}`   : ""}
                            {hasTrend  ? "  se muestra variacion vs el periodo equivalente anterior" : ""}
                        </p>
                    )}
                </div>

                {/* Tarjetas resumen */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    <Card className="group hover:shadow-md transition-all min-w-0">
                        <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground">Tecnicos</CardTitle>
                            <Users2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        </CardHeader>
                        <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
                            <p className="text-xl sm:text-2xl font-bold">{summary.total_technicians}</p>
                        </CardContent>
                    </Card>

                    <Card className="group hover:shadow-md transition-all min-w-0">
                        <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground">Tickets atendidos</CardTitle>
                            <Trophy className="h-4 w-4 text-muted-foreground group-hover:text-yellow-500 transition-colors shrink-0" />
                        </CardHeader>
                        <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
                            <p className="text-xl sm:text-2xl font-bold">{summary.total_tickets_handled}</p>
                        </CardContent>
                    </Card>

                    <Card className="group hover:shadow-md transition-all min-w-0">
                        <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground">Tasa resolucion prom.</CardTitle>
                            <Target className="h-4 w-4 text-muted-foreground group-hover:text-green-500 transition-colors shrink-0" />
                        </CardHeader>
                        <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
                            <p className="text-xl sm:text-2xl font-bold">{summary.avg_resolution_rate}%</p>
                        </CardContent>
                    </Card>

                    <Card className="group hover:shadow-md transition-all min-w-0">
                        <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground">T. resolucion prom.</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground group-hover:text-purple-500 transition-colors shrink-0" />
                        </CardHeader>
                        <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
                            <p className="text-xl sm:text-2xl font-bold break-words">{formatHours(summary.avg_resolution_hours)}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* VISTA MOVIL: Cards (oculta en tablet+) */}
                <div className="md:hidden space-y-3">
                    {technicians.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center text-sm text-muted-foreground">
                                No hay tecnicos con tickets en este rango de fechas
                            </CardContent>
                        </Card>
                    ) : (
                        technicians.map((tech, index) => {
                            const isExpanded = expandedTechnicianId === tech.id;
                            return (
                                <Card
                                    key={tech.id}
                                    className={cn(
                                        "min-w-0 cursor-pointer transition-colors hover:bg-muted/30",
                                        isExpanded && "ring-2 ring-primary/30"
                                    )}
                                    onClick={() => toggleTechnician(tech.id)}
                                >
                                    <CardHeader className="p-3 pb-2">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className="flex items-center justify-center h-9 w-9 shrink-0 rounded-full bg-muted text-sm font-bold">
                                                {index === 0 ? (
                                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                                ) : (
                                                    index + 1
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="font-semibold text-sm truncate">{tech.name}</p>
                                                    <span className="text-xl sm:text-2xl font-bold shrink-0">{tech.efficiency_score}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 min-w-0">
                                                    <Mail className="h-3 w-3 shrink-0" />
                                                    <span className="truncate">{tech.email}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                            {getEfficiencyBadge(tech.efficiency_score)}
                                            {hasTrend && (
                                                <TrendIndicator trend={tech.score_trend} prevScore={tech.prev_score} />
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-3 pt-0">
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="rounded-md bg-muted/40 p-2">
                                                <p className="text-muted-foreground">Tickets</p>
                                                <p className="font-bold text-sm mt-0.5">{tech.total_tickets}</p>
                                            </div>
                                            <div className="rounded-md bg-muted/40 p-2">
                                                <p className="text-muted-foreground">Cerrados</p>
                                                <p className="font-bold text-sm mt-0.5 text-green-600">{tech.closed_tickets}</p>
                                            </div>
                                            <div className="rounded-md bg-muted/40 p-2">
                                                <p className="text-muted-foreground">En progreso</p>
                                                <p className="font-bold text-sm mt-0.5 text-orange-500">{tech.in_progress_tickets}</p>
                                            </div>
                                            <div className="rounded-md bg-muted/40 p-2">
                                                <p className="text-muted-foreground">Abiertos</p>
                                                <p className="font-bold text-sm mt-0.5 text-red-600">{tech.open_tickets}</p>
                                            </div>
                                            <div className="rounded-md bg-muted/40 p-2">
                                                <p className="text-muted-foreground">Tasa resol.</p>
                                                <p className="font-bold text-sm mt-0.5">{tech.resolution_rate}%</p>
                                            </div>
                                            <div className="rounded-md bg-muted/40 p-2">
                                                <p className="text-muted-foreground">T. resol.</p>
                                                <p className="font-bold text-sm mt-0.5">{formatHours(tech.avg_resolution_hours)}</p>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between text-xs text-primary font-medium">
                                            <span>{isExpanded ? "Ocultar detalle" : "Ver detalle"}</span>
                                            {isExpanded
                                                ? <ChevronUp className="h-4 w-4" />
                                                : <ChevronDown className="h-4 w-4" />
                                            }
                                        </div>

                                        {isExpanded && (
                                            <div className="mt-3 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
                                                {renderExpandedDetail(tech)}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>

                {/* VISTA TABLET/DESKTOP: Tabla (oculta en movil) */}
                <Card className="hidden md:block min-w-0">
                    <CardHeader className="p-4 sm:p-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                            <div className="min-w-0">
                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                    Ranking de Rendimiento
                                </CardTitle>
                                <CardDescription className="mt-1.5 break-words text-xs sm:text-sm">
                                    Puntuacion: 33% tasa resolucion / 34% rapidez / 33% volumen. Horario usado: L-V 08:00-18:00 y Sab 08:00-10:00.
                                    {hasTrend
                                        ? " La variacion (+/-) compara el periodo seleccionado con el periodo equivalente anterior."
                                        : " Selecciona un rango de fechas para ver la variacion de rendimiento."}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-6 min-w-0">
                        <div className="rounded-md border overflow-x-auto max-w-full">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10 text-center text-xs">#</TableHead>
                                        <TableHead className="text-xs">Tecnico</TableHead>
                                        <TableHead className="text-center text-xs whitespace-nowrap">Eficiencia</TableHead>
                                        {hasTrend && (
                                            <TableHead className="text-center text-xs">Variacion</TableHead>
                                        )}
                                        <TableHead className="text-center text-xs hidden lg:table-cell">Tickets</TableHead>
                                        <TableHead className="text-center text-xs hidden xl:table-cell">Cerrados</TableHead>
                                        <TableHead className="text-center text-xs hidden xl:table-cell">En Progreso</TableHead>
                                        <TableHead className="text-center text-xs hidden xl:table-cell">Abiertos</TableHead>
                                        <TableHead className="text-center text-xs hidden md:table-cell">T. Resolucion</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {technicians.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={detailColSpan} className="text-center text-muted-foreground py-8">
                                                No hay tecnicos con tickets en este rango de fechas
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        technicians.map((tech, index) => {
                                            const isExpanded = expandedTechnicianId === tech.id;

                                            return (
                                                <Fragment key={tech.id}>
                                                    <TableRow
                                                        className={cn(
                                                            "cursor-pointer transition-colors",
                                                            isExpanded ? "bg-muted/50" : "hover:bg-muted/50",
                                                        )}
                                                        onClick={() => toggleTechnician(tech.id)}
                                                    >
                                                        <TableCell className="text-center font-bold text-sm">
                                                            {index === 0
                                                                ? <Trophy className="inline h-4 w-4 text-yellow-500" />
                                                                : index + 1}
                                                        </TableCell>
                                                        <TableCell className="min-w-0">
                                                            <div className="flex items-center justify-between gap-2 min-w-0">
                                                                <div className="min-w-0">
                                                                    <p className="font-medium text-sm truncate">{tech.name}</p>
                                                                    <p className="text-xs text-muted-foreground hidden sm:block truncate">{tech.email}</p>
                                                                </div>
                                                                <span className="text-[11px] font-medium text-muted-foreground">
                                                                    {isExpanded ? "Ocultar detalle" : "Ver detalle"}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className="font-bold text-lg">{tech.efficiency_score}</span>
                                                                {getEfficiencyBadge(tech.efficiency_score)}
                                                            </div>
                                                        </TableCell>
                                                        {hasTrend && (
                                                            <TableCell className="text-center">
                                                                {tech.score_trend !== null ? (
                                                                    <div className="flex flex-col items-center gap-0.5">
                                                                        <TrendIndicator trend={tech.score_trend} prevScore={tech.prev_score} />
                                                                        {tech.prev_score !== null && (
                                                                            <span className="text-xs text-muted-foreground">
                                                                                antes: {tech.prev_score}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground">sin datos</span>
                                                                )}
                                                            </TableCell>
                                                        )}
                                                        <TableCell className="text-center font-medium text-sm hidden lg:table-cell">
                                                            {tech.total_tickets}
                                                        </TableCell>
                                                        <TableCell className="text-center hidden xl:table-cell">
                                                            <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs">{tech.closed_tickets}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-center hidden xl:table-cell">
                                                            <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-xs">{tech.in_progress_tickets}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-center hidden xl:table-cell">
                                                            <Badge className="bg-red-600 hover:bg-red-700 text-white text-xs">{tech.open_tickets}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-center font-medium text-sm hidden md:table-cell">
                                                            {formatHours(tech.avg_resolution_hours)}
                                                        </TableCell>
                                                    </TableRow>
                                                    {isExpanded && (
                                                        <TableRow className="bg-muted/20 hover:bg-muted/20">
                                                            <TableCell colSpan={detailColSpan} className="p-2 sm:p-4">
                                                                {renderExpandedDetail(tech)}
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </Fragment>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Leyenda */}
                        <div className="mt-4 flex flex-wrap gap-3 sm:gap-4 text-xs text-muted-foreground px-1">
                            <div className="flex items-center gap-1.5"><div className="h-2 w-3 rounded-full bg-green-500" /><span>Excelente (&gt;=70)</span></div>
                            <div className="flex items-center gap-1.5"><div className="h-2 w-3 rounded-full bg-blue-500" /><span>Bueno (50-69)</span></div>
                            <div className="flex items-center gap-1.5"><div className="h-2 w-3 rounded-full bg-yellow-500" /><span>Regular (30-49)</span></div>
                            <div className="flex items-center gap-1.5"><div className="h-2 w-3 rounded-full bg-red-500" /><span>Por mejorar (&lt;30)</span></div>
                            {hasTrend && <>
                                <div className="flex items-center gap-1.5 text-green-600"><TrendingUp className="h-3 w-3" /><span>Mejoro vs periodo anterior</span></div>
                                <div className="flex items-center gap-1.5 text-red-500"><TrendingDown className="h-3 w-3" /><span>Bajo vs periodo anterior</span></div>
                            </>}
                        </div>
                    </CardContent>
                </Card>

                {/* Leyenda para mobile */}
                <div className="md:hidden flex flex-wrap gap-3 text-xs text-muted-foreground px-1">
                    <div className="flex items-center gap-1.5"><div className="h-2 w-3 rounded-full bg-green-500" /><span>Excelente</span></div>
                    <div className="flex items-center gap-1.5"><div className="h-2 w-3 rounded-full bg-blue-500" /><span>Bueno</span></div>
                    <div className="flex items-center gap-1.5"><div className="h-2 w-3 rounded-full bg-yellow-500" /><span>Regular</span></div>
                    <div className="flex items-center gap-1.5"><div className="h-2 w-3 rounded-full bg-red-500" /><span>Por mejorar</span></div>
                </div>

            </div>
        </AppLayout>
    );
}
