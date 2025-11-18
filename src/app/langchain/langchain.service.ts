import { Injectable, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ChatOpenAI,
  ChatGoogleGenerativeAI,
  HumanMessage,
  SystemMessage,
  AIMessage,
  ChatPromptTemplate,
  OpenAIEmbeddings
} from './langchain-compat';
import { TokenManagementService } from '../token-management/token-management.service';
import { TokenUsageType, LLMProvider } from '@entities/langchain-token-usage/langchain-token-usage.entities';
import { ChatLimitService } from '@entities-plan/chat-limit.service';
import { PlanService } from '@entities-plan/plan.service';
import { UserModelService } from '@entities-user/user.service';

interface ITokenTrackingResult {
  response: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  planLimitsChecked?: boolean;
  remainingChatMessages?: number | null;
  remainingQuestions?: number | null;
}

@Injectable()
export class LangChainService {
  private chatModel: ChatOpenAI | ChatGoogleGenerativeAI;
  private streamingSupported: boolean | null = null;
  private provider: 'openai' | 'google';
  private modelName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly tokenManagementService: TokenManagementService,
    private readonly chatLimitService: ChatLimitService,
    private readonly planService: PlanService,
    private readonly userModelService: UserModelService,
  ) {
    // Determine which provider to use
    const googleApiKey = this.configService.get<string>('GOOGLE_API_KEY');
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    const preferredProvider = this.configService.get<string>('LLM_PROVIDER') || 'google';

    if (preferredProvider === 'openai' && openaiApiKey) {
      this.provider = 'openai';
      this.initializeOpenAIModel(openaiApiKey);
    } else if (preferredProvider === 'google' && googleApiKey) {
      this.provider = 'google';
      this.initializeGoogleModel(googleApiKey);
    } else if (googleApiKey) {
      this.provider = 'google';
      this.initializeGoogleModel(googleApiKey);
    } else if (openaiApiKey) {
      this.provider = 'openai';
      this.initializeOpenAIModel(openaiApiKey);
    } else {
      throw new Error('Neither GOOGLE_API_KEY nor OPENAI_API_KEY is configured');
    }
  }

  /**
   * Initialize Google Gemini model
   */
  private initializeGoogleModel(apiKey: string): void {
    const modelName = this.configService.get<string>('GOOGLE_MODEL') || 'gemini-2.5-flash';
    const temperatureStr = this.configService.get<string>('GOOGLE_TEMPERATURE');
    const maxTokens = parseInt(this.configService.get<string>('GOOGLE_MAX_TOKENS') || '4000');

    const config: any = {
      model: modelName,
      apiKey: apiKey,
      maxOutputTokens: maxTokens,
    };

    if (temperatureStr) {
      config.temperature = parseFloat(temperatureStr);
    }

    this.chatModel = new ChatGoogleGenerativeAI(config);
    this.modelName = modelName;
  }

  /**
   * Initialize OpenAI model
   */
  private initializeOpenAIModel(apiKey: string): void {
    const modelName = this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo';
    const baseURL = this.configService.get<string>('OPENAI_BASE_URL');
    const temperatureStr = this.configService.get<string>('OPENAI_TEMPERATURE');
    const timeout = parseInt(this.configService.get<string>('OPENAI_TIMEOUT') || '120000');

    const config: any = {
      openAIApiKey: apiKey,
      modelName: modelName,
      timeout: timeout,
    };

    if (temperatureStr) {
      config.temperature = parseFloat(temperatureStr);
    }

    if (baseURL) {
      config.configuration = { baseURL };
    }

    this.chatModel = new ChatOpenAI(config);
    this.modelName = modelName;
  }

  /**
   * Estimate tokens (rough calculation: ~4 chars per token)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate plan limits before making LangChain call
   * @param userId - User ID
   * @param conversationId - Conversation ID (optional, for chat message limit)
   * @param checkQuestionLimit - Whether to check question limit
   * @returns Plan validation result
   */
  private async validatePlanLimits(
    userId: string,
    conversationId?: string,
    checkQuestionLimit: boolean = true,
  ): Promise<{
    canProceed: boolean;
    remainingChatMessages: number | null;
    remainingQuestions: number | null;
    planName: string;
  }> {
    // Check question limit (global across all conversations)
    // if (checkQuestionLimit) {
    //   const questionCheck = await this.chatLimitService.checkQuestionLimit(userId);
    //   if (questionCheck.limitReached) {
    //     throw new ForbiddenException(
    //       `Question limit reached for ${questionCheck.planName}. You have used all ${questionCheck.questionLimit} questions. Please upgrade your plan to continue.`,
    //     );
    //   }
    // }

    // Check chat message limit (per conversation)
    if (conversationId) {
      const chatCheck = await this.chatLimitService.checkChatMessageLimit(userId, conversationId);
      console.log('=== chatCheck ====', chatCheck);
      if (chatCheck.limitReached) {
        throw new ForbiddenException(
          `Chat message limit reached for ${chatCheck.planName}. You have used ${chatCheck.chatMessageLimit} AI responses in this conversation. Please upgrade your plan to continue.`,
        );
      }

      return {
        canProceed: true,
        remainingChatMessages: chatCheck.remainingMessages,
        remainingQuestions: checkQuestionLimit 
          ? (await this.chatLimitService.checkQuestionLimit(userId)).remainingQuestions 
          : null,
        planName: chatCheck.planName,
      };
    }

    const questionCheck = await this.chatLimitService.checkQuestionLimit(userId);
    return {
      canProceed: true,
      remainingChatMessages: null,
      remainingQuestions: questionCheck.remainingQuestions,
      planName: questionCheck.planName,
    };
  }

  /**
   * Simple chat completion
   */
  async chat(message: string): Promise<string> {
    try {
      const response = await (this.chatModel as any).invoke([
        new HumanMessage(message),
      ]);
      return response.content.toString();
    } catch (error) {
      console.error('LangChain chat error:', error);
      throw new Error('Failed to get AI response');
    }
  }

  /**
   * Chat with FULL validation: Plan limits + Token tracking + Transaction recording
   * This is the recommended method for all chat operations with users
   */
  async chatWithPlanValidation(
    userId: string,
    message: string,
    conversationId?: string,
    usageType: TokenUsageType = TokenUsageType.CHAT,
  ): Promise<ITokenTrackingResult> {
    try {
      const inputTokens = this.estimateTokens(message);

      // 1. Validate plan limits (chat message limit, question limit)
      const planLimits = await this.validatePlanLimits(userId, conversationId, true);
      console.log(`✅ Plan limits validated for user ${userId}:`, {
        remainingQuestions: planLimits.remainingQuestions,
        remainingChatMessages: planLimits.remainingChatMessages,
        planName: planLimits.planName,
      });

      // 2. Get user's plan ID
      const user = await this.userModelService.getUserById(userId);
      const userPlanId = user?.planId;

      // 3. Validate user has token balance (daily/monthly limits)
      const canPerform = await this.tokenManagementService.canUserPerformOperation(
        userId,
        inputTokens,
        userPlanId,
      );

      if (!canPerform.allowed) {
        throw new ForbiddenException(canPerform.message);
      }

      // 4. Make the AI call
      const startTime = Date.now();
      const response = await (this.chatModel as any).invoke([
        new HumanMessage(message),
      ]);

      const responseText = response.content.toString();
      const outputTokens = this.estimateTokens(responseText);
      const responseTimeMs = Date.now() - startTime;

      // 5. Record usage and debit tokens
      await this.tokenManagementService.recordTokenUsageAndDebit(
        userId,
        {
          userId,
          provider: this.provider as LLMProvider,
          usageType,
          inputTokens,
          outputTokens,
          prompt: message,
          response: responseText,
          model: this.modelName,
          requestId: this.generateRequestId(),
          success: true,
          responseTimeMs,
        },
        userPlanId,
      );

      console.log(`✅ Token transaction recorded - Input: ${inputTokens}, Output: ${outputTokens}, Total: ${inputTokens + outputTokens}`);

      return {
        response: responseText,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        planLimitsChecked: true,
        remainingChatMessages: planLimits.remainingChatMessages,
        remainingQuestions: planLimits.remainingQuestions,
      };
    } catch (error) {
      console.error('LangChain chat with plan validation error:', error);
      throw error;
    }
  }

  /**
   * Chat with context and FULL validation
   */
  async chatWithContextAndPlanValidation(
    userId: string,
    systemPrompt: string,
    userMessage: string,
    conversationId?: string,
    usageType: TokenUsageType = TokenUsageType.CHAT,
  ): Promise<ITokenTrackingResult> {
    try {
      const totalInputTokens = this.estimateTokens(systemPrompt + userMessage);

      // 1. Validate plan limits
      const planLimits = await this.validatePlanLimits(userId, conversationId, true);

      // 2. Get user's plan ID
      const user = await this.userModelService.getUserById(userId);
      const userPlanId = user?.planId;

      // 3. Validate token balance
      const canPerform = await this.tokenManagementService.canUserPerformOperation(
        userId,
        totalInputTokens,
        userPlanId,
      );

      if (!canPerform.allowed) {
        throw new ForbiddenException(canPerform.message);
      }

      // 4. Make the AI call
      const startTime = Date.now();
      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userMessage),
      ];

      console.log('=== messages ====', messages);
      const response = await (this.chatModel as any).invoke(messages);
      const responseText = response.content.toString();
      const outputTokens = this.estimateTokens(responseText);
      const responseTimeMs = Date.now() - startTime;

      // 5. Record usage and debit tokens
      await this.tokenManagementService.recordTokenUsageAndDebit(
        userId,
        {
          userId,
          provider: this.provider as LLMProvider,
          usageType,
          inputTokens: totalInputTokens,
          outputTokens,
          prompt: userMessage,
          response: responseText,
          model: this.modelName,
          requestId: this.generateRequestId(),
          success: true,
          responseTimeMs,
        },
        userPlanId,
      );

      return {
        response: responseText,
        inputTokens: totalInputTokens,
        outputTokens,
        totalTokens: totalInputTokens + outputTokens,
        planLimitsChecked: true,
        remainingChatMessages: planLimits.remainingChatMessages,
        remainingQuestions: planLimits.remainingQuestions,
      };
    } catch (error) {
      console.error('LangChain chat with context and plan validation error:', error);
      throw error;
    }
  }

  /**
   * Stream chat with history and FULL validation
   */
  async *streamChatWithPlanValidation(
    userId: string,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    conversationId?: string,
    usageType: TokenUsageType = TokenUsageType.CHAT,
  ): AsyncIterable<string> {
    const buildMessages = () => {
      return messages.map((msg) => {
        switch (msg.role) {
          case 'system':
            return new SystemMessage(msg.content);
          case 'user':
            return new HumanMessage(msg.content);
          case 'assistant':
            return new AIMessage(msg.content);
          default:
            return new HumanMessage(msg.content);
        }
      });
    };

    try {
      const totalInputTokens = messages.reduce(
        (sum, msg) => sum + this.estimateTokens(msg.content),
        0,
      );

      // 1. Validate plan limits
      await this.validatePlanLimits(userId, conversationId, false);

      // 2. Get user's plan ID
      const user = await this.userModelService.getUserById(userId);
      const userPlanId = user?.planId;

      // 3. Validate token balance
      const canPerform = await this.tokenManagementService.canUserPerformOperation(
        userId,
        totalInputTokens,
        userPlanId,
      );

      if (!canPerform.allowed) {
        throw new ForbiddenException(canPerform.message);
      }

      const startTime = Date.now();
      let fullResponse = '';
      const langchainMessages = buildMessages();

      // 4. Stream the response
      if (this.streamingSupported === false) {
        const response = await (this.chatModel as any).invoke(langchainMessages);
        const responseText = response.content.toString();
        fullResponse = responseText;
        yield responseText;
      } else {
        try {
          const stream = await (this.chatModel as any).stream(langchainMessages);
          for await (const chunk of stream) {
            const content = chunk.content;
            if (content) {
              const contentStr = content.toString();
              fullResponse += contentStr;
              yield contentStr;
            }
          }

          if (this.streamingSupported === null) {
            this.streamingSupported = true;
          }
        } catch (error: any) {
          if (error?.code === 'unsupported_value' && error?.param === 'stream') {
            this.streamingSupported = false;
            const response = await (this.chatModel as any).invoke(langchainMessages);
            const responseText = response.content.toString();
            fullResponse = responseText;
            yield responseText;
          } else {
            throw error;
          }
        }
      }

      // 5. Record usage and debit tokens
      const outputTokens = this.estimateTokens(fullResponse);
      const responseTimeMs = Date.now() - startTime;

      await this.tokenManagementService.recordTokenUsageAndDebit(
        userId,
        {
          userId,
          provider: this.provider as LLMProvider,
          usageType,
          inputTokens: totalInputTokens,
          outputTokens,
          prompt: messages[messages.length - 1]?.content || '',
          response: fullResponse,
          model: this.modelName,
          requestId: this.generateRequestId(),
          success: true,
          responseTimeMs,
        },
        userPlanId,
      );
    } catch (error) {
      console.error('LangChain stream chat with plan validation error:', error);
      throw error;
    }
  }

  // Keep existing methods for backward compatibility
  async chatWithTracking(
    userId: string,
    message: string,
    userPlanId?: string,
    usageType: TokenUsageType = TokenUsageType.CHAT,
  ): Promise<ITokenTrackingResult> {
    try {
      const inputTokens = this.estimateTokens(message);

      const canPerform = await this.tokenManagementService.canUserPerformOperation(
        userId,
        inputTokens,
        userPlanId,
      );

      if (!canPerform.allowed) {
        throw new Error(canPerform.message);
      }

      const startTime = Date.now();

      const response = await (this.chatModel as any).invoke([
        new HumanMessage(message),
      ]);

      const responseText = response.content.toString();
      const outputTokens = this.estimateTokens(responseText);
      const responseTimeMs = Date.now() - startTime;

      await this.tokenManagementService.recordTokenUsageAndDebit(
        userId,
        {
          userId,
          provider: this.provider as LLMProvider,
          usageType,
          inputTokens,
          outputTokens,
          prompt: message,
          response: responseText,
          model: this.modelName,
          requestId: this.generateRequestId(),
          success: true,
          responseTimeMs,
        },
        userPlanId,
      );

      return {
        response: responseText,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      };
    } catch (error) {
      console.error('LangChain chat with tracking error:', error);
      throw new Error(`Failed to get AI response: ${error.message}`);
    }
  }

  async chatWithContext(systemPrompt: string, userMessage: string): Promise<string> {
    try {
      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userMessage),
      ];

      const response = await (this.chatModel as any).invoke(messages);
      return response.content.toString();
    } catch (error) {
      console.error('LangChain chat with context error:', error);
      throw new Error('Failed to get AI response with context');
    }
  }

  /**
   * Simple chat method for lightweight validation without token tracking
   * Use this for internal validation only (e.g., content validation)
   */
  async simpleChat(systemPrompt: string, userMessage: string): Promise<string> {
    try {
      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userMessage),
      ];

      const response = await (this.chatModel as any).invoke(messages);
      return response.content.toString();
    } catch (error) {
      console.error('LangChain simple chat error:', error);
      throw new Error('Failed to get AI response');
    }
  }

  async chatWithContextAndTracking(
    userId: string,
    systemPrompt: string,
    userMessage: string,
    userPlanId?: string,
    usageType: TokenUsageType = TokenUsageType.CHAT,
  ): Promise<ITokenTrackingResult> {
    try {
      const totalInputTokens = this.estimateTokens(systemPrompt + userMessage);

      const canPerform = await this.tokenManagementService.canUserPerformOperation(
        userId,
        totalInputTokens,
        userPlanId,
      );

      if (!canPerform.allowed) {
        throw new Error(canPerform.message);
      }

      const startTime = Date.now();

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userMessage),
      ];

      const response = await (this.chatModel as any).invoke(messages);
      const responseText = response.content.toString();
      const outputTokens = this.estimateTokens(responseText);
      const responseTimeMs = Date.now() - startTime;

      await this.tokenManagementService.recordTokenUsageAndDebit(
        userId,
        {
          userId,
          provider: this.provider as LLMProvider,
          usageType,
          inputTokens: totalInputTokens,
          outputTokens,
          prompt: userMessage,
          response: responseText,
          model: this.modelName,
          requestId: this.generateRequestId(),
          success: true,
          responseTimeMs,
        },
        userPlanId,
      );

      return {
        response: responseText,
        inputTokens: totalInputTokens,
        outputTokens,
        totalTokens: totalInputTokens + outputTokens,
      };
    } catch (error) {
      console.error('LangChain chat with context and tracking error:', error);
      throw new Error(`Failed to get AI response with context: ${error.message}`);
    }
  }

  async chatWithHistory(
    conversationHistory: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  ): Promise<string> {
    try {
      const messages = conversationHistory.map((msg) => {
        switch (msg.role) {
          case 'system':
            return new SystemMessage(msg.content);
          case 'user':
            return new HumanMessage(msg.content);
          case 'assistant':
            return new AIMessage(msg.content);
          default:
            return new HumanMessage(msg.content);
        }
      });

      const response = await (this.chatModel as any).invoke(messages);
      return response.content.toString();
    } catch (error) {
      console.error('LangChain chat with history error:', error);
      throw new Error('Failed to get AI response with history');
    }
  }

  async *streamChatWithHistory(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  ): AsyncIterable<string> {
    const buildMessages = () => {
      return messages.map((msg) => {
        switch (msg.role) {
          case 'system':
            return new SystemMessage(msg.content);
          case 'user':
            return new HumanMessage(msg.content);
          case 'assistant':
            return new AIMessage(msg.content);
          default:
            return new HumanMessage(msg.content);
        }
      });
    };

    if (this.streamingSupported === false) {
      const langchainMessages = buildMessages();
      const response = await (this.chatModel as any).invoke(langchainMessages);
      yield response.content.toString();
      return;
    }

    try {
      const langchainMessages = buildMessages();

      const stream = await (this.chatModel as any).stream(langchainMessages);
      for await (const chunk of stream) {
        const content = chunk.content;
        if (content) {
          yield content.toString();
        }
      }

      if (this.streamingSupported === null) {
        this.streamingSupported = true;
      }
    } catch (error: any) {
      if (error?.code === 'unsupported_value' && error?.param === 'stream') {
        if (this.streamingSupported === null) {
          this.streamingSupported = false;
        }

        const langchainMessages = buildMessages();
        const response = await (this.chatModel as any).invoke(langchainMessages);
        yield response.content.toString();
      } else {
        console.error('LangChain stream chat with history error:', error);
        throw new Error('Failed to stream AI response with history');
      }
    }
  }

  async *streamChatWithHistoryAndTracking(
    userId: string,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    userPlanId?: string,
    usageType: TokenUsageType = TokenUsageType.CHAT,
  ): AsyncIterable<string> {
    const buildMessages = () => {
      return messages.map((msg) => {
        switch (msg.role) {
          case 'system':
            return new SystemMessage(msg.content);
          case 'user':
            return new HumanMessage(msg.content);
          case 'assistant':
            return new AIMessage(msg.content);
          default:
            return new HumanMessage(msg.content);
        }
      });
    };

    if (this.streamingSupported === false) {
      const langchainMessages = buildMessages();
      const response = await (this.chatModel as any).invoke(langchainMessages);
      const responseText = response.content.toString();
      yield responseText;

      const totalInputTokens = messages.reduce(
        (sum, msg) => sum + this.estimateTokens(msg.content),
        0,
      );
      const outputTokens = this.estimateTokens(responseText);

      await this.tokenManagementService.recordTokenUsageAndDebit(
        userId,
        {
          userId,
          provider: this.provider as LLMProvider,
          usageType,
          inputTokens: totalInputTokens,
          outputTokens,
          prompt: messages[messages.length - 1]?.content || '',
          response: responseText,
          model: this.modelName,
          requestId: this.generateRequestId(),
          success: true,
          responseTimeMs: 0,
        },
        userPlanId,
      );
      return;
    }

    try {
      const totalInputTokens = messages.reduce(
        (sum, msg) => sum + this.estimateTokens(msg.content),
        0,
      );

      const canPerform = await this.tokenManagementService.canUserPerformOperation(
        userId,
        totalInputTokens,
        userPlanId,
      );

      if (!canPerform.allowed) {
        throw new Error(canPerform.message);
      }

      const startTime = Date.now();
      let fullResponse = '';
      const langchainMessages = buildMessages();

      const stream = await (this.chatModel as any).stream(langchainMessages);
      for await (const chunk of stream) {
        const content = chunk.content;
        if (content) {
          const contentStr = content.toString();
          fullResponse += contentStr;
          yield contentStr;
        }
      }

      if (this.streamingSupported === null) {
        this.streamingSupported = true;
      }

      const outputTokens = this.estimateTokens(fullResponse);
      const responseTimeMs = Date.now() - startTime;

      await this.tokenManagementService.recordTokenUsageAndDebit(
        userId,
        {
          userId,
          provider: this.provider as LLMProvider,
          usageType,
          inputTokens: totalInputTokens,
          outputTokens,
          prompt: messages[messages.length - 1]?.content || '',
          response: fullResponse,
          model: this.modelName,
          requestId: this.generateRequestId(),
          success: true,
          responseTimeMs,
        },
        userPlanId,
      );
    } catch (error: any) {
      if (error?.code === 'unsupported_value' && error?.param === 'stream') {
        if (this.streamingSupported === null) {
          this.streamingSupported = false;
        }

        const langchainMessages = buildMessages();
        const response = await (this.chatModel as any).invoke(langchainMessages);
        const responseText = response.content.toString();
        yield responseText;

        const totalInputTokens = messages.reduce(
          (sum, msg) => sum + this.estimateTokens(msg.content),
          0,
        );
        const outputTokens = this.estimateTokens(responseText);

        await this.tokenManagementService.recordTokenUsageAndDebit(
          userId,
          {
            userId,
            provider: this.provider as LLMProvider,
            usageType,
            inputTokens: totalInputTokens,
            outputTokens,
            prompt: messages[messages.length - 1]?.content || '',
            response: responseText,
            model: this.modelName,
            requestId: this.generateRequestId(),
            success: true,
            responseTimeMs: 0,
          },
          userPlanId,
        );
      } else {
        console.error('LangChain stream chat with history and tracking error:', error);
        throw new Error(`Failed to stream AI response with history: ${error.message}`);
      }
    }
  }

  async agenticCall(
    task: string,
    tools?: Array<{ name: string; description: string; execute: (input: any) => Promise<any> }>,
  ): Promise<string> {
    try {
      const systemPrompt = `You are an AI agent that helps execute tasks. 
${tools ? `Available tools: ${tools.map((t) => `${t.name}: ${t.description}`).join(', ')}` : 'No specific tools available.'}
Analyze the task and provide a detailed response or suggest which tool to use.`;

      return await this.chatWithContext(systemPrompt, task);
    } catch (error) {
      console.error('LangChain agentic call error:', error);
      throw new Error('Failed to execute agentic call');
    }
  }

  async getEmbeddings(text: string): Promise<number[]> {
    try {
      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
        modelName: 'text-embedding-3-large',
      });
      return await embeddings.embedQuery(text);
    } catch (error) {
      console.error('LangChain embeddings error:', error);
      throw new Error('Failed to get embeddings');
    }
  }

  async summarizeConversation(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<string> {
    try {
      if (messages.length === 0) return '';

      const conversationText = messages
        .map((msg) => {
          const speaker = msg.role === 'user' ? 'User' : 'Assistant';
          return `${speaker}: ${msg.content}`;
        })
        .join('\n\n');

      const summaryPrompt = `Please provide a concise summary of the following conversation. Focus on the main topics discussed, key questions asked, and important information shared. Keep it brief but informative (2-3 sentences max).

Conversation:
${conversationText}

Summary:`;

      const summary = await (this.chatModel as any).invoke([new HumanMessage(summaryPrompt)]);
      return summary.content.toString().trim();
    } catch (error) {
      console.error('LangChain summarize conversation error:', error);
      return `Previous conversation covered ${messages.length} messages.`;
    }
  }
}

