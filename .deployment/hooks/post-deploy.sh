#!/bin/bash

# Hook ejecutado después de cada deployment en Laravel Cloud
# Esto asegura que el enlace simbólico siempre exista

echo "🔗 Creando enlace simbólico de storage..."
php artisan storage:link

echo "✅ Deployment completado"
