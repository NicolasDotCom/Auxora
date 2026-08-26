import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Loader2, Plus, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PageProps, Role, UserWithRoles } from '@/types';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Users', href: '/users' },
  { title: 'Edit', href: '' },
];

interface Props extends PageProps {
  user: UserWithRoles;
  roles: Role[];
  support?: {
    id: number;
    name: string;
    email: string;
    phone: string;
    speciality: string;
  };
  customer?: {
    id: number;
    name: string;
    email: string;
    name_user: string;
    phone: string;
    nit?: string | null;
    additional_nits?: string[] | null;
  };
}

export default function Edit() {
  const { user, roles, support, customer } = usePage<Props>().props;
  const { data, setData, put, processing, errors } = useForm({
    name: user.name,
    email: user.email,
    role: user.roles[0]?.name ?? '',
    phone: support?.phone ?? customer?.phone ?? '',
    speciality: support?.speciality ?? '',
    name_user: customer?.name_user ?? '',
    nit: customer?.nit ?? '',
    additional_nits: (customer?.additional_nits ?? []) as string[],
  });

  // Función para traducir nombres de roles al español
  const translateRole = (roleName: string) => {
    const translations: { [key: string]: string } = {
      'admin': 'Administrador',
      'customer': 'Cliente',
      'support': 'Soporte Técnico'
    };
    return translations[roleName] || roleName;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('users.update', user.id));
  };

  const handleRoleChange = (value: string) => {
    setData('role', value);
    // Si el rol no es support, limpiar la especialidad
    if (value !== 'support') {
      setData('speciality', '');
    }
    // Si el rol no es customer, limpiar el name_user
    if (value !== 'customer') {
      setData('name_user', '');
      setData('nit', '');
      setData('additional_nits', []);
    }
  };

  const handleCancel = () => {
    if (data.name !== user.name || data.email !== user.email || data.role !== user.roles[0]?.name || data.phone !== (support?.phone ?? customer?.phone ?? '') || data.speciality !== (support?.speciality ?? '') || data.name_user !== (customer?.name_user ?? '')) {
      if (!confirm('¿Estás seguro de que quieres salir? Los cambios no guardados se perderán.')) return;
    }
    router.visit(route('users.index'));
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Edit User" />
      <div className="flex flex-col gap-4 p-4">
        <h1 className="text-2xl font-bold">Edit User</h1>
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>User Information</CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  disabled={processing}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              {data.role === 'customer' && (
                <div className="flex flex-col gap-1">
                  <Label htmlFor="name_user">Nombre de Usuario</Label>
                  <Input
                    id="name_user"
                    value={data.name_user}
                    onChange={(e) => setData('name_user', e.target.value)}
                    disabled={processing}
                    placeholder="Ingrese el nombre de usuario"
                  />
                  {errors.name_user && <p className="text-sm text-red-500">{errors.name_user}</p>}
                </div>
              )}

              {data.role === 'customer' && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <Label>NIT</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => setData('additional_nits', [...data.additional_nits, ''])}
                      disabled={processing}
                    >
                      <Plus className="h-3 w-3" /> Agregar NIT
                    </Button>
                  </div>
                  <Input
                    id="nit"
                    value={data.nit}
                    onChange={(e) => setData('nit', e.target.value)}
                    disabled={processing}
                    placeholder="Ej: 900123456-7"
                  />
                  {errors.nit && <p className="text-sm text-red-500">{errors.nit}</p>}
                  {data.additional_nits.map((nit, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={nit}
                        onChange={(e) => {
                          const updated = [...data.additional_nits];
                          updated[index] = e.target.value;
                          setData('additional_nits', updated);
                        }}
                        disabled={processing}
                        placeholder={`NIT adicional ${index + 2}`}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="shrink-0 text-red-500 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() =>
                          setData(
                            'additional_nits',
                            data.additional_nits.filter((_, i) => i !== index),
                          )
                        }
                        disabled={processing}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <Label htmlFor="email">Email</Label>
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
                  type="tel"
                  value={data.phone}
                  onChange={(e) => setData('phone', e.target.value)}
                  disabled={processing}
                  placeholder="Ej: +573001234567"
                />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="role">Rol</Label>
                <Select
                  value={data.role}
                  onValueChange={handleRoleChange}
                  disabled={processing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.name}>
                        {translateRole(role.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
              </div>

              {data.role === 'support' && (
                <div className="flex flex-col gap-1">
                  <Label htmlFor="speciality">Especialidad</Label>
                  <Select value={data.speciality} onValueChange={(value) => setData('speciality', value)} disabled={processing}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar especialidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Impresoras">Impresoras</SelectItem>
                      <SelectItem value="Sistemas">Sistemas</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.speciality && <p className="text-sm text-red-500">{errors.speciality}</p>}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </div>
                ) : (
                  'Guardar'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
