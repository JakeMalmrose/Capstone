import { OpenAIClient } from "./openAiClient";

export interface NlpOperation {
  perform(text: string): Promise<string>;
}

export class Summarizer implements NlpOperation {
  private openaiClient: OpenAIClient;
  private systemPrompt: string;

  constructor(openaiClient: OpenAIClient, systemPrompt: string) {
    this.openaiClient = openaiClient;
    this.systemPrompt = systemPrompt;
  }

  async perform(text: string): Promise<string> {
    return await this.openaiClient.createChatCompletion(this.systemPrompt, text);
  }
}

export class LinkExtractor implements NlpOperation {
    private openaiClient: OpenAIClient;
    private systemPrompt: string;
  
    constructor(openaiClient: OpenAIClient, systemPrompt: string) {
      this.openaiClient = openaiClient;
      this.systemPrompt = systemPrompt;
    }
  
    async perform(text: string): Promise<string> {
      // Implement the link extraction logic using OpenAI API
      return await this.openaiClient.createChatCompletion(this.systemPrompt, text);
    }
  }
  

// Will define additional nlp operations here (link extraction)