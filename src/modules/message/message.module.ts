import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './schemas/message.schema';
import { MessageRepository } from './repositories/message.repository';
import { MessageService } from './message.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: Message.name,
                schema: MessageSchema,
            },
        ]),
    ],
    providers: [MessageRepository, MessageService],
    exports: [MessageService, MessageRepository],
})
export class MessageModule {}