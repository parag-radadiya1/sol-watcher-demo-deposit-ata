import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MongoSchema } from '@utils/classes/schema.classes';
import { SchemaTypes, Document } from 'mongoose';
import { User, userSchema } from '@entities-user/user.entities';

export type SocketConnectionDocument = SocketConnection & Document;

@Schema({ timestamps: true, versionKey: false, collection: 'socket_connections' })
export class SocketConnection extends MongoSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, index: true })
  userId: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Conversation', default: null })
  conversationId: string;

  @Prop({ type: String, required: true, unique: true, index: true })
  socketId: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Date, default: Date.now })
  lastActivity: Date;
}

export const socketConnectionSchema = SchemaFactory.createForClass(SocketConnection);
export const socketConnectionModel = MongooseModule.forFeature([
  { name: SocketConnection.name, schema: socketConnectionSchema },
]);
// Add compound index
socketConnectionSchema.index({ userId: 1, isActive: 1 });

