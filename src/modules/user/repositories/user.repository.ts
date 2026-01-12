import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UserRepository {
    private readonly logger = new Logger(UserRepository.name);

    constructor(
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
    ) {}

    async findByChatId(chatId: number): Promise<UserDocument | null> {
        return this.userModel.findOne({ chat: chatId }).exec();
    }

    async findByTheadId(threadId: number): Promise<UserDocument | null> {
        return this.userModel.findOne({ thread: threadId }).exec();
    }

    async existsByChatId(chatId: number): Promise<boolean> {
        try {
            const count = await this.userModel.countDocuments({ chat: chatId }).limit(1).exec();
            return count > 0;
        } catch (error) {
            this.logger.error(`Failed to check user existence for chatId ${chatId}`, error);
            throw error;
        }
    }

    async createUser(chatId: number, threadId: number): Promise<UserDocument> {
        try {
            const user = new this.userModel({
                chat: chatId,
                thread: threadId,
            });
            
            return await user.save();
        } catch (error) {
            // Handle duplicate key error (race condition)
            // if (error.code === 11000) {
            //     this.logger.warn(`Duplicate user creation attempt for chatId ${chatId}`);
            //     const existingUser = await this.findByChatId(chatId);
            //     if (existingUser) {
            //         return existingUser as UserDocument;
            //     }
            // }
            this.logger.error(`Failed to create user for chatId ${chatId}`, error);
            throw error;
        }
    }

    async findOrCreate(chatId: number, threadId: number): Promise<{ user: UserDocument; created: boolean }> {
        try {
            const result = await this.userModel.findOneAndUpdate(
                { chat: chatId },
                {
                    $setOnInsert: {
                        chat: chatId,
                        thread: threadId,
                    },
                },
                {
                    upsert: true,
                    new: true,
                    runValidators: true,
                },
            ).exec();

            const created = result.createdAt && result.updatedAt 
                ? result.createdAt.getTime() === result.updatedAt.getTime()
                : false;

            return { user: result, created };
        } catch (error) {
            this.logger.error(`Failed to findOrCreate user for chatId ${chatId}`, error);
            throw error;
        }
    }

    async getUserById(userId: Types.ObjectId): Promise<UserDocument | null> {
        return this.userModel.findById(userId).exec();
    }

    async updateThread(chatId: number, threadId: number): Promise<UserDocument | null> {
        try {
            return await this.userModel.findOneAndUpdate(
                { chat: chatId },
                { $set: { thread: threadId } },
                { new: true },
            ).exec();
        } catch (error) {
            this.logger.error(`Failed to update thread for chatId ${chatId}`, error);
            throw error;
        }
    }
}