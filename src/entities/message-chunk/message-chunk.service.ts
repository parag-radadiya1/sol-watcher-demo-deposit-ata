import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MessageChunk, MessageChunkDocument } from './message-chunk.entities';

@Injectable()
export class MessageChunkModelService {
  constructor(
    @InjectModel(MessageChunk.name)
    private readonly messageChunkModel: Model<MessageChunkDocument>,
  ) {}

  createChunk(value: Partial<MessageChunk>) {
    return this.messageChunkModel.create(value as any);
  }

  getChunksByMessage(messageId: string) {
    return this.messageChunkModel.find({ messageId }).sort({ sequence: 1 });
  }

  deleteChunksByMessage(messageId: string) {
    return this.messageChunkModel.deleteMany({ messageId });
  }
}

