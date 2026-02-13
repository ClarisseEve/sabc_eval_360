<?php

return [
    'tracing' => [
        'enabled' => (bool) env('JAEGER_ENABLED', false),
        'service_name' => env('JAEGER_SERVICE_NAME', env('APP_NAME', 'laravel-app')),
        'agent_host' => env('JAEGER_AGENT_HOST', 'jaeger'),
        'agent_port' => (int) env('JAEGER_AGENT_PORT', 6831),
        'sampler_type' => env('JAEGER_SAMPLER_TYPE', 'const'),
        'sampler_param' => (float) env('JAEGER_SAMPLER_PARAM', 1),
        'log_spans' => (bool) env('JAEGER_LOG_SPANS', false),
    ],
];
