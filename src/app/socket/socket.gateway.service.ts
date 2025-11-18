import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { LangChainService } from '../langchain/langchain.service';
import { MessageModelService } from '../../entities/message/message.service';
import { MessageChunkModelService } from '../../entities/message-chunk/message-chunk.service';
import { ConversationModelService } from '../../entities/conversation/conversation.service';
import { MessageRole, MessageStatus } from '../../entities/message/message.entities';
import { Types } from 'mongoose';
import { CHAT_SYSTEM_PROMPT } from './constants/chat-validation-prompt.constant';
import { ChatValidationService } from './services/chat-validation.service';
import { UserModelService } from '@entities-user/user.service';
import { TokenUsageType } from '@entities/langchain-token-usage/langchain-token-usage.entities';


@Injectable()
export class SocketGatewayService {
  private readonly logger = new Logger(SocketGatewayService.name);

  constructor(
    private readonly langChainService: LangChainService,
    private readonly userModelService: UserModelService,
    private readonly messageModelService: MessageModelService,
    private readonly messageChunkModelService: MessageChunkModelService,
    private readonly conversationModelService: ConversationModelService,
    private readonly chatValidationService: ChatValidationService,
  ) {}

  /**
   * Stream AI response chunks from LangChainService to a socket (or room).
   * NOW WITH FULL PLAN VALIDATION + CONTENT VALIDATION
   * Emits:
   *  - 'aiMessageChunk' for each partial chunk
   *  - 'aiMessageComplete' when finished (with remaining limits info)
   *  - 'aiMessageError' on error (including plan limit errors and validation errors)
   */
  async streamChatToSocket(
    client: Socket,
    payload: { message: string; roomName?: string; conversationId?: string },
    userId: string,
  ) {
    const { message, roomName } = payload;
    let { conversationId } = payload;
    const target = roomName ? client.to(roomName) : client;

    let messageDoc: any = null;
    let userMessageDoc: any = null;
    let sequence = 0;

    try {
      // 🔥 NEW: Validate if message is astrology-related using AI
      this.logger.log(`Validating message content for astrology relevance...`);
      const isValid = await this.chatValidationService.isAstrologyRelated(message);

      if (!isValid) {
        this.logger.warn(`Non-astrology message blocked: "${message.substring(0, 50)}..."`);

        const errorMessage = this.chatValidationService.getNonAstrologyMessage();

        // Emit validation error
        target.emit('aiMessageError', {
          conversationId: conversationId ?? null,
          userId,
          error: errorMessage,
          errorType: 'VALIDATION_ERROR',
          requiresUpgrade: false,
        });

        return;
      }

      this.logger.log(`✅ Message validated as astrology-related, proceeding...`);

      // Validate or create conversationId
      if (conversationId && !Types.ObjectId.isValid(conversationId)) {
        this.logger.warn(`Invalid conversationId "${conversationId}", creating new conversation`);
        const newConversation = await this.conversationModelService.createConversation(
          userId,
          `Chat ${new Date().toLocaleString()}`
        );
        conversationId = (newConversation as any)._id.toString();
        this.logger.log(`Created new conversation: ${conversationId}`);
      }

      // If no conversationId provided, create a new conversation
      if (!conversationId) {
        const newConversation = await this.conversationModelService.createConversation(
          userId,
          `Chat ${new Date().toLocaleString()}`
        );
        conversationId = (newConversation as any)._id.toString();
        this.logger.log(`Created new conversation: ${conversationId}`);
      }

      // Fetch conversation history (last 30 messages for potential summarization)
      const allMessages = await this.messageModelService.getMessagesByConversation(conversationId, 30);

      // Build conversation history with smart summarization
      const conversationHistory = await this.buildSmartConversationHistory(allMessages, userId);

      // Add the new user message to the conversation history
      conversationHistory.push({
        role: 'user',
        content: message,
      });

      this.logger.log(`Streaming with context: ${conversationHistory.length} messages (${allMessages.length} total in DB)`);

      // Save the user's message first
      userMessageDoc = await this.messageModelService.createMessage({
        conversationId: conversationId,
        role: MessageRole.USER,
        content: message,
        status: MessageStatus.COMPLETED,
        isStreaming: false,
        streamCompleted: true,
        completedAt: new Date(),
        tokenCount: 0,
        modelName: null,
      });

      // Create a message document to persist the streaming assistant response
      messageDoc = await this.messageModelService.createMessage({
        conversationId: conversationId,
        role: MessageRole.ASSISTANT,
        content: '[streaming...]', // Placeholder to satisfy validation
        status: MessageStatus.STREAMING,
        isStreaming: true,
        streamCompleted: false,
        tokenCount: 0,
        modelName: null,
      });

      // notify start
      (roomName ? client.to(roomName) : client).emit('aiMessageStart', {
        conversationId: conversationId,
        userId,
        messageId: messageDoc?._id ?? null,
        userMessageId: userMessageDoc?._id ?? null,
      });

      // Clear the placeholder content
      let fullContent = '';

      // 🔥 Use streamChatWithPlanValidation for full plan limit checking
      // This validates: question limit, chat message limit, token limits, daily/monthly balance
      for await (const chunk of this.langChainService.streamChatWithPlanValidation(
        userId,
        conversationHistory,
        conversationId, // Important: pass conversation ID for chat message limit tracking
        TokenUsageType.CONVERSATION,
      )) {
        const chunkStr = chunk ?? '';

        // Skip empty chunks to avoid validation errors
        if (!chunkStr || chunkStr.trim() === '') {
          continue;
        }

        sequence += 1;
        fullContent += chunkStr;

        // persist chunk
        if (messageDoc) {
          await this.messageChunkModelService.createChunk({
            messageId: (messageDoc as any)._id,
            content: chunkStr,
            sequence,
            tokenCount: 0,
          });

          // Update message content with full content accumulated so far
          (messageDoc as any).content = fullContent;
          await (messageDoc as any).save();
        }

        // Emit each chunk to the client (or room)
        target.emit('aiMessageChunk', {
          conversationId: conversationId,
          userId,
          messageId: messageDoc?._id ?? null,
          chunk: chunkStr,
        });
      }

      // final completion: mark message completed
      if (messageDoc) {
        await this.messageModelService.markCompleted((messageDoc as any)._id);
      }

      // Emit completion with plan limits info
      (roomName ? client.to(roomName) : client).emit('aiMessageComplete', {
        conversationId: conversationId,
        userId,
        messageId: messageDoc?._id ?? null,
        message: '✅ Message complete. Token usage tracked and limits validated.',
      });

      this.logger.log(`✅ Streaming complete for user=${userId} conversation=${conversationId} with plan validation and content validation`);
    } catch (error) {
      this.logger.error('Error while streaming chat to socket', error?.stack ?? error);

      // mark message failed
      if (messageDoc) {
        await this.messageModelService.markFailed((messageDoc as any)._id, error as Error);
      }

      // Enhanced error handling for plan limit errors
      const errorMessage = (error && (error as any).message) || String(error);
      const isPlanLimitError = error.status === 403 || errorMessage.includes('limit reached') || errorMessage.includes('limit exceeded');

      (roomName ? client.to(roomName) : client).emit('aiMessageError', {
        conversationId: conversationId ?? null,
        userId,
        messageId: messageDoc?._id ?? null,
        error: errorMessage,
        requiresUpgrade: isPlanLimitError, // Flag to show upgrade prompt in UI
        errorType: isPlanLimitError ? 'PLAN_LIMIT' : 'SYSTEM_ERROR',
      });

      throw error;
    }
  }

