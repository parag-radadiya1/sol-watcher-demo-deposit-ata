import { SocketAuthGuard } from '@guard/socketAuth.guard';
import { CustomValidationService } from '@helper/customValidation.helper.service';
import { Logger, UseFilters, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { BODY_SIZE_LIMIT } from '@utils/constants';
import { Server, Socket } from 'socket.io';
import { SocketExceptionFilter } from './helper/socket.exceptionHandler.service';
import { SocketGatewayService } from './socket.gateway.service';

const configService = new ConfigService();

@WebSocketGateway({
  cors: { origin: configService.get<string>('ALLOW_ORIGIN') ?? '*' },
  transports: ['websocket'],
  maxHttpBufferSize: BODY_SIZE_LIMIT,
})
@UseFilters(SocketExceptionFilter)
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  public readonly server: Server;
  private readonly logger = new Logger(SocketGateway.name);
  private clients = new Map<string, Socket>();

  constructor(
    private readonly customValidationService: CustomValidationService,
    private readonly socketGatewayService: SocketGatewayService,
  ) {}

  handleConnection(client?: Socket): void {
    this.logger.log('Client connected');
    return;
  }

  handleDisconnect(client?: Socket): void {
    // remove any client mapping for this socket
    try {
      if (!client) {
        this.logger.log('Client disconnected (no socket instance)');
        return;
      }
      const userId = client.data?.userId;
      if (userId && this.clients.has(userId)) {
        this.clients.delete(userId);
      }
      this.logger.log(`Client disconnected user=${userId ?? 'unknown'}`);
    } catch (err) {
      this.logger.error('Error during disconnect cleanup', err?.stack ?? err);
    }
    return;
  }

  getClientSocket(userId: string) {
    return this.clients.get(userId);
  }

  @SubscribeMessage('joinRoom')
  @UseGuards(SocketAuthGuard)
  async handleJoinRoom(socket: Socket, roomName: string) {
    try {

      console.log('=== roomName ====', roomName);
      
      if (!roomName || typeof roomName !== 'string') {
        console.log('===  here ====', );
        return { status: 'error', message: 'Invalid room name' };
      }

      const userId = socket.data?.userId;
      console.log('=== userId ====', userId);
      if (userId) {
        this.clients.set(userId, socket);
      }

      if (roomName.toString() !== userId.toString()) {
        console.log('===   here  1 ====', );
        return { status: 'error', message: 'Invalid room name' };
      }

      const data = await this.socketGatewayService.getUserPlanData(
        userId,
      );
      socket.join(roomName);
      socket.emit('joinedRoom', { roomName, ...data });
      this.logger.log(`User ${userId ?? 'unknown'} joined room ${roomName}`);

      return { status: 'ok', room: roomName };
    } catch (error) {
      this.logger.error('joinRoom error', error?.stack ?? error);
      return { status: 'error', message: 'Failed to join room' };
    }
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(socket: Socket, roomName: string) {
    socket.leave(roomName);
  }

  @SubscribeMessage('chatMessage')
  @UseGuards(SocketAuthGuard)
  async handleChatMessage(
    socket: Socket,
    payload: {
      message: string;
      roomName?: string;
      conversationId?: string;
    },
  ) {
    // payload should contain 'message' and optional 'roomName' or 'conversationId'
    try {
      const userId = socket.data?.userId ?? 'unknown';
      if (
        !payload ||
        typeof payload.message !== 'string' ||
        payload.message.trim() === ''
      ) {
        socket.emit('aiMessageError', { error: 'Empty message' });
        return { status: 'error', message: 'Empty message' };
      }

      // fire-and-forget the streaming process; errors will be emitted back to the client
      this.socketGatewayService
        .streamChatToSocket(socket, payload, userId)
        .catch((err) => {
          this.logger.error('Error streaming chat to socket', err?.stack ?? err);
        });

      return { status: 'started' };
    } catch (err) {
      this.logger.error('handleChatMessage error', err?.stack ?? err);
      socket.emit('aiMessageError', { error: err?.message ?? String(err) });
      return { status: 'error', message: 'Failed to process message' };
    }
  }

  @SubscribeMessage('getConversations')
  @UseGuards(SocketAuthGuard)
  async handleGetConversations(socket: Socket, payload: { limit?: number }) {
    try {
      const userId = socket.data?.userId;
      const limit = payload?.limit || 50;

      const conversations = await this.socketGatewayService.getUserConversations(
        userId,
        limit,
      );

      socket.emit('conversationsList', {
        conversations,
        userId,
      });

      return { status: 'ok', count: conversations.length };
    } catch (err) {
      this.logger.error('handleGetConversations error', err?.stack ?? err);
      socket.emit('conversationsError', { error: err?.message ?? String(err) });
      return { status: 'error', message: 'Failed to get conversations' };
    }
  }


  // listen event token-update for testing.


       /**
   * Emit token update to user's room
   * @param userId - Room identifier (conversation ID)
   * @param data - Token and plan data to emit
   */
  emitTokenUpdate(
         userId: string,
    data: {
      availableTokens: number;
      dailyUsed: number;
      monthlyUsed: number;
      limits: {
        dailyLimit?: number;
        monthlyLimit?: number;
        perRequestLimit?: number;
      };
      planDetails: {
        name: string;
        remainingChatMessages: number | null;
        remainingQuestions: number | null;
      };
    },
  ): void {
    try {
      if (!userId) {
        this.logger.warn('Cannot emit token update: conversationId is missing');
        return;
      }

      this.logger.log(`Emitting token-update to room: ${userId}`);
      this.server.to(userId).emit('token-update', data);
    } catch (error) {
      this.logger.error('Error emitting token update', error?.stack ?? error);
    }
  }

  @SubscribeMessage('createConversation')
  @UseGuards(SocketAuthGuard)
  async handleCreateConversation(
    socket: Socket,
    payload: { title?: string },
  ) {
    try {
      const userId = socket.data?.userId;
      const title = payload?.title || `Chat ${new Date().toLocaleString()}`;

      const conversation = await this.socketGatewayService.createConversation(
        userId,
        title,
      );

      socket.emit('conversationCreated', {
        conversation,
        userId,
      });

      return { status: 'ok', conversationId: (conversation as any)._id };
    } catch (err) {
      this.logger.error('handleCreateConversation error', err?.stack ?? err);
      socket.emit('conversationError', { error: err?.message ?? String(err) });
      return { status: 'error', message: 'Failed to create conversation' };
    }
  }

  @SubscribeMessage('getMessages')
  @UseGuards(SocketAuthGuard)
  async handleGetMessages(
    socket: Socket,
    payload: {
      conversationId: string;
      limit?: number;
      fromDate?: string;
    },
  ) {
    try {
      const userId = socket.data?.userId;
      const { conversationId, limit = 50, fromDate } = payload;

      if (!conversationId) {
        socket.emit('messagesError', { error: 'Conversation ID is required' });
        return { status: 'error', message: 'Conversation ID is required' };
      }

      const parsedFromDate = fromDate ? new Date(fromDate) : undefined;

      const messages = await this.socketGatewayService.getConversationMessages(
        userId,
        conversationId,
        limit,
        parsedFromDate,
      );

      socket.emit('messagesList', {
        conversationId,
        messages,
        userId,
        count: messages.length,
      });

      return { status: 'ok', count: messages.length };
    } catch (err) {
      this.logger.error('handleGetMessages error', err?.stack ?? err);
      socket.emit('messagesError', { error: err?.message ?? String(err) });
      return { status: 'error', message: 'Failed to get messages' };
    }
  }

  sendMessageInRoom(
    client: Socket,
    data: { roomName: string; message: string },
  ) {
    try {
      if (!data?.roomName) return;
      this.server.to(data.roomName).emit('roomMessage', { message: data.message });
    } catch (err) {
      this.logger.error('sendMessageInRoom error', err?.stack ?? err);
    }
  }
}
