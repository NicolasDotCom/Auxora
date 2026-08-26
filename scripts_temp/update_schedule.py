# -*- coding: utf-8 -*-
import os

filepath = r'c:\laragon\www\ticket_tes\app\Helpers\WorkingDaysHelper.php'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Reemplazar el comentario PHPDoc (linea 46)
old1 = 'Sábado: 09:00 - 13:00'
new1 = 'Sábado: 08:00 - 10:00'

# Reemplazar el comentario inline (linea 106)
old2 = 'Sábado: 09:00 a 13:00'
new2 = 'Sábado: 08:00 a 10:00'

# Reemplazar el array (linea 107)
old3 = 'return [9, 0, 13, 0];'
new3 = 'return [8, 0, 10, 0];'

replacements = 0
if old1 in content:
    content = content.replace(old1, new1)
    replacements += 1
    print(f'OK Reemplazo 1: PHPDoc actualizado')

if old2 in content:
    content = content.replace(old2, new2)
    replacements += 1
    print(f'OK Reemplazo 2: comentario inline actualizado')

if old3 in content:
    content = content.replace(old3, new3)
    replacements += 1
    print(f'OK Reemplazo 3: array actualizado')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'\nTotal de reemplazos: {replacements}/3')
