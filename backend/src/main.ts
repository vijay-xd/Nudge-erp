import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  const corsOrigins = (configService.get<string>('CORS_ORIGINS') || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim());

  // Security headers
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // REST API v1 prefix
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  // Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Nudge ERP API')
    .setDescription(
      'Enterprise Distribution & ERP API for FMCG, Modern Trade, and Quick-Commerce Fulfillment',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Nudge ERP API Documentation',
  });

  await app.listen(port);
  logger.log(`Nudge ERP backend server running on http://localhost:${port}/api/v1`);
  logger.log(`Swagger OpenAPI documentation available at http://localhost:${port}/api/docs`);
}

await bootstrap();
