<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use OpenTracing\Formats;
use OpenTracing\GlobalTracer;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to create a tracing span per request.
 */
class TraceRequests
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!config('observability.tracing.enabled', false)) {
            return $next($request);
        }

        if ($request->path() === 'metrics') {
            return $next($request);
        }

        try {
            $tracer = GlobalTracer::get();
            $carrier = [];
            foreach ($request->headers->all() as $key => $values) {
                $carrier[$key] = implode(',', $values);
            }

            $parentContext = null;
            try {
                $parentContext = $tracer->extract(Formats::HTTP_HEADERS, $carrier);
            } catch (\Throwable $e) {
                $parentContext = null;
            }

            $spanName = $request->method() . ' ' . $request->path();
            $scope = $tracer->startActiveSpan($spanName, $parentContext ? ['child_of' => $parentContext] : []);
            $span = $scope->getSpan();

            $span->setTag('span.kind', 'server');
            $span->setTag('http.method', $request->method());
            $span->setTag('http.url', $request->fullUrl());
            if ($request->route()) {
                $span->setTag('http.route', $request->route()->uri());
            }

            app()->instance('tracing.span', $span);

            try {
                $response = $next($request);
            } finally {
                app()->forgetInstance('tracing.span');
            }

            $statusCode = $response->getStatusCode();
            $span->setTag('http.status_code', $statusCode);
            if ($statusCode >= 500) {
                $span->setTag('error', true);
            }

            $scope->close();

            return $response;
        } catch (\Throwable $e) {
            // Tracing unavailable, continue without it
            return $next($request);
        }
    }
}
