import { Injectable } from '@nestjs/common';
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
import { TokenManagementService } from '@app/token-management/token-management.service';
import { TokenUsageType, LLMProvider } from '@entities/langchain-token-usage/langchain-token-usage.entities';

interface ITokenInfo {
  provider: 'openai' | 'google';
  inputTokens: number;
  outputTokens: number;
}

@Injectable()
export class LangChainServiceWithTokenTracking {
  private chatModel: ChatOpenAI | ChatGoogleGenerativeAI;
  private streamingSupported: boolean | null = null;
  private provider: 'openai' | 'google';

  constructor(
    private readonly configService: ConfigService,
    private readonly tokenManagementService: TokenManagementService,
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
    const timeout = parseInt(this.configService.get<string>('GOOGLE_TIMEOUT') || '120000');

    console.log('Initializing LangChain with Google Gemini:', {
      model: modelName,
      temperature: temperatureStr || 'default',
      maxTokens,
      timeout: `${timeout}ms`,
      hasApiKey: !!apiKey
    });

    const config: any = {
      model: modelName,
      apiKey: apiKey,
      maxOutputTokens: maxTokens,
    };

    if (temperatureStr) {
      config.temperature = parseFloat(temperatureStr);
    }

    this.chatModel = new ChatGoogleGenerativeAI(config);
  }

  /**
   * Initialize OpenAI model
   */
  private initializeOpenAIModel(apiKey: string): void {
    const modelName = this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo';
    const baseURL = this.configService.get<string>('OPENAI_BASE_URL');
    const temperatureStr = this.configService.get<string>('OPENAI_TEMPERATURE');
    const maxTokens = parseInt(this.configService.get<string>('OPENAI_MAX_TOKENS') || '4000');
    const timeout = parseInt(this.configService.get<string>('OPENAI_TIMEOUT') || '120000');

    console.log('Initializing LangChain with OpenAI:', {
      model: modelName,
      baseURL: baseURL || 'default OpenAI',
      temperature: temperatureStr || 'default (1)',
      maxTokens,
      timeout: `${timeout}ms`,
      hasApiKey: !!apiKey
    });

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
  }

  /**
   * Estimate tokens for a message (simplified)
   * Note: Use actual tokenizer for production
   */
  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Chat with token tracking
   */
  async chatWithTracking(
    userId: string,
    message: string,
    usageType: TokenUsageType = TokenUsageType.CHAT,
    requestId?: string,
  ): Promise<{ response: string; tokenInfo: ITokenInfo }> {
    try {
      // Estimate input tokens
      const inputTokens = this.estimateTokens(message);

      // Check if user has enough tokens
      const canPerform = await this.tokenManagementService.canUserPerformOperation(
        userId,
        inputTokens,
      );

      if (!canPerform.allowed) {
        throw new Error(canPerform.message);
      }

      const startTime = Date.now();

      // Call LLM
      const response = await (this.chatModel as any).invoke([
        new HumanMessage(message),
      ]);

      const responseText = response.content.toString();
      const outputTokens = this.estimateTokens(responseText);
      const responseTimeMs = Date.now() - startTime;

      // Record usage and debit tokens
      await this.tokenManagementService.recordTokenUsageAndDebit(userId, {
        userId,
        provider: this.provider as LLMProvider,
        usageType,
        inputTokens,
        outputTokens,
        prompt: message,
        response: responseText,
        model: this.provider === 'openai' ? 
          this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo' :
          this.configService.get<string>('GOOGLE_MODEL') || 'gemini-2.5-flash',
        requestId: requestId || this.generateRequestId(),
        success: true,
        responseTimeMs,
      });

      return {
        response: responseText,
        tokenInfo: {
          provider: this.provider,
          inputTokens,
          outputTokens,
        },
      };
    } catch (error) {
      console.error('LangChain chat with tracking error:', error);
      throw new Error(`Failed to get AI response: ${error.message}`);
    }
  }

