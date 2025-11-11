import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ChatOpenAI,
  HumanMessage,
  SystemMessage,
  AIMessage,
  StringOutputParser,
  ChatPromptTemplate,
  OpenAIEmbeddings
} from './langchain-compat';

@Injectable()
export class LangChainService {
  private chatModel: ChatOpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const modelName = this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo';
    const baseURL = this.configService.get<string>('OPENAI_BASE_URL');
    const temperatureStr = this.configService.get<string>('OPENAI_TEMPERATURE');
    const maxTokens = parseInt(this.configService.get<string>('OPENAI_MAX_TOKENS') || '4000');
    const timeout = parseInt(this.configService.get<string>('OPENAI_TIMEOUT') || '120000'); // 2 minutes default

    console.log('Initializing LangChain with:', {
      model: modelName,
      baseURL: baseURL || 'default OpenAI',
      temperature: temperatureStr || 'default (1)',
      maxTokens,
      timeout: `${timeout}ms`,
      hasApiKey: !!apiKey
    });

    // Build config object conditionally
    const config: any = {
      openAIApiKey: apiKey,
      modelName: modelName,
      // maxTokens: maxTokens,
      timeout: timeout,
    };

    // Only add temperature if explicitly set (some models like gpt-4o-mini only support default)
    if (temperatureStr) {
      config.temperature = parseFloat(temperatureStr);
    }

    // Add custom base URL if provided
    if (baseURL) {
      config.configuration = { baseURL };
    }

    this.chatModel = new ChatOpenAI(config);
  }

  /**
   * @description Simple chat completion with OpenAI
   * @param {string} message - The user message
   * @returns {Promise<string>} AI response
   */
  async chat(message: string): Promise<string> {
    try {
      const response = await this.chatModel.invoke([
        new HumanMessage(message),
      ]);
      return response.content.toString();
    } catch (error) {
      console.error('LangChain chat error:', error);
      throw new Error('Failed to get AI response');
    }
  }

  /**
   * @description Chat with system context
   * @param {string} systemPrompt - System instructions
   * @param {string} userMessage - User message
   * @returns {Promise<string>} AI response
   */
  async chatWithContext(systemPrompt: string, userMessage: string): Promise<string> {
    try {
      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userMessage),
      ];

      console.log('=== messages ====', messages);
      
      const response = await this.chatModel.invoke(messages);

      console.log('=== response ====', response);
      return response.content.toString();
    } catch (error) {
      console.error('LangChain chat with context error:', error);
      throw new Error('Failed to get AI response with context');
    }
  }

  /**
   * @description Multi-turn conversation with history
   * @param {Array<{role: string, content: string}>} conversationHistory - Array of messages
   * @returns {Promise<string>} AI response
   */
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

      const response = await this.chatModel.invoke(messages);
      return response.content.toString();
    } catch (error) {
      console.error('LangChain chat with history error:', error);
      throw new Error('Failed to get AI response with history');
    }
  }

  /**
   * @description Use a prompt template for structured responses
   * @param {string} template - Template with variables
   * @param {Record<string, any>} variables - Variables to fill in template
   * @returns {Promise<string>} AI response
   */
  async chatWithTemplate(
    template: string,
    variables: Record<string, any>,
  ): Promise<string> {
    try {
      const promptTemplate = ChatPromptTemplate.fromTemplate(template);
      const formattedPrompt = await promptTemplate.invoke(variables);
      const response = await this.chatModel.invoke(formattedPrompt);

      console.log('=== response ====', response);
      
      return response.content.toString();
    } catch (error) {
      console.error('LangChain chat with template error:', error);
      throw new Error('Failed to get AI response with template');
    }
  }

  /**
   * @description Stream chat responses (for real-time responses)
   * @param {string} message - User message
   * @returns {AsyncIterable<string>} Stream of AI response chunks
   */
  async *streamChat(message: string): AsyncIterable<string> {
    try {
      const stream = await this.chatModel.stream([new HumanMessage(message)]);
      for await (const chunk of stream) {
        yield chunk.content.toString();
      }
    } catch (error) {
      console.error('LangChain stream chat error:', error);
      throw new Error('Failed to stream AI response');
    }
  }

  /**
   * @description Agentic call - AI decides and executes actions
   * @param {string} task - Task description
   * @param {Array<{name: string, description: string, function: Function}>} tools - Available tools for the agent
   * @returns {Promise<string>} Final result after agent execution
   */
  async agenticCall(
    task: string,
    tools?: Array<{ name: string; description: string; execute: (input: any) => Promise<any> }>,
  ): Promise<string> {
    try {
      // Simple agentic approach: AI analyzes task and suggests actions
      const systemPrompt = `You are an AI agent that helps execute tasks. 
${tools ? `Available tools: ${tools.map((t) => `${t.name}: ${t.description}`).join(', ')}` : 'No specific tools available.'}
Analyze the task and provide a detailed response or suggest which tool to use.`;

      const response = await this.chatWithContext(systemPrompt, task);
      return response;
    } catch (error) {
      console.error('LangChain agentic call error:', error);
      throw new Error('Failed to execute agentic call');
    }
  }

  /**
   * @description Get embeddings for text (useful for vector search, RAG)
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} Embedding vector
   */
  async getEmbeddings(text: string): Promise<number[]> {
    try {
      // Note: Embeddings require a different OpenAI model
      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
        modelName: 'text-embedding-3-large', // Latest embedding model
      });
      const vector = await embeddings.embedQuery(text);
      return vector;
    } catch (error) {
      console.error('LangChain embeddings error:', error);
      throw new Error('Failed to get embeddings');
    }
  }
}
