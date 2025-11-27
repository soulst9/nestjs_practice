import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { morganConfig } from './common/interceptors/winston-logger.config';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import { ConfigService } from '@nestjs/config';
import { winstonLogger } from './common/interceptors/winston-logger.config';

async function bootstrap() {
  try {
    winstonLogger.info('Starting server...');
    winstonLogger.info(`Timezone: ${process.env.TZ || 'System default'}`);

    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'], // 임시로 기본 로거 활성화
    });

    const configService = app.get(ConfigService);
    const corsWhiteList = configService.get<string>("CORS_WHITE_LIST") || "http://localhost";
    app.enableCors({
      origin: corsWhiteList.split(","),
      credentials: true,
      preflightContinue: false,
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    });


    app.use(cookieParser());
    app.use(helmet());
    app.use(compression());

    app.setGlobalPrefix('api/v1');
    // app.setGlobalPrefix('api');

    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map(error => ({
          field: error.property,
          constraints: error.constraints,
          value: error.value,
        }));
        winstonLogger.error('Validation failed', { errors: messages });
        return new Error(`Validation failed: ${JSON.stringify(messages)}`);
      },
    }));

    app.use(morgan(morganConfig.format, { stream: morganConfig.stream }));
    
    setupSwagger(app);

    const port = configService.get<number>('PORT') || 3000;
    winstonLogger.info(`Server is running on port ${port}`);
    await app.listen(port);
  } catch (error) {
    winstonLogger.error('Failed to start server:', error);
    process.exit(1);
  }
}
bootstrap();