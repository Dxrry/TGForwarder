import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
    const logger = new Logger('Bootstrap');

    try {
        const app = await NestFactory.create(AppModule, {
            logger: ['error', 'warn', 'log', 'debug', 'verbose'],
            cors: false,
        });
        const configService = app.get(ConfigService);

        app.useGlobalPipes(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: false,
                transformOptions: {
                    enableImplicitConversion: true,
                },
            }),
        );
        
        app.getHttpAdapter().getInstance().disable('x-powered-by');
        await app.listen(process.env.PORT ?? 3000);

        logger.log(`Telegram webhook path: ${configService.get<string>('TELEGRAM_WEBHOOK_PATH', '/telegramWebhook')}`);
    } catch (error) {
        logger.error('Failed to start application', error);
        process.exit(1);
    }
}

bootstrap();