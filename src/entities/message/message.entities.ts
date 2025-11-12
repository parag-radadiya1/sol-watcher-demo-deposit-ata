import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MongoSchema } from '@utils/classes/schema.classes';
import { SchemaTypes, Document } from 'mongoose';
import { User, userSchema } from '@entities-user/user.entities';

export type MessageDocument = Message & Document;

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export enum MessageStatus {
  PENDING = 'pending',
  STREAMING = 'streaming',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Schema({ timestamps: true, versionKey: false, collection: 'messages' })
export class Message extends MongoSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Conversation', required: true, index: true })
  conversationId: string;

  @Prop({ type: String, enum: Object.values(MessageRole), required: true })
  role: MessageRole;

  @Prop({ type: String, required: true, default: '' })
  content: string;

  @Prop({ type: String, enum: Object.values(MessageStatus), default: MessageStatus.COMPLETED })
  status: MessageStatus;

  @Prop({ type: Boolean, default: false })
  isStreaming: boolean;

  @Prop({ type: Boolean, default: false })
  streamCompleted: boolean;

  @Prop({ type: Date, default: null })
  completedAt: Date;

  @Prop({ type: Number, default: 0 })
  tokenCount: number;

  @Prop({ type: String, default: null })
  modelName: string;

  @Prop({ type: SchemaTypes.Map, of: SchemaTypes.Mixed, default: {} })
  metadata: Map<string, any>;

  @Prop({ type: String, default: null })
  errorMessage: string;
}

export const messageSchema = SchemaFactory.createForClass(Message);
export const messageModel = MongooseModule.forFeature([
  { name: Message.name, schema: messageSchema },
]);


// Add indexes
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ status: 1 });

// Add instance methods
messageSchema.methods.markCompleted = function () {
  this.status = MessageStatus.COMPLETED;
  this.isStreaming = false;
  this.streamCompleted = true;
  this.completedAt = new Date();
  return this.save();
};

messageSchema.methods.markFailed = function (error: Error) {
  this.status = MessageStatus.FAILED;
  this.errorMessage = error.toString();
  this.isStreaming = false;
  this.completedAt = new Date();
  return this.save();
};

