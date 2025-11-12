import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MongoSchema } from '@utils/classes/schema.classes';
import { SchemaTypes, Document } from 'mongoose';
import { User, userSchema } from '@entities-user/user.entities';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true, versionKey: false, collection: 'conversations' })
export class Conversation extends MongoSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, index: true })
  userId: string;

  @Prop({ type: String, default: null })
  title: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: SchemaTypes.Map, of: SchemaTypes.Mixed, default: {} })
  metadata: Map<string, any>;
}

export const conversationSchema = SchemaFactory.createForClass(Conversation);
export const conversationModel = MongooseModule.forFeature([
  { name: Conversation.name, schema: conversationSchema },
]);
// Add compound index
conversationSchema.index({ userId: 1, updatedAt: -1 });

