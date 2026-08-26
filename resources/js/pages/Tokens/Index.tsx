import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, Copy, KeyRound, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

type TokenRow = {
    id: number;
    name: string;
    abilities: string[];
    last_used_at: string | null;
    expires_at: string | null;
    created_at: string;
    owner: {
        id: number | null;
        name: string | null;
        email: string | null;
    };
};

type SimpleUser = {
    id: number;
    name: string;
    email: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'API Tokens', href: '/settings/api-tokens' },
];

const ABILITIES = [
    { id: 'tickets:read', label: 'Leer tickets' },
];

export default function TokensIndex() {
    const { tokens, users, isAdmin, newToken } = usePage<PageProps & {
        tokens: TokenRow[];
        users: SimpleUser[];
        isAdmin: boolean;
        newToken?: string | null;
    }>().props;

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        abilities: ['tickets:read'] as string[],
        expires_at: '',
        user_id: '',
    });
    const [userSearch, setUserSearch] = useState('');

    const filteredUsers = useMemo(() => {
        const search = userSearch.trim().toLowerCase();
        if (!search) return users;

        return users.filter((user) => {
            const name = user.name.toLowerCase();
            const email = user.email.toLowerCase();
            return name.includes(search) || email.includes(search);
        });
    }, [users, userSearch]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('api-tokens.store'), {
            onSuccess: () => {
                toast.success('Token creado correctamente');
                reset('name', 'expires_at');
                setData('abilities', ['tickets:read']);
            },
        });
    };

    const toggleAbility = (ability: string, checked: boolean) => {
        if (checked) {
            setData('abilities', [...new Set([...data.abilities, ability])]);
            return;
        }

        setData('abilities', data.abilities.filter((a) => a !== ability));
    };

    const revokeToken = (tokenId: number) => {
        router.delete(route('api-tokens.destroy', tokenId), {
            preserveScroll: true,
            onSuccess: () => toast.success('Token revocado'),
        });
    };

    const copyToken = async () => {
        if (!newToken) return;
        await navigator.clipboard.writeText(newToken);
        toast.success('Token copiado al portapapeles');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="API Tokens" />
            <div className="space-y-4 p-3 sm:p-4">
                <div>
                    <h1 className="text-xl font-bold sm:text-2xl">Administrador de Tokens API</h1>
                    <p className="text-sm text-muted-foreground">
                        Crea, revisa y revoca tokens para consumir la API de tickets.
                    </p>
                </div>

                {newToken && (
                    <Alert>
                        <KeyRound className="h-4 w-4" />
                        <AlertTitle>Token generado</AlertTitle>
                        <AlertDescription>
                            <p>Este valor solo se muestra una vez. Guardalo en un lugar seguro.</p>
                            <div className="mt-2 flex flex-col gap-2 md:flex-row">
                                <Input value={newToken} readOnly className="font-mono text-xs sm:text-sm" />
                                <Button type="button" variant="secondary" onClick={copyToken} className="w-full md:w-auto">
                                    <Copy className="h-4 w-4" /> Copiar
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Crear token</CardTitle>
                        <CardDescription>
                            Define un nombre y los permisos exactos del token.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="token-name">Nombre del token</Label>
                                <Input
                                    id="token-name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Integracion CRM"
                                />
                                {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
                            </div>

                            {isAdmin && (
                                <div className="grid gap-2">
                                    <Label htmlFor="user-id">Propietario del token</Label>
                                    <Input
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                        placeholder="Buscar usuario por nombre o correo"
                                    />
                                    <Select
                                        value={data.user_id || 'self'}
                                        onValueChange={(value) => setData('user_id', value === 'self' ? '' : value)}
                                    >
                                        <SelectTrigger id="user-id">
                                            <SelectValue placeholder="Selecciona un propietario" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="self">Mi usuario</SelectItem>
                                            {filteredUsers.map((user) => (
                                                <SelectItem key={user.id} value={String(user.id)}>
                                                    {user.name} ({user.email})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Mostrando {filteredUsers.length} de {users.length} usuarios.
                                    </p>
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label>Permisos del token</Label>
                                <div className="grid gap-2 md:grid-cols-2">
                                    {ABILITIES.map((ability) => {
                                        const checked = data.abilities.includes(ability.id);
                                        return (
                                            <label key={ability.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                                                <Checkbox
                                                    checked={checked}
                                                    onCheckedChange={(value) => toggleAbility(ability.id, Boolean(value))}
                                                />
                                                <span>{ability.label}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                                {errors.abilities && <p className="text-xs text-red-600">{errors.abilities}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="expires-at">Expira en (opcional)</Label>
                                <Input
                                    id="expires-at"
                                    type="datetime-local"
                                    value={data.expires_at}
                                    onChange={(e) => setData('expires_at', e.target.value)}
                                />
                            </div>

                            <Button type="submit" disabled={processing} className="w-full sm:w-auto">
                                Crear token
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Tokens activos</CardTitle>
                        <CardDescription>
                            Revoca cualquier token comprometido o en desuso.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {tokens.length === 0 ? (
                            <div className="flex items-center gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                                <AlertTriangle className="h-4 w-4" />
                                Aun no hay tokens creados.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {tokens.map((token) => (
                                    <div key={token.id} className="rounded-md border p-3">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                            <div className="space-y-1">
                                                <p className="font-medium">{token.name}</p>
                                                <p className="break-words text-xs text-muted-foreground">
                                                    Owner: {token.owner.name ?? 'N/A'} - Abilities: {token.abilities.join(', ')}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Ultimo uso: {token.last_used_at ? new Date(token.last_used_at).toLocaleString() : 'Nunca'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Expira: {token.expires_at ? new Date(token.expires_at).toLocaleString() : 'Sin expiracion'}
                                                </p>
                                            </div>
                                            <Button variant="destructive" size="sm" onClick={() => revokeToken(token.id)} className="w-full md:w-auto">
                                                <Trash2 className="h-4 w-4" /> Revocar
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
