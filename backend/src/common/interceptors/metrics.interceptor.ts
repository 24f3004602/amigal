import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Counter, Histogram } from 'prom-client';

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

const wsConnectionsTotal = new Counter({
  name: 'ws_connections_total',
  help: 'Total WebSocket connections',
  labelNames: ['namespace', 'event'],
});

const wsMessagesTotal = new Counter({
  name: 'ws_messages_total',
  help: 'Total WebSocket messages',
  labelNames: ['namespace', 'event'],
});

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.recordMetrics(request, start, 200),
        error: (err) => this.recordMetrics(request, start, err.status || 500),
      }),
    );
  }

  private recordMetrics(request: any, start: number, statusCode: number) {
    const duration = (Date.now() - start) / 1000;
    const route = request.route?.path || 'unknown';
    const method = request.method;

    httpRequestsTotal.inc({ method, route, status_code: statusCode.toString() });
    httpRequestDuration.observe({ method, route, status_code: statusCode.toString() }, duration);
  }
}

export { wsConnectionsTotal, wsMessagesTotal };
