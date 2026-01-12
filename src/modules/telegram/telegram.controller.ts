import { Body, Controller, Get, Post, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { Message, Update } from 'telegraf/types';
import { TelegramService } from './telegram.service';

interface SelfWebhookResponse {
    message: string;
}

@Controller()
export class TelegramController {
    private readonly logger = new Logger(TelegramController.name);

    constructor(private readonly telegramService: TelegramService) {}

    @Post('telegramWebhook')
    @HttpCode(HttpStatus.OK)
    async handleWebhook(@Body() update: Update.MessageUpdate): Promise<void> {
        try {
            await this.telegramService.handleIncomingMessage(update);
        } catch (error) {
            this.logger.error('Error processing webhook', error);
        }
    }

    @Get('selfWebhook')
    @HttpCode(HttpStatus.OK)
    getSelfWebhook(): SelfWebhookResponse {
        this.logger.debug('Self webhook test endpoint called');
        return {
            message: 'hello world',
        };
    }
}