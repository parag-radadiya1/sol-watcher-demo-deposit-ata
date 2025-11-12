import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SocketConnection, SocketConnectionDocument } from './socket-connection.entities';

@Injectable()
export class SocketConnectionModelService {
  constructor(
    @InjectModel(SocketConnection.name)
    private readonly socketConnectionModel: Model<SocketConnectionDocument>,
  ) {}

  createConnection(value: Partial<SocketConnection>) {
    return this.socketConnectionModel.create(value as any);
  }

  findActiveByUser(userId: string) {
    return this.socketConnectionModel.find({ userId, isActive: true });
  }

  getBySocketId(socketId: string) {
    return this.socketConnectionModel.findOne({ socketId });
  }

  deactivateSocket(socketId: string) {
    return this.socketConnectionModel.findOneAndUpdate({ socketId }, { isActive: false }, { new: true });
  }

  touch(socketId: string) {
    return this.socketConnectionModel.findOneAndUpdate({ socketId }, { lastActivity: new Date() }, { new: true });
  }
}

