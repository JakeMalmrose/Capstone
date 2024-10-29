import { Schema } from '../../amplify/data/resource';
import { LLMClient, LLMConfig } from './llmClients/LLMClient';
import { AnthropicClient } from './llmClients/AnthropicClient';
import { OpenAIClient } from './llmClients/OpenAIClient';
//import { OllamaClient } from './llmClients/OllamaClient';
import { LocalClient } from './llmClients/LocalClient';
import { SummarizationService } from './SummarizationService';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';

import client from './client';

export class SummarizationServiceFactory {
    static async createService(summarizerId: string): Promise<SummarizationService> {
      // Fetch summarizer details from database
      const { data: summarizer } = await client.models.Summarizer.get({ id: summarizerId });
      
      if (!summarizer) {
        throw new Error(`Summarizer with ID ${summarizerId} not found`);
      }
  
      // Create appropriate client based on summarizer type
      let llmClient: LLMClient;
      let config: LLMConfig;
  
      switch (summarizer.name.toLowerCase()) {
        case 'openai':
          llmClient = new OpenAIClient(process.env.OPENAI_API_KEY!);
          config = { model: 'gpt-4o-mini' };
          break;
        case 'claude':
          llmClient = new AnthropicClient(process.env.ANTHROPIC_API_KEY!);
          config = { model: 'claude-3-sonnet-20240229' };
          break;
        case 'local':
          llmClient = new LocalClient();
          config = { model: 'hermes-3-llama-3.1-8b' };
          break;
        default:
          throw new Error(`Unsupported summarizer type: ${summarizer.name}`);
      }
  
      return new SummarizationService(llmClient, summarizerId, config);
    }
  }