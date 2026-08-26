<?php

// El registro publico esta deshabilitado en este proyecto.
// Los usuarios se crean unicamente por un administrador desde el panel de gestion.

test('registration screen is not publicly accessible', function () {
    /** @var \Tests\TestCase $this */
    $response = $this->get('/register');

    // La ruta no existe, redirige al login
    $response->assertStatus(302);
});
