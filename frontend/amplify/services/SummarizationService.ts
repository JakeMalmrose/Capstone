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

  async summarizeArticle(articleId: string, text: string, specialRequests: string): Promise<SummaryType> {
    
    // Check if a summary with these special requests already exists
    if (specialRequests) {
      const { data: existingSummaries } = await client.models.Summary.list({
        filter: {
          articleId: { eq: articleId },
          summarizerId: { eq: this.summarizerId },
          specialRequests: { eq: specialRequests }
        }
      });

      if (existingSummaries && existingSummaries.length > 0) {
        return existingSummaries[0];
      }
    }
    
    // Build system prompt with special requests if they exist
    let systemPrompt = "You are a news article summarizer. Provide a clear, concise one-paragraph summary of the article.";
    if (specialRequests) {
      systemPrompt += ` The reader has requested you to respond with the following instructions: <instructions>${specialRequests}</instructions>.`;
    }
    
    try {
      // Generate summary using LLM
      const summaryText = await this.llmClient.generateResponse([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ], this.config);

      // Create summary in database with special requests if they exist
      const { data: createdSummary } = await client.models.Summary.create({
        text: summaryText,
        articleId: articleId,
        summarizerId: this.summarizerId,
        createdAt: new Date().toISOString(),
        specialRequests: specialRequests || undefined,
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

  async getSummary(articleId: string, specialRequests: string): Promise<SummaryType | null> {
    try {      
      // If user has special requests, try to find a matching summary
      if (specialRequests) {
        const { data: specialSummaries } = await client.models.Summary.list({
          filter: {
            articleId: { eq: articleId },
            summarizerId: { eq: this.summarizerId },
            specialRequests: { eq: specialRequests }
          }
        });

        if (specialSummaries && specialSummaries.length > 0) {
          return specialSummaries[0];
        }
      }

      // If no special requests or no matching summary exists, get generic summary
      const { data: genericSummaries } = await client.models.Summary.list({
        filter: {
          articleId: { eq: articleId },
          summarizerId: { eq: this.summarizerId },
          specialRequests: { attributeExists: false }
        }
      });

      if (!genericSummaries || genericSummaries.length === 0) {
        return null;
      }

      return genericSummaries[0];
    } catch (error) {
      console.error("Error fetching summary:", error);
      throw error;
    }
  }
}
