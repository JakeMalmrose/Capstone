import type { Schema } from "../../data/resource";
import { OpenAIClient } from '../../services/llmClients/OpenAIClient';
import { LLMMessage } from '../../services/llmClients/LLMClient';
import client from '../../services/client';

const llmClient = new OpenAIClient(process.env.OPENAI_API_KEY || '');

const SYSTEM_PROMPT = `You are a helpful assistant that specializes in helping users discover relevant feeds based on their interests. You understand the GNews API's capabilities and limitations.

Available GNews Categories:
- general
- world
- nation
- business
- technology
- entertainment
- sports
- science
- health

Available GNews Countries:
- us (United States)
- gb (United Kingdom)
- au (Australia)
- ca (Canada)
- in (India)

When users express interest in a topic or ask a question, you should:
1. Determine if a feed suggestion is appropriate for the request
2. If appropriate, suggest the most relevant GNews category, country (defaulting to 'us'), and any search keywords that would help narrow down the results
3. Only include a FEED_SUGGESTION if you are actually suggesting a feed

Key Behaviors:
- Only provide a FEED_SUGGESTION when actually suggesting a feed
- Never generate fake RSS feeds - only work with GNews categories and search queries
- If the user's request doesn't warrant a feed suggestion, respond conversationally without including a FEED_SUGGESTION
- When suggesting feeds, ensure they match GNews's available categories and countries

Feed Suggestion Format:
When suggesting a feed, format your response in two parts:
1. A conversational response explaining your suggestion
2. A feed suggestion in JSON format after the text "FEED_SUGGESTION:" with these properties:
   {
     "name": "A descriptive name for the feed",
     "description": "A brief description of what the feed contains",
     "type": "GNEWS",
     "gNewsCategory": "one of the available categories",
     "gNewsCountry": "one of the available country codes",
     "searchTerms": ["array", "of", "search", "terms"],
     "tags": ["array", "of", "relevant", "tags"]
   }

Examples:

<example>
User: I'm interested in learning about artificial intelligence.

That's a fascinating topic! I can help you stay updated on AI news through our technology category with a specific focus on artificial intelligence.

FEED_SUGGESTION:
{
  "name": "AI Technology News",
  "description": "Latest news about artificial intelligence from our technology section",
  "type": "GNEWS",
  "gNewsCategory": "technology",
  "gNewsCountry": "us",
  "searchTerms": ["artificial intelligence", "AI"],
  "tags": ["technology", "AI", "machine learning"]
}
</example>

<example>
User: What categories are available?

We've got a bunch of categories: general, world, nation, business, technology, entertainment, sports, science, and health. Which area interests you most?
</example>

<example>
User: I want business news focused on renewable energy.

I'll set you up with a business feed focused specifically on renewable energy developments.

FEED_SUGGESTION:
{
  "name": "Renewable Energy Business News",
  "description": "Business news and updates about renewable energy industry",
  "type": "GNEWS",
  "gNewsCategory": "business",
  "gNewsCountry": "us",
  "searchTerms": ["renewable energy", "clean energy", "sustainable energy"],
  "tags": ["business", "renewable energy", "sustainability"]
}
</example>`;

export const handler: Schema["chatWithLLM"]["functionHandler"] = async (event) => {
  const { message, chatHistory } = event.arguments;

  if (!message || !chatHistory) {
    throw new Error(`Missing required parameters: ${!message ? 'message ' : ''}${!chatHistory ? 'chatHistory' : ''}`);
  }

  try {
    const messages = chatHistory as LLMMessage[];

    // Ensure system message is present
    if (!messages.some(msg => msg.role === 'system')) {
      messages.unshift({
        role: 'system',
        content: SYSTEM_PROMPT
      });
    }

    // Add the new message to history
    messages.push({
      role: 'user',
      content: message
    });

    // Get response from LLM
    const response = await llmClient.generateResponse(messages, {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 800
    });

    // Parse response to extract feed suggestion if present
    const parts = response.split('FEED_SUGGESTION:');
    const textResponse = parts[0].trim();
    
    // Only try to parse feed suggestion if it exists
    if (parts.length > 1) {
      try {
        const feedJson = parts[1].trim();
        const feedSuggestion = JSON.parse(feedJson);

        // Validate the feed suggestion has the required properties
        if (feedSuggestion.name && feedSuggestion.description) {
          if (feedSuggestion.type === 'GNEWS') {
            return {
              response: textResponse,
              feedSuggestion: {
                ...feedSuggestion,
                url: 'gnews://' // placeholder URL since we're using direct fields now
              }
            };
          }

          // For other URLs, check for RSS feeds
          const urlsResponse = await client.queries.extractUrls({
            url: feedSuggestion.url,
            typeOfLink: 'RSS'
          });

          if (urlsResponse.data && urlsResponse.data.length > 0) {
            return {
              response: textResponse,
              feedSuggestion: {
                ...feedSuggestion,
                url: urlsResponse.data[0],
                type: 'RSS'
              }
            };
          }
        }
      } catch (error: any) {
        console.error('Error parsing feed suggestion:', {
          error: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause
        });
      }
    }

    // If we reach here, either there was no feed suggestion or parsing failed
    // In this case, we return just the text response without a feed suggestion
    return {
      response: textResponse,
      feedSuggestion: null
    };
  } catch (error: any) {
    console.error("Detailed error during chat:", {
      error: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    throw new Error(`Chat processing failed: ${error.message}`);
  }
};
