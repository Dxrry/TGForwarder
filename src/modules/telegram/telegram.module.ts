import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { TelegramBotService } from './telegram-bot.service';
import { UserModule } from '../user/user.module';
import { MessageModule } from '../message/message.module';

@Module({
    imports: [UserModule, MessageModule],
    controllers: [TelegramController],
    providers: [TelegramService, TelegramBotService],
    exports: [TelegramService, TelegramBotService],
})
export class TelegramModule {}