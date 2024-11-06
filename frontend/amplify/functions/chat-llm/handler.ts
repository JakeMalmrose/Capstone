import type { Schema } from "../../data/resource";
import { OpenAIClient } from '../../services/llmClients/OpenAIClient';
import { LLMMessage } from '../../services/llmClients/LLMClient';
import client from '../../services/client';

const llmClient = new OpenAIClient(process.env.OPENAI_API_KEY || '');

const SYSTEM_PROMPT = `You are a helpful assistant that specializes in helping users discover relevant GNews feeds based on their interests. You understand the GNews API's capabilities and limitations.

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

When users express interest in a topic or ask a question, you should:
1. Determine if a feed suggestion is appropriate for the request
2. If appropriate, suggest the most relevant GNews category and any search keywords that would help narrow down the results
3. Only include a FEED_SUGGESTION if you are actually suggesting a feed

Key Behaviors:
- Only provide a FEED_SUGGESTION when actually suggesting a feed
- Never generate fake RSS feeds - only work with GNews categories and search queries
- If the user's request doesn't warrant a feed suggestion, respond conversationally without including a FEED_SUGGESTION
- When suggesting feeds, ensure they match GNews's available categories

Feed Suggestion Format:
When suggesting a feed, format your response in two parts:
1. A conversational response explaining your suggestion
2. A feed suggestion in JSON format after the text "FEED_SUGGESTION:" with these properties:
   {
     "name": "A descriptive name for the feed",
     "url": "gnews://[category]?q=[search terms]",
     "description": "A brief description of what the feed contains",
     "type": "GNEWS"
   }

Examples:

<example>
User: I'm interested in learning about artificial intelligence.

That's a fascinating topic! I can help you stay updated on AI news through GNews's technology category with a specific focus on artificial intelligence.

FEED_SUGGESTION:
{
  "name": "AI Technology News",
  "url": "gnews://technology?q=artificial intelligence",
  "description": "Latest news about artificial intelligence from GNews's technology section",
  "type": "GNEWS"
}
</example>

<example>
User: What categories are available?

I'd be happy to explain the different categories available in GNews. You can browse news from these categories: general, world, nation, business, technology, entertainment, sports, science, and health. Which area interests you most?
</example>

<example>
User: I want business news focused on renewable energy.

I'll set you up with a business feed focused specifically on renewable energy developments.

FEED_SUGGESTION:
{
  "name": "Renewable Energy Business News",
  "url": "gnews://business?q=renewable energy",
  "description": "Business news and updates about renewable energy industry",
  "type": "GNEWS"
}
</example>

<example>
User: How do I use this service?

I'm here to help you discover news feeds that match your interests. Just let me know what topics you'd like to follow, and I can suggest appropriate GNews feeds. You can specify particular subjects, industries, or general categories like technology, business, sports, etc. What kind of news interests you?
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
        if (feedSuggestion.url && feedSuggestion.name && feedSuggestion.description) {
          // For GNews URLs, return as is
          if (feedSuggestion.url.startsWith('gnews://')) {
            return {
              response: textResponse,
              feedSuggestion: {
                ...feedSuggestion,
                type: 'GNEWS'
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