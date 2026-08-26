import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { PageProps, type BreadcrumbItem, Ticket } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Ticket as TicketIcon, Clock, CheckCircle, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Hook de conteo animado con easing ease-out
function useCountUp(target: number, duration = 1200) {
    const [count, setCount] = useState(0);
    const rafRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);

    useEffect(() => {
        if (target === 0) {
            setCount(0);
            return;
        }

        startTimeRef.current = null;

        const animate = (timestamp: number) => {
            if (startTimeRef.current === null) {
                startTimeRef.current = timestamp;
            }
            const elapsed = timestamp - startTimeRef.current;
            const progress = Math.min(elapsed / duration, 1);
            // easing ease-out cúbico
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate);
            } else {
                setCount(target);
            }
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, [target, duration]);

    return count;
}

// Componente contador animado
function AnimatedCounter({ value }: { value: number }) {
    const count = useCountUp(value);
    return <>{count}</>;
}

// Tipos específicos para el dashboard
interface DashboardMetricas {
    tickets_abiertos: number;
    tickets_en_progreso: number;
    tickets_cerrados: number;
    total_tickets: number;
}

interface GraficaData {
    status: string;
    cantidad: number;
    fill: string;
}

interface UltimoTicket {
    numero_ticket: string;
    tecnico_asignado: string;
    estado: string;
    created_at: string;
}

interface DashboardPageProps extends PageProps {
    metricas: DashboardMetricas;
    graficaData: GraficaData[];
    ultimosTickets: UltimoTicket[];
    userRole: string | null;
    allTickets: Ticket[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Menú',
        href: '/dashboard',
    },
];

const chartConfig = {
    cantidad: {
        label: 'Cantidad',
        color: '#2662d9'
    }
} satisfies ChartConfig;

// Función para obtener el color según el estado - Sistema de Semaforización
const getStatusColor = (status: string) => {
    switch (status) {
        case 'Open':
        case 'Abierto':
        case 'Abiertos':
            return 'text-white bg-red-600';
        case 'In Progress':
        case 'En Progreso':
            return 'text-white bg-orange-500';
        case 'Closed':
        case 'Cerrado':
        case 'Cerrados':
            return 'text-white bg-green-600';
        default:
            return 'text-gray-600 bg-gray-50';
    }
};

// Función para obtener el ícono según el estado
const getStatusIcon = (status: string) => {
    switch (status) {
        case 'Open':
        case 'Abiertos':
            return <TicketIcon className="h-6 w-6" />;
        case 'In Progress':
        case 'En Progreso':
            return <Clock className="h-6 w-6" />;
        case 'Closed':
        case 'Cerrados':
            return <CheckCircle className="h-6 w-6" />;
        default:
            return <Users className="h-6 w-6" />;
    }
};

// Función para traducir estados al español
const getStatusLabel = (status: string) => {
    switch (status) {
        case 'Open':
            return 'Abierto';
        case 'In Progress':
            return 'En Progreso';
        case 'Closed':
            return 'Cerrado';
        // Ya vienen traducidos del backend, retornar tal cual
        case 'Abierto':
        case 'En Progreso':
        case 'Cerrado':
            return status;
        default:
            return status;
    }
};

