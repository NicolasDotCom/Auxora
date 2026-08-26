import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import { PageProps } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from "recharts";
import {
    Ticket, Users, CheckCircle2, Clock, AlertCircle,
    Search, X, TrendingUp, Cpu, MapPin, Tag, Wrench, Filter, Calendar, FileSpreadsheet, FileText,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

//  Tipos 
interface Summary {
    total: number;
    closed: number;
    in_progress: number;
    open: number;
    resolution_rate: number;
}
interface NameTotal  { name: string;    total: number; }
interface SubjTotal  { subject: string; total: number; }
interface SerialTotal{ serial: string;  total: number; }
interface CityTotal  { city: string;    total: number; }
interface DayTotal   { day: string;     total: number; }
interface MonthTotal   { label: string;   total: number; }
interface CustomerItem { name: string; }

interface Props extends PageProps {
    summary: Summary;
    top_customers:    NameTotal[];
    top_subjects:     SubjTotal[];
    top_serials:      SerialTotal[];
    top_cities:       CityTotal[];
    tickets_by_day:   DayTotal[];
    tickets_by_month: MonthTotal[];
    top_technicians:  NameTotal[];
    customers:        CustomerItem[];
    customer_name:    string | null;
    date_from: string;
    date_to: string;
}

//  Paleta de colores 
const PALETTE = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#ec4899","#84cc16","#14b8a6"];

//  helpers 
function StatCard({ icon: Icon, label, value, sub, color }: {
    icon: React.ElementType; label: string; value: string | number;
    sub?: string; color: string;
}) {
    return (
        <Card className="hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
                <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent className="pt-0">
                <p className="text-2xl font-bold">{value}</p>
                {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
            </CardContent>
        </Card>
    );
}

function HorizontalBar({ data, keyName, label }: {
    data: Array<Record<string, string | number>>;
    keyName: string;
    label: string;
}) {
    const max = Math.max(...data.map(d => d.total as number), 1);
    return (
        <ul className="flex flex-col gap-2 mt-1">
            {data.map((row, i) => (
                <li key={i} className="flex items-center gap-2 text-xs">
                    <span
                        className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold text-[9px]"
                        style={{ background: PALETTE[i % PALETTE.length] }}
                    >{i + 1}</span>
                    <span className="w-32 truncate text-foreground" title={String(row[keyName])}>{row[keyName]}</span>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                            className="h-2 rounded-full transition-all"
                            style={{
                                width: `${((row.total as number) / max) * 100}%`,
                                background: PALETTE[i % PALETTE.length],
                            }}
                        />
                    </div>
                    <span className="font-semibold text-foreground w-6 text-right">{row.total}</span>
                </li>
            ))}
        </ul>
    );
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-popover border rounded-md px-3 py-2 text-xs shadow-lg">
            <p className="font-medium mb-1">{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
            ))}
        </div>
    );
};

