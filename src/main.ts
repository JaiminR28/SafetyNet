import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { setupSwagger } from './swagger';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number | string>('port');
  const apiPrefix = configService.get<string>('apiPrefix') || 'api';
  const corsOrigin = configService.get<string[]>('cors.origin');

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // Swagger documentation
  if (configService.get('nodeEnv') !== 'production') {
    setupSwagger(app);
  }
  const finalPort = port ?? 3000;
  await app.listen(finalPort);

  console.log(
    `🚀 Application is running on: http://localhost:${finalPort}${apiPrefix}`,
  );
  console.log(
    `📚 Swagger docs available at: http://localhost:${finalPort}/api-docs`,
  );
}
bootstrap();
