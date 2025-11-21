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

  /**
   * Retrieves messages for a specific conversation.
   * If fromDate is provided, fetches the most recent messages created before that date.
   * Messages are returned in ascending order by creation date.
   *
   * @param conversationId - The unique identifier of the conversation
   * @param limit - Maximum number of messages to retrieve (default: 100)
   * @param fromDate - Optional date filter; if provided, only messages created before this date are returned
   * @returns Promise resolving to an array of Message documents
   *
   * @example
   * // Get the latest 50 messages for a conversation
   * const messages = await messageService.getMessagesByConversation('conv123', 50);
   *
   * @example
   * // Get up to 20 messages created before a specific date
   * const beforeDate = new Date('2023-12-01');
   * const oldMessages = await messageService.getMessagesByConversation('conv123', 20, beforeDate);
   */
  getMessagesByConversation(conversationId: string, limit = 100, fromDate?: Date) {
    const query: any = { conversationId };
    if (fromDate) {
      query.createdAt = { $lt: fromDate };
    }
    const sortOrder = fromDate ? -1 : 1; // descending if fromDate to get latest first, then reverse
    return this.messageModel.find(query).sort({ createdAt: sortOrder }).limit(limit).then(docs => {
      if (fromDate) {
        return docs.reverse(); // to ascending order
      }
      return docs;
    });
  }

  getPendingOrStreamingMessages() {
    return this.messageModel.find({ status: { $in: [MessageStatus.PENDING, MessageStatus.STREAMING] } });
  }

  // update token count helper
  async incrementTokenCount(messageId: string, count: number) {
    return this.messageModel.findByIdAndUpdate(messageId, { $inc: { tokenCount: count } }, { new: true });
  }
}
