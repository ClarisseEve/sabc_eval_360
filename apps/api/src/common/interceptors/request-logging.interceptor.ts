import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<any>();
    const method = req.method;
    const url = req.originalUrl || req.url;
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startedAt;
          const matricule = req.user?.matricule || 'anonymous';
          const statusCode = http.getResponse<any>()?.statusCode ?? 200;
          this.logger.log(`${method} ${url} ${statusCode} ${duration}ms matricule=${matricule}`);
        },
        error: (error: any) => {
          const duration = Date.now() - startedAt;
          const matricule = req.user?.matricule || 'anonymous';
          const statusCode = error?.status || 500;
          this.logger.warn(`${method} ${url} ${statusCode} ${duration}ms matricule=${matricule}`);
        },
      }),
    );
  }
}
