import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../user/schemas/user.schema';

export type MessageDocument = Message & Document;

@Schema({
    collection: 'messages',
    timestamps: true,
    versionKey: false,
})
export class Message {
    _id: Types.ObjectId | undefined;

    @Prop({
        type: Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    })
    identifier: Types.ObjectId | undefined;

    @Prop({
        type: Number,
        required: true,
    })
    message: number | undefined;

    @Prop({
        type: Number,
        required: true,
        default: 2,
    })
    forward: number | undefined;

    createdAt?: Date;
    updatedAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Compound index for efficient querying by identifier and message
MessageSchema.index({ identifier: 1, message: 1 }, { background: true });
MessageSchema.index({ identifier: 1, createdAt: -1 }, { background: true });

// Ensure indexes are created on startup
MessageSchema.set('autoIndex', true);