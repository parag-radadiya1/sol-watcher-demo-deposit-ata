import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConversationFeedback, ConversationFeedbackDocument } from './conversation-feedback.entities';

@Injectable()
export class ConversationFeedbackModelService {
  constructor(
    @InjectModel(ConversationFeedback.name)
    private readonly conversationFeedbackModel: Model<ConversationFeedbackDocument>,
  ) {}

  createFeedback(value: Partial<ConversationFeedback>) {
    return this.conversationFeedbackModel.create(value as any);
  }

  getFeedbackByMessageAndUser(messageId: string, userId: string) {
    return this.conversationFeedbackModel.findOne({ messageId, userId });
  }

  async upsertFeedback(value: Partial<ConversationFeedback>) {
    const { messageId, userId } = value as any;
    return this.conversationFeedbackModel.findOneAndUpdate(
      { messageId, userId },
      { $set: value },
      { upsert: true, new: true },
    );
  }
}

