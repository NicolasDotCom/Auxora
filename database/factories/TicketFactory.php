<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Support;
use App\Models\Ticket;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Ticket>
 */
class TicketFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    protected $model = Ticket::class;

    public function definition(): array
    {
        return [
            'customer_id' => Customer::query()->exists()
                ? Customer::query()->inRandomOrder()->first()->id
                : Customer::factory(),
            'support_id' => Support::query()->exists()
                ? Support::query()->inRandomOrder()->first()->id
                : Support::factory(),
            'description' => $this->faker->sentence,
            'phone' => $this->faker->phoneNumber,
            'address' => $this->faker->address,
            'brand' => $this->faker->company,
            'model' => $this->faker->word . ' ' . $this->faker->randomNumber(4),
            'serial' => strtoupper($this->faker->bothify('??###??###')),
            'status' => $this->faker->randomElement(['Open', 'In Progress', 'Closed']),
        ];


        /* $customer = Customer::factory()->create();
        $support = Support::factory()->create();

        return [
            'customer_id' => $customer->id,
            'support_id' => $support->id,
            'description' => $this->faker->sentence,
            'status' => $this->faker->randomElement(['Open', 'In Progress', 'Closed']),
        ]; */
    }
}
