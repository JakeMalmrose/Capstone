export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }
  
  export interface LLMConfig {
    model: string;
    temperature?: number;
    maxTokens?: number;
  }
  
  export interface LLMClient {
    generateResponse(messages: LLMMessage[], config?: LLMConfig): Promise<string>;
  }