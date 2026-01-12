import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import { Update, User, UserFromGetMe } from 'telegraf/types';

@Injectable()
export class TelegramBotService implements OnModuleInit {
    private readonly logger = new Logger(TelegramBotService.name);
    private readonly botToken: string;
    private readonly webhookUrl: string;
    
    public bot: Telegraf;
    public botInfo: UserFromGetMe | undefined;
    public chat: number;

    constructor(private readonly configService: ConfigService) {
        this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN', '');
        this.webhookUrl = this.configService.get<string>('TELEGRAM_WEBHOOK_URL', '');
        this.chat = this.configService.get<number>('TELEGRAM_CHAT', 0);

        if (!this.botToken || this.chat === 0) {
            throw new Error('TELEGRAM_BOT_TOKEN is not configured');
        }

        this.bot = new Telegraf(this.botToken);
    }

    async onModuleInit(): Promise<void> {
        try {
            if (this.webhookUrl) {
                this.logger.log(`Webhook set to: ${this.webhookUrl}`);
            } else {
                this.logger.warn('TELEGRAM_WEBHOOK_URL not configured - webhook not set');
            }

            // Get bot info
            const botInfo = await this.bot.telegram.getMe();
            this.botInfo = botInfo;
        } catch (error) {
            this.logger.error('Failed to initialize Telegram bot', error);
            throw error;
        }
    }

    async setWebhook(url: string): Promise<void> {
        try {
            await this.bot.telegram.setWebhook(url, {
                drop_pending_updates: false,
                max_connections: 100,
            });
            this.logger.log(`Webhook successfully set to: ${url}`);
        } catch (error) {
            this.logger.error('Failed to set webhook', error);
            throw error;
        }
    }

    async deleteWebhook(): Promise<void> {
        try {
            await this.bot.telegram.deleteWebhook({ drop_pending_updates: false });
            this.logger.log('Webhook deleted');
        } catch (error) {
            this.logger.error('Failed to delete webhook', error);
            throw error;
        }
    }

    async getWebhookInfo(): Promise<unknown> {
        try {
            return await this.bot.telegram.getWebhookInfo();
        } catch (error) {
            this.logger.error('Failed to get webhook info', error);
            throw error;
        }
    }

    async handleUpdate(update: Update): Promise<void> {
        try {
            await this.bot.handleUpdate(update);
        } catch (error) {
            this.logger.error('Error handling update in bot', error);
            throw error;
        }
    }

    async getBot(): Promise<Telegraf> {
        return this.bot;
    }


    async sendMessage(chatId: number, text: string): Promise<void> {
        try {
            await this.bot.telegram.sendMessage(chatId, text);
        } catch (error) {
            this.logger.error(`Failed to send message to chatId ${chatId}`, error);
            throw error;
        }
    }
}