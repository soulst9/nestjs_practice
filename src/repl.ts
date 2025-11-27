import { Logger as NestLogger } from '@nestjs/common';
import { repl } from '@nestjs/core';

import { AppModule } from './app.module';

/**
 * https://docs.nestjs.com/recipes/repl
 * REPL 시작
 */
async function bootstrap(): Promise<void> {
    await repl(AppModule);
}

(async (): Promise<void> => {
    try {
        await bootstrap();
        NestLogger.log('Repl started');
    } catch (error) {
        NestLogger.error(error, 'Repl Bootstrap');
    }
})();