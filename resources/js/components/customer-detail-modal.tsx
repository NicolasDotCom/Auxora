import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Customer } from '@/types';
import { Building2, Mail, Phone, Ticket, Calendar, User2, Hash } from 'lucide-react';

interface CustomerDetailModalProps {
    customer: Customer | null;
    isOpen: boolean;
    onClose: () => void;
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="text-sm font-medium mt-0.5 break-words">{value || <span className="text-muted-foreground italic">Sin datos</span>}</p>
            </div>
        </div>
    );
}

export function CustomerDetailModal({ customer, isOpen, onClose }: CustomerDetailModalProps) {
    if (!customer) return null;

    const initials = customer.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('');

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md w-full p-0 overflow-hidden gap-0">
                {/* Header */}
                <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 px-6 pt-6 pb-8 text-white rounded-t-lg">
                    <DialogTitle className="sr-only">Detalle del cliente {customer.name}</DialogTitle>
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 flex-shrink-0 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold shadow-inner">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl font-bold leading-tight truncate">{customer.name}</h2>
                            <p className="text-blue-100 text-sm truncate">{customer.email}</p>
                            <span className="inline-block mt-1.5 text-xs bg-white/20 rounded-full px-2.5 py-0.5 font-medium">
                                Cliente #{customer.id}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-2">
                    <InfoRow icon={Building2} label="Empresa" value={customer.name} />
                    <InfoRow icon={User2} label="Nombre de usuario" value={customer.name_user} />
                    <InfoRow icon={Mail} label="Correo electrónico" value={customer.email} />
                    <InfoRow icon={Phone} label="Teléfono" value={customer.phone} />
                    {customer.nit && (
                        <InfoRow icon={Hash} label="NIT" value={customer.nit} />
                    )}
                    {customer.tickets_count !== undefined && (
                        <InfoRow icon={Ticket} label="Tickets registrados" value={
                            <span className="inline-flex items-center gap-1.5">
                                <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                                {customer.tickets_count} ticket{customer.tickets_count !== 1 ? 's' : ''}
                            </span>
                        } />
                    )}
                    <InfoRow icon={Calendar} label="Fecha de registro" value={
                        new Date(customer.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
                    } />
                </div>

                {/* Footer */}
                <div className="flex justify-end px-6 py-4 border-t bg-muted/30">
                    <Button variant="outline" onClick={onClose}>
                        Cerrar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