  /**
   * Build conversation history with recent messages
   * Strategy: Keep last 4 messages for context (more cost-effective than summarization)
   * 🔥 UPDATED: Using improved CHAT_SYSTEM_PROMPT for concise responses
   */
  private async buildSmartConversationHistory(
    allMessages: any[],
    userId: string
  ): Promise<Array<{ role: 'system' | 'user' | 'assistant'; content: string }>> {

    const user = await this.userModelService.getUserById(userId);

    // Prepare user birth details
    const fullName = user.surname
      ? `${user.firstName} ${user.lastName} ${user.surname}`.trim()
      : `${user.firstName} ${user.lastName}`.trim();

    const birthDateFormatted = new Date(user.birthDate).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const MAX_CONTEXT_MESSAGES = 4; // Keep last 4 messages for context
    const conversationHistory: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    // 🔥 NEW: Use improved chat system prompt
    const systemPrompt = `${CHAT_SYSTEM_PROMPT}

**User Birth Details:**
- Full Name: ${fullName}
- Birth Date & Time: ${birthDateFormatted}
- Birth Place: ${user.birthPlace}

Use these details to provide personalized insights when relevant.`;

    // Add system prompt
    conversationHistory.push({
      role: 'system',
      content: systemPrompt,
    });

    // Get the most recent messages (up to MAX_CONTEXT_MESSAGES)
    const recentMessages = allMessages.slice(-MAX_CONTEXT_MESSAGES);

    // Add recent messages to conversation history
    recentMessages.forEach((msg: any) => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        conversationHistory.push({
          role: msg.role,
          content: msg.content,
        });
      }
    });

    this.logger.log(`Using ${recentMessages.length} recent messages as context (${allMessages.length} total in DB)`);

    return conversationHistory;
  }

  /**
   * Summarize a list of messages into a concise summary (DEPRECATED - too costly)
   * This method is kept for potential future use with very long conversations
   * For normal use, we just pass the last 20 messages directly
   */
  private async summarizeMessages(messages: any[]): Promise<string> {
    try {
      if (messages.length === 0) return '';

      // Filter to only user and assistant messages for summarization
      const filteredMessages = messages
        .filter((msg: any) => msg.role === 'user' || msg.role === 'assistant')
        .map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        }));

      // Use LangChain for intelligent summarization
      const summary = await this.langChainService.summarizeConversation(filteredMessages);
      return summary.trim();
    } catch (error) {
      this.logger.error('Error summarizing messages', error?.stack ?? error);
      // If summarization fails, return a simple fallback
      return `Previous conversation covered ${messages.length} messages.`;
    }
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId: string, limit = 50) {
    return this.conversationModelService.getConversationsByUser(userId, limit);
  }

  /**
   * Get all messages for a conversation
   */
  async getConversationMessages(conversationId: string, limit = 100) {
    return this.messageModelService.getMessagesByConversation(conversationId, limit);
  }

  /**
   * Create a new conversation
   */
  async createConversation(userId: string, title?: string) {
    return this.conversationModelService.createConversation(userId, title);
  }

}
