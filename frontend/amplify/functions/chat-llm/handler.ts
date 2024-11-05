// amplify/functions/chat-llm/handler.ts
import type { Schema } from "../../data/resource";
import { OpenAIClient } from '../../services/llmClients/OpenAIClient';
import { LLMMessage } from '../../services/llmClients/LLMClient';
import client from '../../services/client';

const llmClient = new OpenAIClient(process.env.OPENAI_API_KEY || '');

const SYSTEM_PROMPT = `You are a helpful assistant that helps users discover and subscribe to GNews feeds. 
When a user expresses interest in a topic, suggest relevant feeds. When suggesting a feed, format your response in two parts:

1. A conversational response explaining why you're suggesting this feed
2. A feed suggestion in JSON format after the text "FEED_SUGGESTION:" with these properties:
   {
     "name": "Feed name",
     "url": "Feed URL",
     "description": "A brief description of the feed",
     "type": "RSS" or "GNEWS"
   }

<example>
I found a great technology news feed that covers the latest developments in AI and machine learning.

FEED_SUGGESTION:
{
  "name": "AI Weekly",
  "url": "https://aiweekly.com/feed",
  "description": "Weekly curated news about artificial intelligence and machine learning",
  "type": "RSS"
}
</example>
Example 2:
<example>
Let's get a little more specific. Would you like to receive news about a particular topic?
</example>

Example 3:
I found a great cybersecurity news feed that covers the latest developments in cybersecurity.
{
  "name": "Cybersecurity News",
  "url": "https://cybersecuritynews.com/feed",
  "description": "Daily news about cybersecurity",
  "type": "RSS"
}
`;



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
    let feedSuggestion = null;
    let textResponse = response;

    if (response.includes('FEED_SUGGESTION:')) {
      const [text, feedJson] = response.split('FEED_SUGGESTION:');
      textResponse = text.trim();
      try {
        feedSuggestion = JSON.parse(feedJson.trim());

        // If a URL is provided, validate it and check for RSS feeds
        if (feedSuggestion.url) {
          const urlsResponse = await client.queries.extractUrls({
            url: feedSuggestion.url,
            typeOfLink: 'RSS'
          });

          // If RSS feeds were found, update the suggestion with the first feed URL
          if (urlsResponse.data && urlsResponse.data.length > 0) {
            feedSuggestion.url = urlsResponse.data[0];
            feedSuggestion.type = 'RSS';
          } else {
            // If no RSS feed found, mark as OTHER type
            feedSuggestion.type = 'OTHER';
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

    return {
      response: textResponse,
      feedSuggestion: feedSuggestion || {
        name: '',
        url: '',
        description: '',
        type: 'OTHER'
      }
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
