# -*- coding: utf-8 -*-
import os

files = [
    r'c:\laragon\www\ticket_tes\resources\views\exports\ranking-pdf.blade.php',
    r'c:\laragon\www\ticket_tes\resources\js\pages\Analytics\Technicians.tsx',
]
old = 'Sab 09:00-13:00'
new = 'Sab 08:00-10:00'
for f in files:
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        has_old = old in content
        has_new = new in content
        print(f'{os.path.basename(f)}')
        print(f'  Contiene "{old}": {has_old}')
        print(f'  Contiene "{new}": {has_new}')
        print()
