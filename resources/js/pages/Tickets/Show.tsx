import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import AppLayout from '@/layouts/app-layout';
import { PageProps, type BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';
import { Head, Link, router, usePage, useForm } from '@inertiajs/react';
import { Download, FileText, Trash2, Edit, ArrowLeft, Check, ChevronsUpDown, Paperclip, Send, User, Plus, Copy, Sparkles, TriangleAlert, ShieldCheck } from 'lucide-react';
import { useState, useRef } from 'react';
import { toast } from 'sonner';

interface Ticket {
    id: number;
    subject: string;
    description: string;
    phone: string;
    nombre_contacto: string;
    address: string;
    brand: string;
    model: string;
    serial: string;
    status: string;
    ciudad: string;
    created_at: string;
    updated_at: string;
    closed_at: string | null;
    cliente_externo?: string | null;
    customer: {
        id: number;
        name: string;
        email: string;
        name_user: string;
    } | null;
    support: {
        id: number;
        name: string;
    } | null;
    documents: TicketDocument[];
    comments: TicketComment[];
    histories: TicketHistory[];
    user: {
        id: number;
        name: string;
    };
}

interface TicketHistory {
    id: number;
    action: string;
    field: string | null;
    old_value: string | null;
    new_value: string | null;
    description: string;
    created_at: string;
    user: {
        id: number;
        name: string;
    } | null;
}

interface TicketComment {
    id: number;
    comment: string;
    created_at: string;
    user: {
        id: number;
        name: string;
    };
    attachments: CommentAttachment[];
}

interface CommentAttachment {
    id: number;
    file_name: string;
    file_path: string;
    file_size: number;
    created_at: string;
}

interface TicketDocument {
    id: number;
    original_name: string;
    file_name: string;
    file_path: string;
    mime_type: string;
    file_size: number;
    formatted_size: string;
    file_url: string;
    created_at: string;
}

interface PendingPart {
    id: number;
    part_name: string;
    part_code: string;
    status: string;
    created_at: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tickets',
        href: '/tickets',
    },
    {
        title: 'Detalles',
        href: '',
    },
];

const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
        case 'open':
            return 'open';
        case 'in progress':
            return 'progress';
        case 'closed':
            return 'closed';
        default:
            return 'outline';
    }
};

const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
        case 'open':
            return 'Abierto';
        case 'in progress':
            return 'En Progreso';
        case 'closed':
            return 'Cerrado';
        default:
            return status;
    }
};

const statuses = [
    { value: 'Open', label: 'Abierto' },
    { value: 'In Progress', label: 'En Progreso' },
    { value: 'Closed', label: 'Cerrado' },
];

