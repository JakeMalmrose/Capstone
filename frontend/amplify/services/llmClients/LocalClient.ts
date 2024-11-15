import { LLMClient, LLMConfig, LLMMessage } from './LLMClient';
import OpenAI from 'openai';

export class LocalClient implements LLMClient {
    private openai: OpenAI;
    
    constructor() {
      this.openai = new OpenAI({ baseURL: 'http://174.23.129.232:8000/v1' });
    }
  
    async generateResponse(messages: LLMMessage[], config: LLMConfig = { model: 'hermes-3-llama-3.1-8b' }): Promise<string> {
      try {
        const response = await this.openai.chat.completions.create({
          model: config.model,
          messages: messages,
          temperature: config.temperature ?? 0.7,
          max_tokens: config.maxTokens,
        });
  
        if (!response.choices[0].message?.content) {
          throw new Error("No content returned from Local API");
        }
        return response.choices[0].message.content;
      } catch (error) {
        console.error("Error during Local API call:", error);
        throw error;
      }
    }
  }