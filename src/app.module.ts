import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { RedisModule } from './common/redis/redis.module';
import { DatabaseModule } from './common/config/database.module';
import { AppConfigModule } from './common/config/config.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import { winstonLogger } from './common/interceptors/winston-logger.config';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { UsersModule } from './modules/users/user.module';

@Module({
  imports: [
    WinstonModule.forRoot({
      instance: winstonLogger,
    }),
    ScheduleModule.forRoot(),
    AppConfigModule,
    DatabaseModule,
    RedisModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})

export class AppModule {}