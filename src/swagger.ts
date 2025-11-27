import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { Logger as NestLogger } from '@nestjs/common';

export const SWAGGER_API_ROOT = 'api/docs';
export const SWAGGER_API_NAME = 'backend';
export const SWAGGER_API_DESCRIPTION = 'backend API Description';
export const SWAGGER_API_CURRENT_VERSION = '1.0';

/**
 * Swagger 설정
 * @param app 
 */
export const setupSwagger = (app: INestApplication) => {
    const swaggerConfig = new DocumentBuilder()
        .setTitle(SWAGGER_API_NAME)
        .setDescription(SWAGGER_API_DESCRIPTION)
        .setVersion(SWAGGER_API_CURRENT_VERSION)
        .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(SWAGGER_API_ROOT, app, document);
}