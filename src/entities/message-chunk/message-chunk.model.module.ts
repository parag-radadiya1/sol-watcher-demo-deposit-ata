import { Module } from '@nestjs/common';
import { MessageChunkModelService } from './message-chunk.service';
import { messageChunkModel } from './message-chunk.entities';

@Module({
  imports: [messageChunkModel],
  controllers: [],
  providers: [MessageChunkModelService],
  exports: [messageChunkModel, MessageChunkModelService],
})
export class MessageChunkModelsModule {}
