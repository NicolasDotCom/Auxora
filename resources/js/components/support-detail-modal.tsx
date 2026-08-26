import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Support } from '@/types';
import { Mail, Phone, Wrench, Ticket, Calendar, UserCircle2, Monitor } from 'lucide-react';

interface SupportDetailModalProps {
    support: Support | null;
    isOpen: boolean;
    onClose: () => void;
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="text-sm font-medium mt-0.5 break-words">{value || <span className="text-muted-foreground italic">Sin datos</span>}</p>
            </div>
        </div>
    );
}

export function SupportDetailModal({ support, isOpen, onClose }: SupportDetailModalProps) {
    if (!support) return null;

    const initials = support.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('');

    const specialityLabel = support.speciality === 'Impresoras' ? 'Impresoras' : 'Sistemas';
    const SpecialityIcon = support.speciality === 'Impresoras' ? Wrench : Monitor;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md w-full p-0 overflow-hidden gap-0">
                {/* Header */}
                <div className="relative bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 pt-6 pb-8 text-white rounded-t-lg">
                    <DialogTitle className="sr-only">Detalle del técnico {support.name}</DialogTitle>
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 flex-shrink-0 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold shadow-inner">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl font-bold leading-tight truncate">{support.name}</h2>
                            <p className="text-emerald-100 text-sm truncate">{support.email}</p>
                            <span className="inline-flex items-center gap-1 mt-1.5 text-xs bg-white/20 rounded-full px-2.5 py-0.5 font-medium">
                                <SpecialityIcon className="h-3 w-3" />
                                {specialityLabel}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-2">
                    <InfoRow icon={UserCircle2} label="Nombre completo" value={support.name} />
                    <InfoRow icon={Mail} label="Correo electrónico" value={support.email} />
                    <InfoRow icon={Phone} label="Teléfono" value={support.phone} />
                    <InfoRow icon={SpecialityIcon} label="Especialidad" value={
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            {specialityLabel}
                        </span>
                    } />
                    {support.tickets_count !== undefined && (
                        <InfoRow icon={Ticket} label="Tickets asignados" value={
                            <span className="inline-flex items-center gap-1.5">
                                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                                {support.tickets_count} ticket{support.tickets_count !== 1 ? 's' : ''}
                            </span>
                        } />
                    )}
                    <InfoRow icon={Calendar} label="Fecha de registro" value={
                        new Date(support.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
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
