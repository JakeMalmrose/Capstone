import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { LLMClient, LLMConfig, LLMMessage } from './llmClients/LLMClient';
import client from './client';

type SummaryType = Schema['Summary']['type'];

export class SummarizationService {
  private llmClient: LLMClient;
  private summarizerId: string;
  private config: LLMConfig;

  constructor(llmClient: LLMClient, summarizerId: string, config: LLMConfig) {
    this.llmClient = llmClient;
    this.summarizerId = summarizerId;
    this.config = config;
  }

  async summarizeArticle(articleId: string, text: string): Promise<SummaryType> {
    const systemPrompt = "You are a news article summarizer. Provide a clear, concise one-paragraph summary of the article.";
    
    try {
      // Generate summary using LLM
      const summaryText = await this.llmClient.generateResponse([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ], this.config);

      // Create summary in database
      const { data: createdSummary } = await client.models.Summary.create({
        text: summaryText,
        articleId: articleId,
        summarizerId: this.summarizerId,
        createdAt: new Date().toISOString(),
      });

      if (!createdSummary) {
        throw new Error("Failed to create summary in database");
      }

      return createdSummary;
    } catch (error) {
      console.error("Error during summarization:", error);
      throw error;
    }
  }

  async getSummary(articleId: string): Promise<SummaryType | null> {
    try {
      const { data: summaries } = await client.models.Summary.list({
        filter: {
          articleId: { eq: articleId },
          summarizerId: { eq: this.summarizerId }
        }
      });

      if (!summaries || summaries.length === 0) {
        return null;
      }

      return summaries[0];
    } catch (error) {
      console.error("Error fetching summary:", error);
      throw error;
    }
  }
}