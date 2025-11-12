import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument, MessageStatus } from './message.entities';

@Injectable()
export class MessageModelService {
  private readonly logger = new Logger(MessageModelService.name);

  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
  ) {}

  async createMessage(value: Partial<Message>): Promise<Message> {
    return this.messageModel.create(value as any);
  }

  async appendToMessage(messageId: string, chunk: string): Promise<Message | null> {
    const msg = await this.messageModel.findById(messageId);
    if (!msg) return null;
    msg.content = (msg.content || '') + chunk;
    msg.isStreaming = true;
    msg.status = MessageStatus.STREAMING as any;
    await msg.save();
    return msg;
  }

  async markCompleted(messageId: string) {
    const msg: any = await this.messageModel.findById(messageId);
    if (!msg) return null;
    msg.status = MessageStatus.COMPLETED;
    msg.isStreaming = false;
    msg.streamCompleted = true;
    msg.completedAt = new Date();
    return msg.save();
  }

  async markFailed(messageId: string, error: Error) {
    const msg: any = await this.messageModel.findById(messageId);
    if (!msg) return null;
    msg.status = MessageStatus.FAILED;
    msg.errorMessage = error?.message ?? String(error);
    msg.isStreaming = false;
    msg.completedAt = new Date();
    return msg.save();
  }

  getMessagesByConversation(conversationId: string, limit = 100) {
    return this.messageModel.find({ conversationId }).sort({ createdAt: 1 }).limit(limit);
  }

  getPendingOrStreamingMessages() {
    return this.messageModel.find({ status: { $in: [MessageStatus.PENDING, MessageStatus.STREAMING] } });
  }

  // update token count helper
  async incrementTokenCount(messageId: string, count: number) {
    return this.messageModel.findByIdAndUpdate(messageId, { $inc: { tokenCount: count } }, { new: true });
  }
}

