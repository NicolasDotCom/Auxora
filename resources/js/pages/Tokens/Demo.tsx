import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Copy, Play, RotateCcw, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Demo API Tickets', href: '/api-demo/tickets' },
];

export default function TicketsApiDemo() {
    const { apiBaseUrl, defaultEndpoint, supports, companies } = usePage<PageProps & {
        apiBaseUrl: string;
        defaultEndpoint: string;
        supports: Array<{ id: number; name: string }>;
        companies: string[];
    }>().props;

    const [token, setToken] = useState('');
    const [endpoint, setEndpoint] = useState(defaultEndpoint);
    const [ticketId, setTicketId] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [supportId, setSupportId] = useState('all');
    const [status, setStatus] = useState('all');
    const [responseText, setResponseText] = useState('');
    const [responseStatus, setResponseStatus] = useState<number | null>(null);
    const [responseIsJson, setResponseIsJson] = useState(false);
    const [lastRequestedEndpoint, setLastRequestedEndpoint] = useState('');
    const [loading, setLoading] = useState(false);

    const endpointQuery = endpoint.includes('?') ? endpoint.split('?')[1] : '';
    const activeParams = new URLSearchParams(endpointQuery);
    const activeFilters: Array<{ key: string; label: string; value: string }> = [];

    if (activeParams.get('ticket_id')) {
        activeFilters.push({ key: 'ticket_id', label: 'Ticket', value: activeParams.get('ticket_id') || '' });
    }
    if (activeParams.get('company_name')) {
        activeFilters.push({ key: 'company_name', label: 'Empresa', value: activeParams.get('company_name') || '' });
    }
    if (activeParams.get('support_id')) {
        const support = supports.find((s) => String(s.id) === activeParams.get('support_id'));
        activeFilters.push({
            key: 'support_id',
            label: 'Tecnico',
            value: support ? `${support.name} (#${support.id})` : `#${activeParams.get('support_id')}`,
        });
    }
    if (activeParams.get('status')) {
        activeFilters.push({ key: 'status', label: 'Estado', value: activeParams.get('status') || '' });
    }

    const applyFilters = () => {
        const params = new URLSearchParams();

        if (ticketId.trim()) params.set('ticket_id', ticketId.trim());
        if (companyName.trim()) params.set('company_name', companyName.trim());
        if (supportId !== 'all') params.set('support_id', supportId);
        if (status !== 'all') params.set('status', status);

        const query = params.toString();
        setEndpoint(query ? `/tickets?${query}` : '/tickets');
    };

    const clearFilters = () => {
        setTicketId('');
        setCompanyName('');
        setSupportId('all');
        setStatus('all');
        setEndpoint('/tickets');
    };

    const runRequest = async () => {
        setLoading(true);
        setResponseText('');
        setResponseStatus(null);
        setResponseIsJson(false);

        try {
            const url = `${apiBaseUrl}${endpoint}`;
            const headers: Record<string, string> = {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
            };

            const options: RequestInit = {
                method: 'GET',
                headers,
            };

            const result = await fetch(url, options);
            const body = await result.text();

            setLastRequestedEndpoint(endpoint);
            setResponseStatus(result.status);

            try {
                const parsed = JSON.parse(body);
                setResponseText(JSON.stringify(parsed, null, 2));
                setResponseIsJson(true);
            } catch {
                setResponseText(body);
                setResponseIsJson(false);
            }
        } catch (error) {
            setResponseStatus(null);
            setResponseIsJson(false);
            setResponseText(`Error de red: ${String(error)}`);
        } finally {
            setLoading(false);
        }
    };

    const copyResponse = async () => {
        if (!responseText) return;
        await navigator.clipboard.writeText(responseText);
        toast.success('Respuesta copiada');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Demo API Tickets" />
            <div className="space-y-4 p-3 sm:p-4">
                <div>
                    <h1 className="text-xl font-bold sm:text-2xl">Demo API de Tickets</h1>
                    <p className="text-sm text-muted-foreground">
                        Prueba los endpoints protegidos con Bearer Token sin salir del sistema.
                    </p>
                </div>

                <Alert>
                    <ShieldCheck className="h-4 w-4" />
                    <AlertTitle>Seguridad con token</AlertTitle>
                    <AlertDescription>
                        Usa un token generado en el administrador de tokens. Sin token valido, la API responde 401/403.
                    </AlertDescription>
                </Alert>

                <Card>
                    <CardHeader>
                        <CardTitle>Ejecutar request</CardTitle>
                        <CardDescription className="space-y-1">
                            <p className="break-all">Base URL: {apiBaseUrl}</p>
                            <p className="break-all">Base URL Produccion: https://auxora.homelabvps.dev/api/v1</p>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3 rounded-md border p-3 sm:p-4">
                            <div>
                                <p className="text-sm font-medium">Filtros de tickets</p>
                                <p className="text-xs text-muted-foreground">
                                    Personaliza la consulta por numero, empresa, tecnico asignado y estado.
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="filter-ticket-id">Numero de ticket</Label>
                                    <Input
                                        id="filter-ticket-id"
                                        value={ticketId}
                                        onChange={(e) => setTicketId(e.target.value)}
                                        placeholder="Ej: 105"
                                    />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="filter-company">Empresa</Label>
                                    <Input
                                        id="filter-company"
                                        list="companies-list"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        placeholder="Nombre de empresa"
                                    />
                                    <datalist id="companies-list">
                                        {companies.map((company) => (
                                            <option key={company} value={company} />
                                        ))}
                                    </datalist>
                                </div>

                                <div className="grid gap-1.5">
                                    <Label>Tecnico asignado</Label>
                                    <Select value={supportId} onValueChange={setSupportId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            {supports.map((support) => (
                                                <SelectItem key={support.id} value={String(support.id)}>
                                                    {support.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-1.5">
                                    <Label>Estado</Label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            <SelectItem value="Open">Open</SelectItem>
                                            <SelectItem value="In Progress">In Progress</SelectItem>
                                            <SelectItem value="Closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Button type="button" onClick={applyFilters} className="w-full sm:w-auto">
                                    Aplicar filtros
                                </Button>
                                <Button type="button" variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
                                    <RotateCcw className="h-4 w-4" /> Limpiar
                                </Button>
                            </div>

                            <div className="space-y-2 rounded-md border border-dashed p-2.5">
                                <p className="text-xs font-medium text-muted-foreground">Lo que se esta buscando ahora</p>
                                <p className="text-xs break-all text-muted-foreground">GET {endpoint}</p>
                                <div className="flex flex-wrap gap-2">
                                    {activeFilters.length === 0 ? (
                                        <Badge variant="outline">Sin filtros aplicados</Badge>
                                    ) : (
                                        activeFilters.map((filter) => (
                                            <Badge key={filter.key} variant="secondary">
                                                {filter.label}: {filter.value}
                                            </Badge>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="token">Bearer token</Label>
                            <Input
                                id="token"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="1|abcdef..."
                            />
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
                            <div className="md:col-span-1">
                                <Label>Metodo</Label>
                                <Input value="GET" readOnly />
                            </div>
                            <div className="sm:col-span-1 md:col-span-3">
                                <Label htmlFor="endpoint">Endpoint</Label>
                                <Input
                                    id="endpoint"
                                    value={endpoint}
                                    onChange={(e) => setEndpoint(e.target.value)}
                                    placeholder="/tickets"
                                />
                            </div>
                        </div>

                        <Button onClick={runRequest} disabled={loading || !token.trim()} className="w-full sm:w-auto">
                            <Play className="h-4 w-4" />
                            {loading ? 'Consultando...' : 'Enviar request'}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Respuesta</CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-2">
                            <span>Resultado completo del endpoint.</span>
                            {responseStatus !== null && (
                                <Badge variant={responseStatus >= 400 ? 'destructive' : 'success'}>
                                    HTTP {responseStatus}
                                </Badge>
                            )}
                            {responseText && (
                                <Badge variant="secondary">{responseIsJson ? 'JSON formateado' : 'Texto plano'}</Badge>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-hidden rounded-md border">
                            <div className="flex items-center justify-between border-b px-3 py-2">
                                <p className="text-xs text-muted-foreground">
                                    {responseStatus !== null
                                        ? `Estado HTTP: ${responseStatus}${lastRequestedEndpoint ? ` | Consulta: GET ${lastRequestedEndpoint}` : ''}`
                                        : 'Aun no hay respuesta'}
                                </p>
                                <Button type="button" variant="outline" size="sm" onClick={copyResponse} disabled={!responseText}>
                                    <Copy className="h-4 w-4" /> Copiar
                                </Button>
                            </div>
                            <pre className="max-h-[28rem] overflow-auto bg-muted/20 p-3 font-mono text-xs leading-6 whitespace-pre-wrap sm:text-sm">
                                {responseText || 'Ejecuta una consulta para ver la respuesta aqui.'}
                            </pre>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