export default function Dashboard() {
    const { metricas, graficaData, ultimosTickets, userRole, allTickets } = usePage<DashboardPageProps>().props;

    // Datos de las métricas como array para mapear
    const metricasCards = [
        {
            titulo: 'Tickets Abiertos',
            valor: metricas?.tickets_abiertos || 0,
            status: 'Open',
            descripcion: 'Tickets pendientes',
            href: '/tickets?status=Open',
        },
        {
            titulo: 'Tickets en Progreso',
            valor: metricas?.tickets_en_progreso || 0,
            status: 'In Progress',
            descripcion: 'En proceso de resolución',
            href: '/tickets?status=In+Progress',
        },
        {
            titulo: 'Tickets Cerrados',
            valor: metricas?.tickets_cerrados || 0,
            status: 'Closed',
            descripcion: 'Resueltos completamente',
            href: '/tickets?status=Closed',
        },
        {
            titulo: 'Total de Tickets',
            valor: metricas?.total_tickets || 0,
            status: 'Total',
            descripcion: 'Todos los tickets',
            href: '/tickets',
        }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Menú" />
            <style>{`
                @keyframes cardFloat {
                    0%, 100% { transform: translateY(0px); }
                    50%       { transform: translateY(-6px); }
                }
                .card-float {
                    animation: cardFloat 3s ease-in-out infinite;
                }
                .card-float:hover {
                    animation-play-state: paused;
                }
            `}</style>

            <div className="px-3 sm:px-6 lg:px-8 pt-2 pb-8">
            {/* Métricas superiores - 4 casillas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6 mb-4 sm:mb-6">
                {metricasCards.map((metrica, index) => (
                    <Link key={index} href={metrica.href} className="block group">
                    <Card
                        className="card-float hover:shadow-lg transition-shadow duration-200 cursor-pointer group-hover:border-primary/50 group-hover:ring-1 group-hover:ring-primary/20"
                        style={{ animationDelay: `${index * 0.4}s` }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-3 sm:p-6 bg-gradient-to-r from-primary/5 to-transparent rounded-t-xl">
                            <CardTitle className="text-[11px] sm:text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                                {metrica.titulo}
                            </CardTitle>
                            <div className={`p-1 sm:p-2 rounded-lg flex-shrink-0 ${getStatusColor(metrica.status)}`}>
                                <div className="scale-75 sm:scale-100">
                                    {getStatusIcon(metrica.status)}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-6 pt-0">
                            <div className="text-xl sm:text-3xl font-bold">
                                <AnimatedCounter value={metrica.valor} />
                            </div>
                            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
                                {metrica.descripcion}
                            </p>
                        </CardContent>
                    </Card>
                    </Link>
                ))}
            </div>

            {/* Sección inferior con gráfica y tabla */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
                {/* Gráfica de barras - Izquierda */}
                <Card>
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-base sm:text-xl">Resumen de Tickets</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            Distribución de tickets por estado
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-6 pb-4 sm:pb-6">
                        <ChartContainer config={chartConfig}>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={graficaData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="status" 
                                        tick={{ fontSize: 10 }}
                                        interval={0}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <ChartTooltip 
                                        content={<ChartTooltipContent />}
                                    />
                                    <Bar 
                                        dataKey="cantidad" 
                                        fill="#2662d9"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Tabla de últimos tickets - Derecha */}
                <Card>
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-base sm:text-xl">Últimos Tickets</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            Resumen de los tickets más recientes
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-6 pb-4 sm:pb-6">
                        <div className="space-y-3 sm:space-y-4 overflow-x-auto">
                            {/* Encabezados */}
                            <div className="hidden sm:grid grid-cols-4 gap-4 pb-2 border-b text-sm font-medium text-gray-600">
                                <div>N° Ticket</div>
                                <div>Técnico</div>
                                <div>Estado</div>
                                <div>Creado</div>
                            </div>
                            
                            {/* Filas de datos */}
                            {ultimosTickets && Array.isArray(ultimosTickets) && ultimosTickets.length > 0 ? (
                                ultimosTickets.map((ticket: UltimoTicket, index: number) => (
                                    <div key={index} className="hidden sm:grid grid-cols-4 gap-4 py-2 text-sm">
                                        <div className="font-medium text-blue-600">
                                            {ticket.numero_ticket}
                                        </div>
                                        <div className="text-gray-700 truncate">
                                            {ticket.tecnico_asignado}
                                        </div>
                                        <div>
                                            <span className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-semibold ${getStatusColor(ticket.estado)}`}>
                                                {getStatusLabel(ticket.estado)}
                                            </span>
                                        </div>
                                        <div className="text-gray-500">
                                            {ticket.created_at}
                                        </div>
                                    </div>
                                ))
                            ) : null}
                            
                            {/* Vista móvil - Cards */}
                            {ultimosTickets && Array.isArray(ultimosTickets) && ultimosTickets.length > 0 ? (
                                ultimosTickets.map((ticket: UltimoTicket, index: number) => (
                                    <div key={index} className="sm:hidden flex flex-col gap-2 p-3 border rounded-lg bg-gray-50">
                                        <div className="flex justify-between items-start">
                                            <div className="font-medium text-blue-600">
                                                {ticket.numero_ticket}
                                            </div>
                                            <span className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-semibold ${getStatusColor(ticket.estado)}`}>
                                                {getStatusLabel(ticket.estado)}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-700">
                                            <span className="font-medium">Técnico:</span> {ticket.tecnico_asignado}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {ticket.created_at}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No hay tickets recientes
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
            </div>
        </AppLayout>
    );
}
