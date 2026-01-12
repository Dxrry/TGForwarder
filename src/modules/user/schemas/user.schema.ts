import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
    collection: 'users',
    timestamps: true,
    versionKey: false,
})
export class User {
    _id: Types.ObjectId | undefined;

    @Prop({
        type: Number,
        required: true,
        unique: true,
        index: true,
    })
    chat: number | undefined;

    @Prop({
        type: Number,
        required: true,
        default: 2,
    })
    thread: number | undefined;

    createdAt?: Date;
    updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Compound index for performance optimization
UserSchema.index({ chat: 1 }, { unique: true, background: true });

// Ensure indexes are created on startup
UserSchema.set('autoIndex', true);