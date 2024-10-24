import { LLMClient, LLMConfig, LLMMessage } from './LLMClient';
import OpenAI from 'openai';

export class OpenAIClient implements LLMClient {
    private openai: OpenAI;
    
    constructor(apiKey: string) {
      this.openai = new OpenAI({ apiKey });
    }
  
    async generateResponse(messages: LLMMessage[], config: LLMConfig = { model: 'gpt-4o-mini' }): Promise<string> {
      try {
        const response = await this.openai.chat.completions.create({
          model: config.model,
          messages: messages,
          temperature: config.temperature ?? 0.7,
          max_tokens: config.maxTokens,
        });
  
        if (!response.choices[0].message?.content) {
          throw new Error("No content returned from OpenAI API");
        }
        return response.choices[0].message.content;
      } catch (error) {
        console.error("Error during OpenAI API call:", error);
        throw error;
      }
    }
  }