<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | SABC Microservices Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for internal microservices using the Strangler Pattern.
    | Each service can be enabled/disabled independently for gradual migration.
    |
    */

    'evaluation' => [
        'enabled' => env('EVALUATION_MICROSERVICE_ENABLED', false),
        'url' => env('EVALUATION_SERVICE_URL', 'http://evaluation-service:8080'),
        'grpc' => env('EVALUATION_SERVICE_GRPC', 'evaluation-service:50051'),
        'key' => env('EVALUATION_SERVICE_KEY', 'internal-service-key'),
        'timeout' => env('EVALUATION_SERVICE_TIMEOUT', 30),

        // Feature flags for gradual migration
        'features' => [
            'create_evaluation' => env('EVAL_FEATURE_CREATE', true),
            'get_evaluation' => env('EVAL_FEATURE_GET', true),
            'update_notes' => env('EVAL_FEATURE_UPDATE', true),
            'submit_evaluation' => env('EVAL_FEATURE_SUBMIT', true),
            'validate_evaluation' => env('EVAL_FEATURE_VALIDATE', true),
            'list_evaluations' => env('EVAL_FEATURE_LIST', true),
            'get_pending' => env('EVAL_FEATURE_PENDING', true),
            'get_to_validate' => env('EVAL_FEATURE_TO_VALIDATE', true),
            'get_active_periodes' => env('EVAL_FEATURE_PERIODES', true),
            'get_user_score' => env('EVAL_FEATURE_SCORE', true),
        ],
    ],

    'analytics' => [
        'enabled' => env('ANALYTICS_MICROSERVICE_ENABLED', false),
        'url' => env('ANALYTICS_SERVICE_URL', 'http://analytics-service:8080'),
        'key' => env('ANALYTICS_SERVICE_KEY', 'internal-service-key'),
        'timeout' => env('ANALYTICS_SERVICE_TIMEOUT', 60),

        // Feature flags for gradual migration
        'features' => [
            'kpis' => env('ANALYTICS_FEATURE_KPIS', true),
            'channel_mix' => env('ANALYTICS_FEATURE_CHANNELS', true),
            'trends' => env('ANALYTICS_FEATURE_TRENDS', true),
            'anomalies' => env('ANALYTICS_FEATURE_ANOMALIES', true),
            'recommendations' => env('ANALYTICS_FEATURE_RECOMMENDATIONS', true),
            'user_scores' => env('ANALYTICS_FEATURE_USER_SCORES', true),
            'regional_performance' => env('ANALYTICS_FEATURE_REGIONAL', true),
        ],

        // Cache TTLs (in seconds)
        'cache' => [
            'kpis' => env('ANALYTICS_CACHE_KPIS', 600),           // 10 minutes
            'trends' => env('ANALYTICS_CACHE_TRENDS', 1800),      // 30 minutes
            'anomalies' => env('ANALYTICS_CACHE_ANOMALIES', 300), // 5 minutes
            'recommendations' => env('ANALYTICS_CACHE_RECOMMENDATIONS', 3600), // 1 hour
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Service Discovery
    |--------------------------------------------------------------------------
    */

    'discovery' => [
        'type' => env('SERVICE_DISCOVERY_TYPE', 'static'), // static, consul, kubernetes
        'refresh_interval' => env('SERVICE_DISCOVERY_REFRESH', 60),
    ],

];
