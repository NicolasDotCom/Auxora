<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    /** @var \Tests\TestCase $this */
    $this->get('/dashboard')->assertRedirect('/login');
});

test('authenticated users can visit the dashboard', function () {
    /** @var \Tests\TestCase $this */
    $this->actingAs($user = User::factory()->create());

    $this->get('/dashboard')->assertOk();
});