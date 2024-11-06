// amplify/functions/summarize/handler.ts
import type { Schema } from "../../data/resource";
import { SummarizationServiceFactory } from "../../services/SummarizationServiceFactory";

export const handler: Schema["summarize"]["functionHandler"] = async (event) => {
  const { text, articleId, summarizerId, userId } = event.arguments;

  console.log('Received arguments:', { text: text?.length, articleId, summarizerId, userId });

  if (!text || !articleId || !summarizerId || !userId) {
    throw new Error(`Missing required parameters: ${!text ? 'text ' : ''}${!articleId ? 'articleId ' : ''}${!summarizerId ? 'summarizerId ' : ''}${!userId ? 'userId' : ''}`);
  }

  try {
    console.log('Creating summarization service for summarizerId:', summarizerId);
    const summarizationService = await SummarizationServiceFactory.createService(summarizerId);
    
    console.log('Checking for existing summary');
    const existingSummary = await summarizationService.getSummary(articleId, userId);
    if (existingSummary) {
      console.log('Found existing summary');
      return existingSummary.text;
    }

    console.log('Generating new summary');
    const summary = await summarizationService.summarizeArticle(articleId, text, userId);
    return summary.text;
  } catch (error: any) {
    console.error("Detailed error during summarization:", {
      error: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    throw new Error(`Summarization failed: ${error.message}`);
  }
};
