<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Server Side Rendering
    |--------------------------------------------------------------------------
    |
    | These options configures if and how Inertia uses Server Side Rendering
    | to pre-render each initial request made to your application's pages
    | so that server rendered HTML is delivered for the user's browser.
    |
    | See: https://inertiajs.com/server-side-rendering
    |
    */

    'ssr' => [
        'enabled' => true,
        'url' => 'http://127.0.0.1:13714',
        // 'bundle' => base_path('bootstrap/ssr/ssr.mjs'),

    ],

    /*
    |--------------------------------------------------------------------------
    | Pages
    |--------------------------------------------------------------------------
    |
    | Page-related settings, including path resolution and extensions used to
    | locate Inertia components on the filesystem. The `pages.paths` array
    | defines where Inertia will look for components, and `pages.extensions`
    | defines the file extensions to search for.
    |
    */

    'pages' => [

        'ensure_pages_exist' => true,

        'paths' => [
            resource_path('js/pages'),
        ],

        'extensions' => [
            'js',
            'jsx',
            'svelte',
            'ts',
            'tsx',
            'vue',
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Testing
    |--------------------------------------------------------------------------
    |
    | Whether Inertia should ensure that pages referenced by responses exist
    | on disk during automated testing. Defaults to true.
    |
    */

    'testing' => [
        'ensure_pages_exist' => true,
    ],

];
