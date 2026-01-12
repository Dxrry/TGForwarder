import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { UserRepository } from './repositories/user.repository';
import { UserDocument } from './schemas/user.schema';

interface UserRegistrationResult {
    user: UserDocument;
    isNewUser: boolean;
}

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);
    private readonly defaultThreadId: number;

    constructor(
        private readonly userRepository: UserRepository,
        private readonly configService: ConfigService,
    ) {
        this.defaultThreadId = this.configService.get<number>('DEFAULT_THREAD_ID', 2);
    }

    async isRegistered(chatId: number): Promise<boolean> {
        try {
            return await this.userRepository.existsByChatId(chatId);
        } catch (error) {
            this.logger.error(`Error checking registration for chatId ${chatId}`, error);
            throw error;
        }
    }

    async findByChatId(chatId: number): Promise<UserDocument | null> {
        try {
            return await this.userRepository.findByChatId(chatId);
        } catch (error) {
            this.logger.error(`Error finding user by chatId ${chatId}`, error);
            throw error;
        }
    }

    async findByThreadId(threadId: number): Promise<UserDocument | null> {
        try {
            return await this.userRepository.findByTheadId(threadId);
        } catch (error) {
            this.logger.error(`Error finding user by chatId ${threadId}`, error);
            throw error;
        }
    }
    
    async registerUser(chatId: number, threadId: number): Promise<UserRegistrationResult> {
        try {
            const { user, created } = await this.userRepository.findOrCreate(
                chatId,
                threadId,
            );

            if (created) {
                this.logger.log(`New user registered: chatId=${chatId}, userId=${user._id}`);
            } else {
                this.logger.debug(`Existing user found: chatId=${chatId}, userId=${user._id}`);
            }

            return {
                user,
                isNewUser: created,
            };
        } catch (error) {
            this.logger.error(`Error registering user for chatId ${chatId}`, error);
            throw error;
        }
    }

    async getUserById(userId: Types.ObjectId): Promise<UserDocument | null> {
        try {
            return await this.userRepository.getUserById(userId);
        } catch (error) {
            this.logger.error(`Error finding user by ID ${userId}`, error);
            throw error;
        }
    }

    async updateUserThread(chatId: number, threadId: number): Promise<UserDocument | null> {
        try {
            const user = await this.userRepository.updateThread(chatId, threadId);
            
            if (user) {
                this.logger.log(`Updated thread for chatId=${chatId} to threadId=${threadId}`);
            }

            return user;
        } catch (error) {
            this.logger.error(`Error updating thread for chatId ${chatId}`, error);
            throw error;
        }
    }
}