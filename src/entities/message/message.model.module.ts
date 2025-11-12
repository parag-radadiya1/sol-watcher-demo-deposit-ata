import { Module } from '@nestjs/common';
import { messageModel } from './message.entities';
import { MessageModelService } from './message.service';

@Module({
  imports: [messageModel],
  controllers: [],
  providers: [MessageModelService],
  exports: [messageModel, MessageModelService],
})
export class MessageModelsModule {}
