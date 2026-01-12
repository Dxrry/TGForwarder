import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { MessageRepository } from './repositories/message.repository';
import { Message, MessageDocument } from './schemas/message.schema';

@Injectable()
export class MessageService {
    private readonly logger = new Logger(MessageService.name);
    private readonly defaultForwardId: number;

    constructor(
        private readonly messageRepository: MessageRepository,
        private readonly configService: ConfigService,
    ) {
        this.defaultForwardId = this.configService.get<number>('DEFAULT_FORWARD_ID', 2);
    }

    async createMessage(
        identifier: Types.ObjectId, messageId: number, forward: number,
    ): Promise<MessageDocument> {
        try {
            const message = await this.messageRepository.createMessage(
                identifier,
                messageId,
                forward,
            );

            this.logger.debug(
                `Message created: identifier=${identifier}, messageId=${messageId}, forward=${forward}`,
            );

            return message;
        } catch (error) {
            this.logger.error(
                `Error creating message for identifier ${identifier}, messageId ${messageId}`,
                error,
            );
            throw error;
        }
    }

    async createMessageWithCustomForward(
        identifier: Types.ObjectId,
        messageId: number,
        forwardId: number,
    ): Promise<MessageDocument> {
        try {
            const message = await this.messageRepository.createMessage(
                identifier,
                messageId,
                forwardId,
            );

            this.logger.debug(
                `Message created with custom forward: identifier=${identifier}, messageId=${messageId}, forward=${forwardId}`,
            );

            return message;
        } catch (error) {
            this.logger.error(
                `Error creating message with custom forward for identifier ${identifier}`,
                error,
            );
            throw error;
        }
    }

    async bulkCreateMessages(
        messages: Array<{
            identifier: Types.ObjectId;
            messageId: number;
            forwardId?: number;
        }>,
    ): Promise<MessageDocument[]> {
        try {
            const messagesWithDefaults = messages.map(msg => ({
                identifier: msg.identifier,
                message: msg.messageId,
                forward: msg.forwardId ?? this.defaultForwardId,
            }));

            const createdMessages = await this.messageRepository.bulkCreateMessages(
                messagesWithDefaults,
            );

            this.logger.log(`Bulk created ${createdMessages.length} messages`);

            return createdMessages;
        } catch (error) {
            this.logger.error('Error bulk creating messages', error);
            throw error;
        }
    }

    async getMessagesByIdentifier(
        identifier: Types.ObjectId,
        limit: number = 100,
        skip: number = 0,
    ): Promise<Message[]> {
        try {
            return await this.messageRepository.findMessagesByIdentifier(
                identifier,
                limit,
                skip,
            );
        } catch (error) {
            this.logger.error(
                `Error getting messages for identifier ${identifier}`,
                error,
            );
            throw error;
        }
    }

    async getMessageByForward(identifier: Types.ObjectId, forward: number): Promise<Message | null> {
        try {
            return await this.messageRepository.findMessageByForward(identifier, forward);
        } catch (error) {
            this.logger.error(
                `Error getting messages for identifier ${identifier}`,
                error,
            );
            throw error;
        }
    }

    async getForwardByMessage(identifier: Types.ObjectId, message: number): Promise<Message | null> {
        try {
            return await this.messageRepository.findForwardByMessage(identifier, message);
        } catch (error) {
            this.logger.error(
                `Error getting messages for identifier ${identifier}`,
                error,
            );
            throw error;
        }
    }


    async countMessages(identifier: Types.ObjectId): Promise<number> {
        try {
            return await this.messageRepository.countMessagesByIdentifier(identifier);
        } catch (error) {
            this.logger.error(`Error counting messages for identifier ${identifier}`, error);
            throw error;
        }
    }

    async deleteMessagesByIdentifier(identifier: Types.ObjectId): Promise<number> {
        try {
            const deletedCount = await this.messageRepository.deleteMessagesByIdentifier(identifier);
            
            this.logger.log(`Deleted ${deletedCount} messages for identifier ${identifier}`);

            return deletedCount;
        } catch (error) {
            this.logger.error(`Error deleting messages for identifier ${identifier}`, error);
            throw error;
        }
    }
}