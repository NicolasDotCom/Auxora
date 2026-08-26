<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class UpdateUserNames extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:update-names';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Actualizar nombres de usuarios basándose en name_user del customer';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $users = \App\Models\User::all();
        $updated = 0;

        foreach ($users as $user) {
            $customer = \App\Models\Customer::where('email', $user->email)->first();
            
            if ($customer && $customer->name_user) {
                $user->name = $customer->name_user;
                $user->save();
                
                $this->info("Usuario #{$user->id} actualizado: {$user->email} -> {$customer->name_user}");
                $updated++;
            }
        }

        $this->info("Total de usuarios actualizados: {$updated}");
    }
}
