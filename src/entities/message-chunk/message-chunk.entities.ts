import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MongoSchema } from '@utils/classes/schema.classes';
import { SchemaTypes, Document } from 'mongoose';
import { User, userSchema } from '@entities-user/user.entities';

export type MessageChunkDocument = MessageChunk & Document;

@Schema({ timestamps: true, versionKey: false, collection: 'message_chunks' })
export class MessageChunk extends MongoSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Message', required: true, index: true })
  messageId: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: Number, required: true })
  sequence: number;

  @Prop({ type: Number, default: 0 })
  tokenCount: number;
}

export const messageChunkSchema = SchemaFactory.createForClass(MessageChunk);
export const messageChunkModel = MongooseModule.forFeature([
  { name: MessageChunk.name, schema: messageChunkSchema },
]);

// Add compound index
messageChunkSchema.index({ messageId: 1, sequence: 1 });

