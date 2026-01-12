import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from '../schemas/message.schema';

@Injectable()
export class MessageRepository {
    private readonly logger = new Logger(MessageRepository.name);

    constructor(
        @InjectModel(Message.name)
        private readonly messageModel: Model<MessageDocument>,
    ) {}

    async createMessage(
        identifier: Types.ObjectId,
        messageId: number,
        forwardId: number,
    ): Promise<MessageDocument> {
        try {
            const message = new this.messageModel({
                identifier,
                message: messageId,
                forward: forwardId,
            });

            return await message.save();
        } catch (error) {
            this.logger.error(
                `Failed to create message for identifier ${identifier}, messageId ${messageId}`,
                error,
            );
            throw error;
        }
    }

    async bulkCreateMessages(
        messages: Array<{
            identifier: Types.ObjectId;
            message: number;
            forward: number;
        }>,
    ): Promise<MessageDocument[]> {
        try {
            return await this.messageModel.insertMany(messages, {
                ordered: false,
            });
        } catch (error) {
            this.logger.error('Failed to bulk create messages', error);
            throw error;
        }
    }

    async findMessageByForward(identifier: Types.ObjectId, forward: number): Promise<Message | null> {
        return this.messageModel
            .findOne({ identifier, forward })
            .limit(1)
            .exec();
    }

    async findForwardByMessage(identifier: Types.ObjectId, message: number): Promise<Message | null> {
        return this.messageModel
            .findOne({ identifier, message })
            .limit(1)
            .exec();
    }

    async findMessagesByIdentifier(
        identifier: Types.ObjectId,
        limit: number = 100,
        skip: number = 0,
    ): Promise<Message[]> {
        return this.messageModel
            .find({ identifier })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .lean<Message[]>()
            .exec();
    }



    async countMessagesByIdentifier(identifier: Types.ObjectId): Promise<number> {
        try {
            return await this.messageModel.countDocuments({ identifier }).exec();
        } catch (error) {
            this.logger.error(`Failed to count messages for identifier ${identifier}`, error);
            throw error;
        }
    }

    async findMessageById(
        messageId: Types.ObjectId,
    ): Promise<Message | null> {
        try {
            return await this.messageModel
                .findById(messageId)
                .lean<Message>()
                .exec();
        } catch (error) {
            this.logger.error(
                `Failed to find message by ID ${messageId}`,
                error,
            );
            throw error;
        }
    }


    async deleteMessagesByIdentifier(identifier: Types.ObjectId): Promise<number> {
        try {
            const result = await this.messageModel.deleteMany({ identifier }).exec();
            return result.deletedCount || 0;
        } catch (error) {
            this.logger.error(`Failed to delete messages for identifier ${identifier}`, error);
            throw error;
        }
    }
}