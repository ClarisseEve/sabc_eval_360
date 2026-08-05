import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  // The API is reached through exactly one in-repo reverse proxy (web or API gateway).
  // This lets Express derive req.ip safely without trusting an arbitrary XFF chain.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new RequestLoggingInterceptor());
  app.enableCors({
    origin: (process.env.FRONTEND_URL || 'http://localhost:5173')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    credentials: true,
  });
  // Sans cela, les onModuleDestroy (pool PostgreSQL, client Redis) ne sont
  // jamais appelés et les arrêts de conteneur laissent des connexions ouvertes.
  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`API running on http://localhost:${port}/api`);
  logger.log(`Health check: http://localhost:${port}/api/health`);
}
bootstrap();
