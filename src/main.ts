import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
    const logger = new Logger('Bootstrap');

    try {
        // Create NestJS application
        const app = await NestFactory.create(AppModule, {
            logger: ['error', 'warn', 'log', 'debug', 'verbose'],
            cors: false,
        });

        // Get configuration service
        const configService = app.get(ConfigService);

        // Global validation pipe for DTO validation
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
        
        // Disable 'x-powered-by' header for security
        app.getHttpAdapter().getInstance().disable('x-powered-by');

        // Get port and host from environment
        const port = configService.get<number>('PORT', 3000);
        const host = configService.get<string>('APP_HOST', '0.0.0.0');

        // Start application
        await app.listen(port, host);

        logger.log(`Application is running on: http://${host}:${port}`);
        logger.log(`Environment: ${configService.get<string>('NODE_ENV', 'development')}`);
        logger.log(`Telegram webhook path: ${configService.get<string>('TELEGRAM_WEBHOOK_PATH', '/telegramWebhook')}`);
    } catch (error) {
        logger.error('Failed to start application', error);
        process.exit(1);
    }
}

bootstrap();