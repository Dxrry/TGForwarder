import { Injectable, Logger } from '@nestjs/common';
import { Message, Update, UserFromGetMe } from 'telegraf/types';
import { UserService } from '../user/user.service';
import { MessageService } from '../message/message.service';
import { TelegramBotService } from "./telegram-bot.service";
import { Context } from 'telegraf';

@Injectable()
export class TelegramService {
    private readonly logger = new Logger(TelegramService.name);

    constructor(
        private readonly telegramBotService: TelegramBotService,
        private readonly userService: UserService,
        private readonly messageService: MessageService,
    ) {}

    async handleIncomingMessage(update: Update.MessageUpdate): Promise<void> {
        try {
            const chatId = update.message.chat?.id;
            const messageId = update.message?.message_id;

            const botInfo: UserFromGetMe | undefined = this.telegramBotService.botInfo;
            if (botInfo === undefined) {
                return;
            }

            const ctx = new Context(update, this.telegramBotService.bot.telegram, botInfo);

            if (!chatId || !messageId) {
                this.logger.warn('Received update without chat ID or message ID', {
                    updateId: update.update_id,
                });
                return;
            }

            this.logger.debug(`Processing message: chatId=${chatId}, messageId=${messageId}`);
            const isRegistered = await this.userService.isRegistered(chatId);

            if (!isRegistered) {
                await this.handleNewUser(ctx, chatId, messageId);
            } else {
                await this.handleExistingUser(ctx, chatId, messageId);
            }

            await this.handleMessage(update);

            this.logger.log(
                `Successfully processed message: chatId=${chatId}, messageId=${messageId}, newUser=${!isRegistered}`,
            );
        } catch (error) {
            this.logger.error('Error handling incoming message', error);
            throw error;
        }
    }

    private async handleNewUser(ctx: Context<Update.MessageUpdate<Message>>, chatId: number, messageId: number): Promise<void> {
        try {
            const thread = await ctx.telegram.createForumTopic(
                this.telegramBotService.chat,
                ctx.message?.from.last_name
                    ? `${ctx.message.from.first_name} ${ctx.message.from.last_name}`
                    : ctx.message?.from.first_name ?? ""
            )
            const { user, isNewUser } = await this.userService.registerUser(chatId, thread.message_thread_id);
            const forwardMessage = await ctx.copyMessage(this.telegramBotService.chat, {
                message_thread_id: thread.message_thread_id
            });
            
            await this.messageService.createMessage(user._id, messageId, forwardMessage.message_id);

            this.logger.log(
                `New user flow completed: chatId=${chatId}, userId=${user._id}, actuallyNew=${isNewUser}`,
            );
        } catch (error) {
            this.logger.error(`Error in new user flow for chatId ${chatId}`, error);
            throw error;
        }
    }

    private async handleExistingUser(ctx: Context<Update.MessageUpdate<Message>>, chatId: number, messageId: number): Promise<void> {
        try {
            const user = await this.userService.findByChatId(chatId);

            if (!user) {
                this.logger.warn(
                    `User disappeared between registration check and retrieval: chatId=${chatId}`,
                );
                await this.handleNewUser(ctx, chatId, messageId);
                return;
            }

            const forwardMessage = await ctx.copyMessage(this.telegramBotService.chat, {
                message_thread_id: user.thread
            });
            
            await this.messageService.createMessage(user._id, messageId, forwardMessage.message_id);

            this.logger.debug(
                `Existing user flow completed: chatId=${chatId}, userId=${user._id}`,
            );
        } catch (error) {
            this.logger.error(`Error in existing user flow for chatId ${chatId}`, error);
            throw error;
        }
    }

    async handleMessage(update: Update.MessageUpdate): Promise<void> {
        try {
            

            
            // console.log(await ctx.reply("Fuck"));
            this.logger.debug(`Received update: ${update.update_id}`);
        } catch (error) {
            this.logger.error(`Error handling update ${update.update_id}`, error);
            throw error;
        }
    }
}