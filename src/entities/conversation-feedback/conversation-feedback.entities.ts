import { MongooseModule, Prop as MProp, Schema as MSchema, SchemaFactory as MSchemaFactory } from '@nestjs/mongoose';
import { MongoSchema } from '@utils/classes/schema.classes';
import { SchemaTypes, Document as MongooseDocument } from 'mongoose';
import {
  Conversation,
  conversationSchema,
} from '../conversation/conversation.entities';

export type ConversationFeedbackDocument = ConversationFeedback & MongooseDocument;

export enum FeedbackType {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
}

@MSchema({ timestamps: true, versionKey: false, collection: 'conversation_feedbacks' })
export class ConversationFeedback extends MongoSchema {
  @MProp({ type: SchemaTypes.ObjectId, ref: 'Message', required: true })
  messageId: string;

  @MProp({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  userId: string;

  @MProp({ type: String, enum: Object.values(FeedbackType), required: true })
  feedbackType: FeedbackType;

  @MProp({ type: String, default: null })
  comment: string;
}

export const conversationFeedbackSchema = MSchemaFactory.createForClass(ConversationFeedback);
export const conversationFeedbackModel = MongooseModule.forFeature([
  { name: ConversationFeedback.name, schema: conversationFeedbackSchema },
]);
// Add unique compound index
conversationFeedbackSchema.index({ messageId: 1, userId: 1 }, { unique: true });
