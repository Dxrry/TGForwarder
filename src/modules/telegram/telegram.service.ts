import { Injectable, Logger, Type } from '@nestjs/common';
import { CommonMessageBundle, Message, Update, UserFromGetMe } from 'telegraf/types';
import { Context } from 'telegraf';
import { ExtraCopyMessage } from 'telegraf/typings/telegram-types';
import { UserService } from '../user/user.service';
import { MessageService } from '../message/message.service';
import { TelegramBotService } from './telegram-bot.service';
import { Types } from 'mongoose';

type CopyOptions = Partial<ExtraCopyMessage> & { reply_parameters?: { message_id: number } };

@Injectable()
export class TelegramService {
    private readonly logger = new Logger(TelegramService.name);

    constructor(
        private readonly telegramBotService: TelegramBotService,
        private readonly userService: UserService,
        private readonly messageService: MessageService,
    ) {}

    async handleIncomingMessage(update: Update.MessageUpdate<CommonMessageBundle>): Promise<void> {
        const chatId = update.message?.chat?.id;
        const messageId = update.message?.message_id;

        if (!chatId || !messageId) {
            this.logger.warn('Missing chatId or messageId', { updateId: update.update_id });
            return;
        }

        const botInfo: UserFromGetMe | undefined = this.telegramBotService.botInfo;
        if (!botInfo) {
            this.logger.warn('Bot info not available; skipping update', { updateId: update.update_id });
            return;
        }

        const ctx = new Context(update as any, this.telegramBotService.bot.telegram, botInfo);

        try {
            if (update.message.chat.type === 'private') {
                this.logger.debug(`Private message received: chat=${chatId} msg=${messageId}`);
                const isRegistered = await this.userService.isRegistered(chatId);
                if (!isRegistered) {
                    await this.handleNewUser(ctx, chatId);
                } else {
                    await this.handleExistingUser(ctx, chatId);
                }
                await this.handleMessage(ctx, update);
                this.logger.log(`Processed private message: chat=${chatId} msg=${messageId} newUser=${!isRegistered}`);
                return;
            }

            if (String(update.message.chat.id) === String(this.telegramBotService.chat)) {
                await this.handleMessageChat(ctx, update);
                return;
            }
        } catch (err) {
            this.logger.error('Error processing incoming message', err);
            throw err;
        }
    }

    private async handleNewUser(ctx: Context, chatId: number): Promise<void> {
        try {
            const createRes = await ctx.telegram.createForumTopic(
                this.telegramBotService.chat,
                this.safeFullName(ctx.message as Message)
            );

            const threadId = (createRes as any)?.message_thread_id;
            const { user, isNewUser } = await this.userService.registerUser(chatId, threadId);
            this.logger.log(`Registered new user: chat=${chatId} userId=${user._id} actuallyNew=${isNewUser}`);
        } catch (err) {
            this.logger.error(`Error in new user flow for chat ${chatId}`, err);
            throw err;
        }
    }

    private async handleExistingUser(ctx: Context, chatId: number): Promise<void> {
        try {
            const user = await this.userService.findByChatId(chatId);
            if (!user) {
                this.logger.warn(`User missing after registration check; creating new. chat=${chatId}`);
                await this.handleNewUser(ctx, chatId);
                return;
            }
            this.logger.debug(`Existing user found: chat=${chatId} userId=${user._id}`);
        } catch (err) {
            this.logger.error(`Error in existing user flow for chat ${chatId}`, err);
            throw err;
        }
    }

    async handleMessageChat(ctx: Context, update: Update.MessageUpdate<CommonMessageBundle>): Promise<void> {
        try {
            if (!update.message.is_topic_message || update.message.message_thread_id === undefined) return;

            const user = await this.userService.findByThreadId(update.message.message_thread_id);
            if (!user?.chat) return;

            const isMessageForward: boolean = !!update.message?.forward_origin;

            const options = await this.buildCopyOptionsFromReply(user._id, update);
            const forwardMessage = isMessageForward ?
                await ctx.forwardMessage(user.chat) :
                await ctx.copyMessage(user.chat, options as any);

            await this.messageService.createMessage(user._id, update.message.message_id, forwardMessage.message_id);
            
            this.logger.debug(`Copied topic message to user chat=${user.chat} update=${update.update_id}`);
        } catch (err) {
            this.logger.error(`Error handling chat update ${update.update_id}`, err);
            throw err;
        }
    }

    async handleMessage(ctx: Context, update: Update.MessageUpdate<CommonMessageBundle>): Promise<void> {
        try {
            const chatId = update.message.chat?.id;
            const user = chatId ? await this.userService.findByChatId(chatId) : null;
            if (!user) return;

            const isMessageForward: boolean = !!update.message?.forward_origin;

            const options = await this.buildCopyOptionsFromReply(user._id, update);
            options.message_thread_id = user.thread;

            const forwardMessage = isMessageForward ?
                await ctx.forwardMessage(this.telegramBotService.chat, { message_thread_id: user.thread }) :
                await ctx.copyMessage(this.telegramBotService.chat, options as any);

            await this.messageService.createMessage(user._id, update.message.message_id, forwardMessage.message_id);

            this.logger.debug(`Copied user message into forum chat=${this.telegramBotService.chat} update=${update.update_id}`);
        } catch (err) {
            this.logger.error(`Error handling message ${update.update_id}`, err);
            throw err;
        }
    }

    private async buildCopyOptionsFromReply(userId: Types.ObjectId, update: Update.MessageUpdate<CommonMessageBundle>): Promise<CopyOptions> {
        const options: CopyOptions = {};
        if (update.message?.reply_to_message?.message_id && update.message.reply_to_message.from) {
            const isSelfReply: boolean = (update.message.reply_to_message.from.id === update.message.from.id);

            const msg = isSelfReply ?
                await this.messageService.getForwardByMessage(userId, update.message.reply_to_message.message_id) :
                await this.messageService.getMessageByForward(userId, update.message.reply_to_message.message_id);

            const replyMessageId = isSelfReply ? msg?.forward : msg?.message;
            if (replyMessageId) {
                options.reply_parameters = { message_id: replyMessageId };
            }
        }
        return options;
    }

    private safeFullName(msg?: Message): string {
        const first = msg?.from?.first_name ?? '';
        const last = msg?.from?.last_name ?? '';
        return `${first}${last ? ' ' + last : ''}`.trim();
    }
}