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
  private streamingSupported: boolean | null = null; // Track if streaming is supported

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
   * @description Stream chat with conversation history (for context-aware responses)
   * History is used for context only - we only stream the response to the new message
   * @param {Array<{role: string, content: string}>} messages - Complete array of messages including system, history, and new user message
   * @returns {AsyncIterable<string>} Stream of AI response chunks
   */
  async *streamChatWithHistory(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  ): AsyncIterable<string> {
    // Build message array from the complete message stack
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

    // If we already know streaming isn't supported, skip directly to non-streaming
    if (this.streamingSupported === false) {
      const langchainMessages = buildMessages();
      const response = await this.chatModel.invoke(langchainMessages);
      yield response.content.toString();
      return;
    }

    try {
      const langchainMessages = buildMessages();

      // Try to stream the response (history is just context, not streamed)
      const stream = await this.chatModel.stream(langchainMessages);
      for await (const chunk of stream) {
        const content = chunk.content;
        if (content) {
          yield content.toString();
        }
      }

      // If we get here, streaming is supported
      if (this.streamingSupported === null) {
        this.streamingSupported = true;
        console.log('Streaming is supported and working');
      }
    } catch (error: any) {
      // If streaming is not supported (organization not verified), fallback to non-streaming
      if (error?.code === 'unsupported_value' && error?.param === 'stream') {
        // Remember that streaming isn't supported to avoid future attempts
        if (this.streamingSupported === null) {
          this.streamingSupported = false;
          console.warn('Streaming not supported by OpenAI organization. Using non-streaming mode for all future requests.');
          console.warn('To enable streaming, verify your organization at: https://platform.openai.com/settings/organization/general');
        }

        const langchainMessages = buildMessages();

        // Get the full response without streaming
        const response = await this.chatModel.invoke(langchainMessages);
        const fullContent = response.content.toString();

        // Yield the full response at once (simulating streaming)
        yield fullContent;
      } else {
        console.error('LangChain stream chat with history error:', error);
        throw new Error('Failed to stream AI response with history');
      }
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

  /**
   * @description Summarize a conversation using a custom LLM-based approach
   * @param {Array<{role: string, content: string}>} messages - Array of messages to summarize
   * @returns {Promise<string>} Concise summary of the conversation
   */
  async summarizeConversation(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<string> {
    try {
      if (messages.length === 0) return '';

      // Build a conversation transcript
      const conversationText = messages
        .map((msg) => {
          const speaker = msg.role === 'user' ? 'User' : 'Assistant';
          return `${speaker}: ${msg.content}`;
        })
        .join('\n\n');

      // Use the LLM to create an intelligent summary
      const summaryPrompt = `Please provide a concise summary of the following conversation. Focus on the main topics discussed, key questions asked, and important information shared. Keep it brief but informative (2-3 sentences max).

Conversation:
${conversationText}

Summary:`;

      const summary = await this.chatModel.invoke([new HumanMessage(summaryPrompt)]);
      return summary.content.toString().trim();
    } catch (error) {
      console.error('LangChain summarize conversation error:', error);
      // Fallback to simple summary
      return `Previous conversation covered ${messages.length} messages.`;
    }
  }
}
