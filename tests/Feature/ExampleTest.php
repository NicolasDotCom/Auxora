<?php

test('la raiz redirige al login', function () {
    /** @var \Tests\TestCase $this */
    $response = $this->get('/');

    $response->assertRedirect('/login');
});