//  Componente principal 
export default function TicketStats({
    summary, top_customers, top_subjects, top_serials,
    top_cities, tickets_by_day, tickets_by_month,
    top_technicians, customers, customer_name, date_from, date_to,
}: Props) {

    const [from, setFrom] = useState(date_from ?? "");
    const [to,   setTo]   = useState(date_to   ?? "");

    const selectedCustomer = customers.find(c => c.name.toLowerCase() === customer_name?.toLowerCase()) ?? null;
    const [custSearch, setCustSearch] = useState(selectedCustomer?.name ?? "");
    const [custOpen,   setCustOpen]   = useState(false);
    const custRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (custRef.current && !custRef.current.contains(e.target as Node)) {
                setCustOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(custSearch.toLowerCase())
    ).slice(0, 20);

    const selectCustomer = (name: string | null) => {
        setCustOpen(false);
        const params: Record<string, string> = {};
        if (from) params.date_from = from;
        if (to)   params.date_to   = to;
        if (name !== null) params.customer_name = name;
        router.get("/analytics/tickets", params, { preserveState: false });
    };

    const applyFilter = () => {
        const params: Record<string, string> = {};
        if (from) params.date_from = from;
        if (to)   params.date_to   = to;
        if (customer_name) params.customer_name = customer_name;
        router.get("/analytics/tickets", params, { preserveState: false });
    };

    const clearFilter = () => {
        setFrom(""); setTo(""); setCustSearch("");
        router.get("/analytics/tickets", {}, { preserveState: false });
    };

    const hasFilter = !!(date_from || date_to || customer_name);

    const exportStats = (format: "excel" | "pdf") => {
        const params: Record<string, string> = {};
        if (from) params.date_from = from;
        if (to) params.date_to = to;
        if (customer_name) params.customer_name = customer_name;

        const exportRoute =
            format === "excel"
                ? route("analytics.tickets.export-excel", params)
                : route("analytics.tickets.export-pdf", params);

        window.location.href = exportRoute;
    };

    // Datos para el pie de estados
    const statusPie = [
        { name: "Cerrados",    value: summary.closed,      color: "#10b981" },
        { name: "En Progreso", value: summary.in_progress,  color: "#f59e0b" },
        { name: "Abiertos",    value: summary.open,         color: "#ef4444" },
    ].filter(d => d.value > 0);

    return (
        <AppLayout breadcrumbs={[
            { title: "Inicio",               href: "/dashboard" },
            { title: "Estadistica Tickets",  href: "/analytics/tickets" },
        ]}>
            <Head title="Estadistica de Tickets" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">

                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Ticket className="h-6 w-6 text-primary" />
                            Estadistica de Tickets
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Tendencias, patrones y datos clave de todos los tickets
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            className="h-8 text-xs gap-1"
                            onClick={() => exportStats("excel")}
                        >
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                            Exportar Excel
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 text-xs gap-1"
                            onClick={() => exportStats("pdf")}
                        >
                            <FileText className="h-3.5 w-3.5" />
                            Exportar PDF
                        </Button>
                    </div>

                    {/* Filtros */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl border border-border bg-muted/40">
                        <div className="col-span-full flex items-center gap-2 pb-2 border-b border-border/60">
                            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filtros</span>
                            <div className="ml-auto flex items-center gap-2">
                                <Button size="sm" onClick={applyFilter} className="h-7 text-xs">Aplicar</Button>
                                {hasFilter && (
                                    <Button size="sm" variant="outline" onClick={clearFilter} className="h-7 text-xs gap-1">
                                        <X className="h-3 w-3" /> Limpiar
                                    </Button>
                                )}
                            </div>
                        </div>
                        {/* Buscador de cliente */}
                        <div className="flex flex-col gap-1.5" ref={custRef}>
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Cliente</label>
                            <div className="relative">
                                <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                <Input
                                    type="text"
                                    value={custSearch}
                                    onChange={e => { setCustSearch(e.target.value); setCustOpen(true); }}
                                    onFocus={() => setCustOpen(true)}
                                    placeholder="Buscar cliente..."
                                    className="h-9 pl-8 pr-6"
                                />
                                {custSearch && (
                                    <button
                                        onClick={() => { setCustSearch(""); selectCustomer(null); }}
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                                {custOpen && filteredCustomers.length > 0 && (
                                    <div className="absolute z-50 top-10 left-0 w-full max-h-52 overflow-y-auto bg-popover border rounded-md shadow-lg">
                                        {filteredCustomers.map(c => (
                                            <button
                                                key={c.id}
                                                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-accent ${customer_name?.toLowerCase() === c.name.toLowerCase() ? "bg-accent font-medium" : ""}`}
                                                onClick={() => { setCustSearch(c.name); selectCustomer(c.name); }}
                                            >
                                                {c.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Desde</label>
                            <div className="relative">
                                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                <Input id="sf" type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-9 pl-8" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Hasta</label>
                            <div className="relative">
                                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                <Input id="st" type="date" value={to} onChange={e => setTo(e.target.value)} className="h-9 pl-8" />
                            </div>
                        </div>
                        {hasFilter && (
                            <p className="col-span-full text-xs text-muted-foreground">
                                Mostrando tickets
                                {selectedCustomer ? ` de ${selectedCustomer.name}` : ""}
                                {date_from ? ` desde ${date_from}` : ""}
                                {date_to   ? ` hasta ${date_to}`   : ""}
                            </p>
                        )}
                    </div>

                    {/* Tarjetas resumen */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
                        <StatCard icon={Ticket}       label="Total tickets"    value={summary.total}           color="text-primary" />
                        <StatCard icon={CheckCircle2} label="Cerrados"         value={summary.closed}          color="text-green-500" />
                        <StatCard icon={Clock}        label="En progreso"      value={summary.in_progress}      color="text-yellow-500" />
                        <StatCard icon={AlertCircle}  label="Abiertos"         value={summary.open}             color="text-red-500" />
                        <StatCard icon={TrendingUp}   label="Tasa resolucion"  value={`${summary.resolution_rate}%`} color="text-blue-500" sub="Tickets cerrados" />
                    </div>

                    {/* Fila 1: Distribucion de estados + Tickets por dia de semana */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                        {/* Pie de estados */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Ticket className="h-4 w-4 text-primary" /> Distribucion por Estado
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {statusPie.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie
                                                data={statusPie}
                                                cx="50%" cy="50%"
                                                innerRadius={55} outerRadius={85}
                                                paddingAngle={3}
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                labelLine={false}
                                            >
                                                {statusPie.map((entry, i) => (
                                                    <Cell key={i} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v: any) => [v, "Tickets"]} />
                                            <Legend wrapperStyle={{ fontSize: "11px" }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Tickets por dia de semana */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-primary" /> Tickets por Dia de la Semana
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={tickets_by_day} barSize={30}>
                                        <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="total" name="Tickets" radius={[4, 4, 0, 0]}>
                                            {tickets_by_day.map((_, i) => (
                                                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Fila 2: Evolucion mensual + Top tecnicos */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {tickets_by_month.length > 0 ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-primary" /> Evolucion Mensual de Tickets
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={tickets_by_month} barSize={16}>
                                            <XAxis dataKey="label" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="total" name="Tickets" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-primary" /> Evolucion Mensual de Tickets
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Wrench className="h-4 w-4 text-primary" /> Tecnicos con mas Tickets Asignados
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {top_technicians.length > 0
                                    ? <HorizontalBar data={top_technicians as any} keyName="name" label="Tecnico" />
                                    : <p className="text-sm text-muted-foreground text-center py-4">Sin datos</p>}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Fila 3: Top clientes y asuntos */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Users className="h-4 w-4 text-primary" />
                                    {customer_name ? `Usuarios de ${customer_name}` : "Clientes que mas Tickets crean"}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {top_customers.length > 0
                                    ? <HorizontalBar data={top_customers as any} keyName="name" label="Cliente" />
                                    : <p className="text-sm text-muted-foreground text-center py-4">Sin datos</p>}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-primary" /> Asuntos mas Frecuentes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {top_subjects.length > 0
                                    ? <HorizontalBar data={top_subjects as any} keyName="subject" label="Asunto" />
                                    : <p className="text-sm text-muted-foreground text-center py-4">Sin datos</p>}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Fila 3: Seriales y ciudades */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Cpu className="h-4 w-4 text-primary" /> Seriales con mas Tickets
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {top_serials.length > 0 ? (
                                    <ul className="flex flex-col gap-2 mt-1">
                                        {top_serials.map((row, i) => (
                                            <li key={i} className="flex items-center justify-between gap-2 text-xs">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold text-[9px]"
                                                        style={{ background: PALETTE[i % PALETTE.length] }}>
                                                        {i + 1}
                                                    </span>
                                                    <code className="truncate font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded" title={row.serial}>
                                                        {row.serial}
                                                    </code>
                                                </div>
                                                <Badge variant="secondary" className="shrink-0 text-[10px]">{row.total}x</Badge>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">Sin datos</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-primary" /> Ciudades con mas Tickets
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {top_cities.length > 0
                                    ? <HorizontalBar data={top_cities as any} keyName="city" label="Ciudad" />
                                    : <p className="text-sm text-muted-foreground text-center py-4">Sin datos</p>}
                            </CardContent>
                        </Card>
                    </div>

            </div>
        </AppLayout>
    );
}