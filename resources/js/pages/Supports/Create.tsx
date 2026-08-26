import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
//Para select de speciality
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { specialities } from '@/constants/specialities';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Soporte Técnico',
        href: '/supports',
    },
    {
        title: 'Crear',
        href: '',
    },
];

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        speciality: '',
    });

    const [open, setOpen] = useState(false); //Estado para controlar el popover

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('supports.store'));
    };

    const handleCancel = () => {
        if(data.name || data.email || data.phone || data.speciality){
            if(!confirm('¿Estás seguro de que quieres salir? Los cambios no guardados se perderán.')) {
                return;
            }
        }
        router.visit(route('supports.index'));
    }
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Technical Supports" />
            <div className="flex flex-col gap-4 p-4">
                <h1 className="text-2xl font-bold">Crear Soporte Técnico</h1>
                <Card>
                    <form onSubmit={handleSubmit}>
                        <CardHeader>Información del Soporte Técnico</CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="name">Nombre</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    autoFocus
                                    onChange={(e) => setData('name', e.target.value)}
                                    disabled={processing}
                                />
                                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                            </div>

                            <div className="flex flex-col gap-1">
                                <Label htmlFor="email">E-mail</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    disabled={processing}
                                />
                                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                            </div>

                            <div className="flex flex-col gap-1">
                                <Label htmlFor="phone">Teléfono</Label>
                                <Input
                                    id="phone"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    disabled={processing}
                                 />
                                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                            </div>

                            <div className="flex flex-col gap-1">
                                <Label htmlFor="address">Especialidad</Label>
                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                           <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={open}
                                                className="w-full justify-between"
                                                disabled={processing}
                                           >
                                              {data.speciality
                                                ? specialities.find((spec)=>spec.value === data.speciality)?.label
                                                : 'Seleccionar especialidad...'
                                              }
                                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                           </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                        <Command>
                                            <CommandInput placeholder="Buscar especialidad..." />
                                            <CommandList>
                                                <CommandEmpty>No se encontró especialidad.</CommandEmpty>
                                                <CommandGroup>
                                                    {specialities.map((spec)=> (
                                                        <CommandItem
                                                            key={spec.value}
                                                            value={spec.value}
                                                            onSelect={(currentValue)=>{
                                                                setData('speciality', currentValue);
                                                                setOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    'mr-2 h-4 w-4',
                                                                    data.speciality === spec.value ? 'opacity-100' : 'opacity-0',
                                                                )}
                                                            />
                                                            {spec.label}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {errors.speciality && <p className="text-sm text-red-500">{errors.speciality}</p>}
                            </div>

                            {/* <div className="flex flex-col gap-1">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    disabled={processing}
                                />
                                {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                            </div> */}
                        </CardContent>

                        <CardFooter className="flex justify-end gap-2">
                            <Button
                                type='button'
                                variant="outline"
                                onClick={handleCancel}
                            >
                                Cancel
                            </Button>
                            <Button
                                type='submit'
                                disabled={processing}
                            >
                                {processing ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Saving...
                                    </div>
                                ) : (
                                    'Save'
                                )}

                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
