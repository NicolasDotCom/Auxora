import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Speciality, Support, type BreadcrumbItem } from '@/types';
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
        title: 'Technical Supports',
        href: '/supports',
    },
    {
        title: 'Edit',
        href: '',
    },
];

export default function Edit({support}: {support:Support}) {
    const { data, setData, put, processing, errors } = useForm({
        name: support.name,
        email: support.email,
        phone: support.phone,
        speciality: support.speciality,
    });

    const [open, setOpen] = useState(false); //Estado para controlar el popover

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('supports.update', support.id));
    };

    const handleCancel = () => {
        if(
            data.name !== support.name  ||
            data.email !== support.email ||
            data.phone !== support.phone ||
            data.speciality !== support.speciality
        ) {
            if(!confirm('¿Estás seguro de que quieres salir? Los cambios no guardados se perderán.')) {
                return;
            }
        }
        router.visit(route('supports.index'));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Technical Supports" />
            <div className="flex flex-col gap-4 p-4">
                <h1 className="text-2xl font-bold">Edit Technical Supports</h1>
                <Card>
                    <form onSubmit={handleSubmit}>
                        <CardHeader>Technical Supports Information</CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="name">Name</Label>
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
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    disabled={processing}
                                 />
                                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                            </div>

                            <div className="flex flex-col gap-1">
                                <Label htmlFor="address">Speciality</Label>
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
                                                : 'Select speciality...'
                                              }
                                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                           </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                        <Command>
                                            <CommandInput placeholder="Search speciality..." />
                                            <CommandList>
                                                <CommandEmpty>No speciality found.</CommandEmpty>
                                                <CommandGroup>
                                                    {specialities.map((spec)=> (
                                                        <CommandItem
                                                            key={spec.value}
                                                            value={spec.value}
                                                            onSelect={(currentValue)=>{
                                                                setData('speciality', currentValue as Speciality);
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
                                    'Update'
                                )}

                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
