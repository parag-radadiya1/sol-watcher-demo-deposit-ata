export interface IChatRequest {
  message: string;
}

export interface IChatWithContextRequest {
  systemPrompt: string;
  userMessage: string;
}

export interface IChatWithHistoryRequest {
  conversationHistory: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
}

export interface IChatWithTemplateRequest {
  template: string;
  variables: Record<string, any>;
}

export interface IAgenticCallRequest {
  task: string;
  tools?: Array<{
    name: string;
    description: string;
  }>;
}

export interface IEmbeddingRequest {
  text: string;
}

export interface IAIResponse {
  response: string;
}

export interface IEmbeddingResponse {
  embeddings: number[];
}

