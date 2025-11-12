import { Module } from '@nestjs/common';
import { conversationFeedbackModel } from './conversation-feedback.entities';
import { ConversationFeedbackModelService } from './conversation-feedback.service';

@Module({
  imports: [conversationFeedbackModel],
  controllers: [],
  providers: [ConversationFeedbackModelService],
  exports: [conversationFeedbackModel, ConversationFeedbackModelService],
})
export class ConversationModelsModule {}
