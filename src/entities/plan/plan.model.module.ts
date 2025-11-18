import { Module } from '@nestjs/common';
import { planModel } from './plan.entities';
import { PlanService } from './plan.service';
import { ChatLimitService } from './chat-limit.service';
import { UserModelsModule } from '@entities-user/user.model.module';
import { messageModel } from '@entities-message/message.entities';
import { conversationModel } from '@entities-conversation/conversation.entities';

@Module({
  imports: [planModel, messageModel, conversationModel, UserModelsModule],
  providers: [PlanService, ChatLimitService],
  exports: [planModel, PlanService, ChatLimitService],
})
export class PlanModelModule {}
