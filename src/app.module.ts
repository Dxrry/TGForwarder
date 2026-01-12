import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TelegramModule } from './modules/telegram/telegram.module';
import { UserModule } from './modules/user/user.module';
import { MessageModule } from './modules/message/message.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', '.env.local'],
            cache: true,
        }),

        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                uri: configService.get<string>('MONGODB_URI', 'mongodb://localhost:27017/telegram_bot'),
                connectionFactory: (connection) => {
                    connection.on('connected', () => {
                        console.log('MongoDB connected successfully');
                    });
                    connection.on('error', (error: any) => {
                        console.error('MongoDB connection error:', error);
                    });
                    connection.on('disconnected', () => {
                        console.log('MongoDB disconnected');
                    });
                    return connection;
                },
                maxPoolSize: configService.get<number>('MONGODB_POOL_SIZE', 10),
                minPoolSize: 2,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                family: 4,

                autoIndex: true,
                autoCreate: true,
            }),
        }),

        TelegramModule,
        UserModule,
        MessageModule,
    ],
})
export class AppModule {}