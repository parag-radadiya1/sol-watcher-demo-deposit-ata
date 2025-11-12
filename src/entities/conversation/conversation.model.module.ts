import { Module } from '@nestjs/common';
import { conversationModel } from './conversation.entities';
import { ConversationModelService } from './conversation.service';
import { OtpModelModule } from '@entities-otp/otp.model.module';
import { UserModelsModule } from '@entities-user/user.model.module';

@Module({
  imports: [conversationModel, OtpModelModule, UserModelsModule],
  controllers: [],
  providers: [ConversationModelService],
  exports: [conversationModel, ConversationModelService],
})
export class ConversationModelModule {}