  /**
   * Chat with system context and token tracking
   */
  async chatWithContextAndTracking(
    userId: string,
    systemPrompt: string,
    userMessage: string,
    usageType: TokenUsageType = TokenUsageType.CHAT,
    requestId?: string,
  ): Promise<{ response: string; tokenInfo: ITokenInfo }> {
    try {
      // Estimate input tokens (system + user message)
      const totalInputTokens = this.estimateTokens(systemPrompt + userMessage);

      // Check if user has enough tokens
      const canPerform = await this.tokenManagementService.canUserPerformOperation(
        userId,
        totalInputTokens,
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

      // Record usage and debit tokens
      await this.tokenManagementService.recordTokenUsageAndDebit(userId, {
        userId,
        provider: this.provider as LLMProvider,
        usageType,
        inputTokens: totalInputTokens,
        outputTokens,
        prompt: userMessage,
        response: responseText,
        model: this.provider === 'openai' ? 
          this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo' :
          this.configService.get<string>('GOOGLE_MODEL') || 'gemini-2.5-flash',
        requestId: requestId || this.generateRequestId(),
        success: true,
        responseTimeMs,
      });

      return {
        response: responseText,
        tokenInfo: {
          provider: this.provider,
          inputTokens: totalInputTokens,
          outputTokens,
        },
      };
    } catch (error) {
      console.error('LangChain chat with context and tracking error:', error);
      throw new Error(`Failed to get AI response with context: ${error.message}`);
    }
  }

  /**
   * Multi-turn conversation with history and token tracking
   */
  async chatWithHistoryAndTracking(
    userId: string,
    conversationHistory: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    usageType: TokenUsageType = TokenUsageType.CHAT,
    requestId?: string,
  ): Promise<{ response: string; tokenInfo: ITokenInfo; totalConversationTokens: number }> {
    try {
      // Estimate total input tokens for entire conversation
      const totalInputTokens = conversationHistory.reduce(
        (sum, msg) => sum + this.estimateTokens(msg.content),
        0,
      );

      // Check if user has enough tokens
      const canPerform = await this.tokenManagementService.canUserPerformOperation(
        userId,
        totalInputTokens,
      );

      if (!canPerform.allowed) {
        throw new Error(canPerform.message);
      }

      const startTime = Date.now();

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
      const responseText = response.content.toString();
      const outputTokens = this.estimateTokens(responseText);
      const responseTimeMs = Date.now() - startTime;

      // Get user's last message for context
      const userMessages = conversationHistory.filter(m => m.role === 'user');
      const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';

      // Record usage and debit tokens
      await this.tokenManagementService.recordTokenUsageAndDebit(userId, {
        userId,
        provider: this.provider as LLMProvider,
        usageType,
        inputTokens: totalInputTokens,
        outputTokens,
        prompt: lastUserMessage,
        response: responseText,
        model: this.provider === 'openai' ? 
          this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo' :
          this.configService.get<string>('GOOGLE_MODEL') || 'gemini-2.5-flash',
        requestId: requestId || this.generateRequestId(),
        success: true,
        responseTimeMs,
      });

      return {
        response: responseText,
        tokenInfo: {
          provider: this.provider,
          inputTokens: totalInputTokens,
          outputTokens,
        },
        totalConversationTokens: totalInputTokens + outputTokens,
      };
    } catch (error) {
      console.error('LangChain chat with history and tracking error:', error);
      throw new Error(`Failed to get AI response with history: ${error.message}`);
    }
  }

  /**
   * Template-based chat with token tracking
   */
  async chatWithTemplateAndTracking(
    userId: string,
    template: string,
    variables: Record<string, any>,
    usageType: TokenUsageType = TokenUsageType.CHAT,
    requestId?: string,
  ): Promise<{ response: string; tokenInfo: ITokenInfo }> {
    try {
      // Estimate input tokens
      const templateText = template + JSON.stringify(variables);
      const inputTokens = this.estimateTokens(templateText);

      // Check if user has enough tokens
      const canPerform = await this.tokenManagementService.canUserPerformOperation(
        userId,
        inputTokens,
      );

      if (!canPerform.allowed) {
        throw new Error(canPerform.message);
      }

      const startTime = Date.now();

      const promptTemplate = ChatPromptTemplate.fromTemplate(template);
      const formattedPrompt = await promptTemplate.invoke(variables);
      const response = await (this.chatModel as any).invoke(formattedPrompt);
      const responseText = response.content.toString();
      const outputTokens = this.estimateTokens(responseText);
      const responseTimeMs = Date.now() - startTime;

      // Record usage and debit tokens
      await this.tokenManagementService.recordTokenUsageAndDebit(userId, {
        userId,
        provider: this.provider as LLMProvider,
        usageType,
        inputTokens,
        outputTokens,
        prompt: template,
        response: responseText,
        model: this.provider === 'openai' ? 
          this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo' :
          this.configService.get<string>('GOOGLE_MODEL') || 'gemini-2.5-flash',
        requestId: requestId || this.generateRequestId(),
        success: true,
        responseTimeMs,
      });

      return {
        response: responseText,
        tokenInfo: {
          provider: this.provider,
          inputTokens,
          outputTokens,
        },
      };
    } catch (error) {
      console.error('LangChain chat with template and tracking error:', error);
      throw new Error(`Failed to get AI response with template: ${error.message}`);
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if user can perform token operation before calling LLM
   */
  async canPerformOperation(
    userId: string,
    estimatedTokens: number,
  ): Promise<{ allowed: boolean; message: string; currentBalance?: number }> {
    return await this.tokenManagementService.canUserPerformOperation(
      userId,
      estimatedTokens,
    );
  }

  /**
   * Get user's token balance and usage info
   */
  async getUserTokenInfo(userId: string): Promise<any> {
    return await this.tokenManagementService.getUserTokenReport(userId);
  }
}