export default function Show() {
    const { ticket, auth } = usePage<PageProps & { ticket: Ticket }>().props;
    const canDuplicate = auth?.permissions?.includes('create ticket');
    const [statusOpen, setStatusOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState(ticket.status);
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'documentos' | 'detalles' | 'repuestos'>('documentos');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Estado para múltiples repuestos
    const [parts, setParts] = useState([{ part_name: '', part_code: '' }]);
    const [processingPart, setProcessingPart] = useState(false);
    
    const { data, setData, post, processing, reset } = useForm({
        comment: '',
        attachments: [] as File[],
    });

    const handleStatusChange = (newStatus: string) => {
        setPendingStatus(newStatus);
        setStatusDialogOpen(true);
        setStatusOpen(false);
    };

    const confirmStatusChange = () => {
        if (!pendingStatus) {
            setStatusDialogOpen(false);
            return;
        }

        router.patch(route('tickets.update-status', ticket.id), {
            status: pendingStatus,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedStatus(pendingStatus);
                toast.success('Estado actualizado correctamente');
            },
        });

        setStatusDialogOpen(false);
        setPendingStatus(null);
    };

    const handleDownload = (documentId: number) => {
        window.open(route('ticket-documents.download', documentId), '_blank');
    };

    const handleDeleteDocument = (documentId: number, fileName: string) => {
        if (confirm(`¿Estás seguro de que quieres eliminar el documento "${fileName}"?`)) {
            router.delete(route('ticket-documents.destroy', documentId));
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleRealizarReporte = () => {
        window.location.href = route('tickets.reporte-visita.form', ticket.id);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            setData('attachments', [...data.attachments, ...Array.from(files)]);
            toast.success('Documento cargado con éxito');
        }
    };

    const handleRemoveFile = (index: number) => {
        const newFiles = data.attachments.filter((_, i) => i !== index);
        setData('attachments', newFiles);
    };

    const handleSubmitComment = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validar que haya al menos comentario o archivos
        if (!data.comment.trim() && data.attachments.length === 0) {
            alert('Debes agregar un comentario o adjuntar al menos un archivo.');
            return;
        }

        post(route('tickets.comments.store', ticket.id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            },
        });
    };

    const handleDownloadAttachment = (attachmentId: number) => {
        window.open(route('comment-attachments.download', attachmentId), '_blank');
    };

    const handleSubmitPart = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validar que todos los campos estén completos
        const emptyFields = parts.some(part => !part.part_name.trim() || !part.part_code.trim());
        if (emptyFields) {
            alert('Debes completar todos los campos de los repuestos.');
            return;
        }

        setProcessingPart(true);
        
        try {
            // Enviar cada repuesto individualmente
            for (const part of parts) {
                await new Promise((resolve, reject) => {
                    router.post(route('pending-parts.store'), {
                        ticket_id: ticket.id,
                        part_name: part.part_name,
                        part_code: part.part_code,
                    }, {
                        preserveScroll: true,
                        onSuccess: () => resolve(true),
                        onError: (errors) => reject(errors),
                    });
                });
            }
            
            setParts([{ part_name: '', part_code: '' }]);
        } catch (error) {
            console.error('Error al registrar repuestos:', error);
            alert('Error al registrar los repuestos. Por favor intenta nuevamente.');
        } finally {
            setProcessingPart(false);
        }
    };
    
    const handleAddPart = () => {
        setParts([...parts, { part_name: '', part_code: '' }]);
    };
    
    const handleRemovePart = (index: number) => {
        if (parts.length > 1) {
            setParts(parts.filter((_, i) => i !== index));
        }
    };
    
    const handlePartChange = (index: number, field: 'part_name' | 'part_code', value: string) => {
        const newParts = [...parts];
        newParts[index][field] = value;
        setParts(newParts);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const pendingStatusLabel = pendingStatus ? statuses.find((s) => s.value === pendingStatus)?.label ?? pendingStatus : '';
    const pendingStatusTone = pendingStatus === 'Closed'
        ? 'from-red-500/15 via-red-500/5 to-background'
        : pendingStatus === 'In Progress'
            ? 'from-orange-500/15 via-orange-500/5 to-background'
            : 'from-emerald-500/15 via-emerald-500/5 to-background';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Ticket #${ticket.id}`} />
            
            <div className="flex flex-col gap-4 sm:gap-6 p-2 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.visit(route('tickets.index'))}
                            className="flex-shrink-0"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver
                        </Button>
                        <h1 className="text-lg sm:text-2xl font-bold">Ticket #{ticket.id}</h1>
                        <Badge variant={getStatusBadgeVariant(ticket.status)}>
                            {getStatusLabel(ticket.status)}
                        </Badge>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                        {(auth?.roles?.includes('support') || auth?.roles?.includes('Almacenista')) && (
                            <Button 
                                variant="default"
                                onClick={handleRealizarReporte}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Realizar Reporte
                            </Button>
                        )}
                        {canDuplicate && (
                            <Link href={route('tickets.duplicate', ticket.id)}>
                                <Button variant="outline">
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplicar
                                </Button>
                            </Link>
                        )}
                        {(auth?.roles?.includes('admin') || auth?.roles?.includes('customer')) && (
                            <Link href={route('tickets.edit', ticket.id)}>
                                <Button variant="outline">
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Información del Ticket */}
                    <Card>
                        <CardHeader className="p-4 sm:p-6">
                            <CardTitle className="text-base sm:text-lg">Información del Ticket</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Asunto</label>

                        <AlertDialog open={statusDialogOpen} onOpenChange={(open) => {
                            setStatusDialogOpen(open);
                            if (!open) {
                                setPendingStatus(null);
                            }
                        }}>
                            <AlertDialogContent className={`overflow-hidden border border-white/10 bg-slate-950/95 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur-xl ${pendingStatusTone}`}>
                                <AlertDialogHeader className="text-left">
                                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-100 shadow-sm backdrop-blur">
                                            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                                        Confirmación de estado
                                    </div>
                                        <AlertDialogTitle className="flex items-center gap-2 text-xl text-white">
                                            <TriangleAlert className="h-5 w-5 text-amber-300" />
                                        ¿Cambiar el ticket a {pendingStatusLabel}?
                                    </AlertDialogTitle>
                                        <AlertDialogDescription className="space-y-3 pt-1 text-sm text-slate-200">
                                        <p>
                                            Este cambio quedará registrado en el historial del ticket y podrá afectar el seguimiento del caso.
                                        </p>
                                            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 p-3 text-sm text-white shadow-sm">
                                                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                                            <span>
                                                Estado actual: <strong>{getStatusLabel(ticket.status)}</strong> · Nuevo estado: <strong>{pendingStatusLabel}</strong>
                                            </span>
                                        </div>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setPendingStatus(null)}>
                                        Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={confirmStatusChange}
                                            className="border border-cyan-400/20 bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                                    >
                                        Sí, cambiar estado
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                                <p className="text-lg font-semibold">{ticket.subject}</p>
                            </div>

                            {ticket.cliente_externo && ticket.user && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Creado por</label>
                                    <p className="text-lg">{ticket.user.name}</p>
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    {ticket.cliente_externo ? 'Cliente Externo' : 'Cliente'}
                                </label>
                                <p className="text-lg">{ticket.cliente_externo || ticket.customer?.name || 'Sin asignar'}</p>
                                {ticket.customer?.email && (
                                    <p className="text-sm text-gray-600">{ticket.customer.email}</p>
                                )}
                            </div>

                            {!ticket.cliente_externo && ticket.customer?.name_user && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Creado por</label>
                                    <p className="text-lg">{ticket.customer.name_user}</p>
                                </div>
                            )}
                            
                            <div>
                                <label className="text-sm font-medium text-gray-500">Técnico Asignado</label>
                                <p className="text-lg">
                                    {ticket.support ? ticket.support.name : 'Sin asignar'}
                                </p>
                            </div>

                            {(auth?.roles?.includes('support') || auth?.roles?.includes('admin')) && (
                                <div>
                                    <Label htmlFor="status" className="text-sm font-medium text-gray-500">Estado</Label>
                                    <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={statusOpen}
                                                className="w-full justify-between mt-1"
                                            >
                                                {selectedStatus
                                                    ? statuses.find((s) => s.value === selectedStatus)?.label
                                                    : 'Seleccionar estado...'}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0">
                                            <Command>
                                                <CommandInput placeholder="Buscar estado..." />
                                                <CommandList>
                                                    <CommandEmpty>No se encontró estado.</CommandEmpty>
                                                    <CommandGroup>
                                                        {statuses.map((status) => (
                                                            <CommandItem
                                                                key={status.value}
                                                                value={status.value}
                                                                onSelect={(currentValue) => {
                                                                    handleStatusChange(currentValue);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        'mr-2 h-4 w-4',
                                                                        selectedStatus === status.value
                                                                            ? 'opacity-100'
                                                                            : 'opacity-0'
                                                                    )}
                                                                />
                                                                {status.label}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-medium text-gray-500">Nombre de contacto</label>
                                <p className="text-lg">{ticket.nombre_contacto}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Teléfono</label>
                                <p className="text-lg">{ticket.phone}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Dirección</label>
                                <p className="text-lg">{ticket.address}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Ciudad</label>
                                <p className="text-lg">{ticket.ciudad}</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                <div>
                                    <label className="text-xs sm:text-sm font-medium text-gray-500">Marca</label>
                                    <p className="text-base sm:text-lg">{ticket.brand}</p>
                                </div>
                                <div>
                                    <label className="text-xs sm:text-sm font-medium text-gray-500">Modelo</label>
                                    <p className="text-base sm:text-lg">{ticket.model}</p>
                                </div>
                                <div>
                                    <label className="text-xs sm:text-sm font-medium text-gray-500">Serial</label>
                                    <p className="text-base sm:text-lg">{ticket.serial}</p>
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-gray-500">Descripción</label>
                                <p className="text-lg whitespace-pre-wrap">{ticket.description}</p>
                            </div>
                            
                            <div className={ticket.status === 'Closed' && ticket.closed_at ? 'grid grid-cols-2 gap-4' : 'grid grid-cols-1'}>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Creado</label>
                                    <p className="text-sm">{formatDate(ticket.created_at)}</p>
                                </div>
                                {ticket.status === 'Closed' && ticket.closed_at && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Cerrado</label>
                                        <p className="text-sm">{formatDate(ticket.closed_at)}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Documentos, Historial y Repuestos */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-4 border-b overflow-x-auto">
                                <button
                                    onClick={() => setActiveTab('documentos')}
                                    className={cn(
                                        "pb-3 px-2 font-medium text-sm transition-colors border-b-2 whitespace-nowrap",
                                        activeTab === 'documentos'
                                            ? "border-blue-600 text-blue-600"
                                            : "border-transparent text-gray-600 hover:text-gray-900"
                                    )}
                                >
                                    Documentos ({ticket.documents.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('detalles')}
                                    className={cn(
                                        "pb-3 px-2 font-medium text-sm transition-colors border-b-2 whitespace-nowrap",
                                        activeTab === 'detalles'
                                            ? "border-blue-600 text-blue-600"
                                            : "border-transparent text-gray-600 hover:text-gray-900"
                                    )}
                                >
                                    Historial ({ticket.histories?.length || 0})
                                </button>
                                {(auth?.roles?.includes('support') || auth?.roles?.includes('admin')) && 
                                 ticket.customer?.name?.toUpperCase() !== 'SERVICIOS EXTERNOS' && 
                                 ticket.customer?.name?.toUpperCase() !== 'SERVICIO EXTERNO' && (
                                    <button
                                        onClick={() => setActiveTab('repuestos')}
                                        className={cn(
                                            "pb-3 px-2 font-medium text-sm transition-colors border-b-2 whitespace-nowrap",
                                            activeTab === 'repuestos'
                                                ? "border-blue-600 text-blue-600"
                                                : "border-transparent text-gray-600 hover:text-gray-900"
                                        )}
                                    >
                                        Repuestos
                                    </button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {activeTab === 'documentos' ? (
                                <>
                                    {ticket.documents.length > 0 ? (
                                        <div className="space-y-3">
                                            {ticket.documents.map((document: TicketDocument) => (
                                                <div 
                                                    key={document.id} 
                                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="h-8 w-8 text-blue-500" />
                                                        <div>
                                                            <p className="font-medium text-sm">
                                                                {document.original_name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {document.formatted_size} • {formatDate(document.created_at)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDownload(document.id)}
                                                            title="Descargar documento"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeleteDocument(document.id, document.original_name)}
                                                            className="text-red-500 hover:text-red-700"
                                                            title="Eliminar documento"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500">No hay documentos adjuntos</p>
                                        </div>
                                    )}
                                </>
                            ) : activeTab === 'detalles' ? (
                                <>
                                    {ticket.histories && ticket.histories.length > 0 ? (
                                        <div className="space-y-3">
                                            {ticket.histories.map((history: TicketHistory) => (
                                                <div 
                                                    key={history.id}
                                                    className="group flex gap-3 p-4 border-2 border-gray-200 rounded-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-200/50 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer"
                                                >
                                                    <div className="flex-shrink-0">
                                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-blue-500 group-hover:to-indigo-600 group-hover:scale-110 group-hover:shadow-lg">
                                                            <User className="h-5 w-5 text-blue-600 transition-all duration-300 group-hover:text-white group-hover:scale-110" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <p className="font-medium text-sm transition-colors duration-300 group-hover:text-blue-700">
                                                                    {history.description}
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-1 transition-colors duration-300 group-hover:text-gray-700">
                                                                    Por {history.user?.name || 'Sistema'} • {formatDate(history.created_at)}
                                                                </p>
                                                            </div>
                                                            <Badge 
                                                                variant={
                                                                    history.action === 'created' ? 'default' :
                                                                    history.action === 'status_changed' ? 'secondary' :
                                                                    history.action === 'assigned' ? 'outline' :
                                                                    history.action === 'reopened' ? 'destructive' :
                                                                    'outline'
                                                                }
                                                                className="text-xs transition-all duration-300 group-hover:scale-110 group-hover:shadow-md"
                                                            >
                                                                {history.action === 'created' ? 'Creado' :
                                                                 history.action === 'status_changed' ? 'Estado' :
                                                                 history.action === 'assigned' ? 'Asignado' :
                                                                 history.action === 'reopened' ? 'Reabierto' :
                                                                 history.action === 'updated' ? 'Actualizado' :
                                                                 history.action}
                                                            </Badge>
                                                        </div>
                                                        {history.old_value && history.new_value && (
                                                            <div className="mt-2 text-xs bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200 transition-all duration-300 group-hover:border-blue-300 group-hover:shadow-md group-hover:from-red-50 group-hover:to-green-50">
                                                                <span className="text-red-600 line-through font-medium px-2 py-1 bg-red-50 rounded">{history.old_value}</span>
                                                                <span className="mx-2 text-gray-400 font-bold">→</span>
                                                                <span className="text-green-600 font-bold px-2 py-1 bg-green-50 rounded">{history.new_value}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500">No hay historial disponible</p>
                                        </div>
                                    )}
                                </>
                            ) : activeTab === 'repuestos' ? (
                                <>
                                    {/* Formulario para agregar repuestos pendientes */}
                                    <form onSubmit={handleSubmitPart} className="space-y-5 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl shadow-md">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-blue-600 rounded-lg">
                                                    <FileText className="h-5 w-5 text-white" />
                                                </div>
                                                <h3 className="font-bold text-xl text-blue-900">Registrar Repuestos Pendientes</h3>
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={handleAddPart}
                                                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 shadow-md hover:shadow-lg transition-all"
                                                title="Agregar otro repuesto"
                                            >
                                                <Plus className="h-5 w-5" />
                                            </Button>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            {parts.map((part, index) => (
                                                <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 p-4 bg-white rounded-lg border border-gray-200">
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`part_name_${index}`} className="text-sm font-semibold text-gray-700">
                                                            Nombre del Repuesto
                                                        </Label>
                                                        <Input
                                                            id={`part_name_${index}`}
                                                            value={part.part_name}
                                                            onChange={(e) => handlePartChange(index, 'part_name', e.target.value)}
                                                            placeholder="Ej: Toner negro, Fusor, etc."
                                                            required
                                                            className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`part_code_${index}`} className="text-sm font-semibold text-gray-700">
                                                            Código del Repuesto
                                                        </Label>
                                                        <Input
                                                            id={`part_code_${index}`}
                                                            value={part.part_code}
                                                            onChange={(e) => handlePartChange(index, 'part_code', e.target.value)}
                                                            placeholder="Ej: TN-2410, FK-1150, etc."
                                                            required
                                                            className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    {parts.length > 1 && (
                                                        <div className="flex items-end">
                                                            <Button
                                                                type="button"
                                                                onClick={() => handleRemovePart(index)}
                                                                variant="outline"
                                                                className="text-red-600 hover:bg-red-50 border-red-300"
                                                                title="Eliminar este repuesto"
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <Button 
                                            type="submit" 
                                            disabled={processingPart}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 shadow-md hover:shadow-lg transition-all"
                                        >
                                            {processingPart ? 'Registrando...' : `Registrar ${parts.length} Repuesto${parts.length > 1 ? 's' : ''}`}
                                        </Button>
                                    </form>
                                </>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>

                {/* Sección de Comentarios */}
                <Card>
                    <CardHeader>
                        <CardTitle>Comentarios ({ticket.comments?.length || 0})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Lista de comentarios existentes */}
                        {ticket.comments && ticket.comments.length > 0 ? (
                            <div className="space-y-4 mb-6">
                                {ticket.comments.map((comment: TicketComment) => (
                                    <div key={comment.id} className="border rounded-lg p-4 bg-white shadow-sm">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-blue-100 rounded-full p-2">
                                                <User className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="font-semibold text-sm text-gray-900">{comment.user.name}</p>
                                                    <p className="text-xs text-gray-500">{formatDate(comment.created_at)}</p>
                                                </div>
                                                <p className="text-sm text-gray-800 whitespace-pre-wrap mb-3">{comment.comment}</p>
                                                
                                                {/* Archivos adjuntos del comentario */}
                                                {comment.attachments && comment.attachments.length > 0 && (
                                                    <div className="space-y-2">
                                                        {comment.attachments.map((attachment: CommentAttachment) => (
                                                            <div 
                                                                key={attachment.id} 
                                                                className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <Paperclip className="h-4 w-4 text-blue-600" />
                                                                    <span className="text-sm text-gray-900 font-medium">{attachment.file_name}</span>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleDownloadAttachment(attachment.id)}
                                                                    className="hover:bg-blue-200"
                                                                >
                                                                    <Download className="h-4 w-4 text-blue-600" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-500 mb-6">
                                <p className="text-sm">No hay comentarios aún</p>
                            </div>
                        )}

                        {/* Formulario para agregar nuevo comentario */}
                        <form onSubmit={handleSubmitComment} className="border-t pt-6">
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="comment">Agregar Comentario</Label>
                                    <Textarea
                                        id="comment"
                                        placeholder="Escribe tu comentario aquí..."
                                        value={data.comment}
                                        onChange={(e) => setData('comment', e.target.value)}
                                        rows={4}
                                        className="mt-1"
                                    />
                                </div>

                                {/* Archivos seleccionados */}
                                {data.attachments.length > 0 && (
                                    <div className="space-y-2">
                                        <Label className="text-gray-900">Archivos seleccionados:</Label>
                                        {data.attachments.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100">
                                                <div className="flex items-center gap-2">
                                                    <Paperclip className="h-4 w-4 text-blue-600" />
                                                    <span className="text-sm text-gray-900 font-medium">{file.name}</span>
                                                    <span className="text-xs text-gray-600">({formatFileSize(file.size)})</span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveFile(index)}
                                                    className="hover:bg-red-100"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        multiple
                                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xlsx,.xls"
                                        className="hidden"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Paperclip className="h-4 w-4 mr-2" />
                                        Adjuntar Archivos
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing || (!data.comment.trim() && data.attachments.length === 0)}
                                        className="ml-auto"
                                    >
                                        <Send className="h-4 w-4 mr-2" />
                                        {processing ? 'Enviando...' : 'Enviar'}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
