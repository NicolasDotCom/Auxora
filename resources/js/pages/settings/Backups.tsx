import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Upload, Download, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Backup {
    name: string;
    size: number;
    size_mb: number;
    date: string;
}

export default function Backups({ backups }: { backups: Backup[] }) {
    const [uploading, setUploading] = useState(false);
    const { data, setData, post, processing } = useForm({
        backup_file: null as File | null,
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setData('backup_file', e.target.files[0]);
        }
    };

    const handleUpload = () => {
        if (!data.backup_file) return;
        
        setUploading(true);
        post(route('backups.upload'), {
            onFinish: () => {
                setUploading(false);
                setData('backup_file', null);
                // Reset file input
                const fileInput = document.getElementById('backup-file') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            },
        });
    };

    const handleRestore = (filename: string) => {
        if (confirm('¿Estás seguro de restaurar este backup? Esto sobrescribirá los archivos actuales.')) {
            router.post(route('backups.restore', filename));
        }
    };

    const handleDelete = (filename: string) => {
        if (confirm('¿Estás seguro de eliminar este backup?')) {
            router.delete(route('backups.delete', filename));
        }
    };

    return (
        <AppLayout>
            <Head title="Gestión de Backups" />

            <div className="container mx-auto py-8 px-4">
                <h1 className="text-3xl font-bold mb-6">Gestión de Backups</h1>

                {/* Subir Backup */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Subir Backup
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <input
                                    id="backup-file"
                                    type="file"
                                    accept=".zip"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-md file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-blue-50 file:text-blue-700
                                        hover:file:bg-blue-100"
                                />
                            </div>
                            {data.backup_file && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">
                                        Archivo seleccionado: {data.backup_file.name} ({(data.backup_file.size / 1048576).toFixed(2)} MB)
                                    </span>
                                </div>
                            )}
                            <Button
                                onClick={handleUpload}
                                disabled={!data.backup_file || processing || uploading}
                            >
                                {uploading ? 'Subiendo...' : 'Subir Backup'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Lista de Backups */}
                <Card>
                    <CardHeader>
                        <CardTitle>Backups Disponibles ({backups.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {backups.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">
                                No hay backups disponibles. Sube uno o créalo usando el comando:
                                <code className="block mt-2 bg-gray-100 p-2 rounded">php artisan backup:documents</code>
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {backups.map((backup) => (
                                    <div
                                        key={backup.name}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                                    >
                                        <div>
                                            <p className="font-medium">{backup.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {backup.size_mb} MB • {backup.date}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => window.open(route('backup.download', backup.name), '_blank')}
                                                title="Descargar"
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRestore(backup.name)}
                                                className="text-green-600 hover:text-green-700"
                                                title="Restaurar"
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(backup.name)}
                                                className="text-red-600 hover:text-red-700"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Instrucciones */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>📖 Instrucciones</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p><strong>ANTES de hacer push:</strong></p>
                        <ol className="list-decimal list-inside space-y-1 ml-4">
                            <li>Ejecutar en Coolify (Terminal del contenedor): <code className="bg-gray-100 px-1 rounded">php artisan backup:documents</code></li>
                            <li>Ir a /backup/list y descargar el ZIP</li>
                            <li>Hacer tu push tranquilo</li>
                        </ol>
                        <p className="mt-4"><strong>DESPUÉS de hacer push:</strong></p>
                        <ol className="list-decimal list-inside space-y-1 ml-4">
                            <li>Subir el ZIP usando el formulario arriba</li>
                            <li>Click en el botón de restaurar (icono ⟲)</li>
                            <li>¡Listo! Archivos recuperados</li>
                        </ol>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
