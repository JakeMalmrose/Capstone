import { LLMClient, LLMMessage, LLMConfig } from './LLMClient';
import Anthropic from '@anthropic-ai/sdk';

export class AnthropicClient implements LLMClient {
    private anthropic: Anthropic;
    
    constructor(apiKey: string) {
      this.anthropic = new Anthropic({ apiKey });
    }
  
    async generateResponse(messages: LLMMessage[], config: LLMConfig = { model: 'claude-3-sonnet-20240229' }): Promise<string> {
      try {
        // Find system message if it exists
        const systemMessage = messages.find(msg => msg.role === 'system');
        
        const response = await this.anthropic.messages.create({
          model: config.model,
          system: systemMessage?.content,
          messages: messages
            .filter(msg => msg.role === 'user' || msg.role === 'assistant')
            .map(msg => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content
            })),
          max_tokens: config.maxTokens || 1000,
          temperature: config.temperature || 0.7,
        });
  
        if (!response.content[0]) {
          throw new Error("No content returned from Anthropic API");
        }
        //@ts-ignore
        return response.content[0].text;
      } catch (error) {
        console.error("Error during Anthropic API call:", error);
        throw error;
      }
    }
  }
