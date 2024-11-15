import type { Schema } from "../../data/resource";
import { OpenAIClient } from '../../services/llmClients/OpenAIClient';
import { LLMMessage } from '../../services/llmClients/LLMClient';
import client from '../../services/client';

const openClient = new OpenAIClient(process.env.OPENAI_API_KEY || '');

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
2. If appropriate:
   a. Choose ONE most relevant search term that would help find similar existing feeds
   b. Request a search using the SEARCH_REQUEST format
   c. Based on the search results, either select an existing feed or suggest creating a new one using the appropriate response format

Key Behaviors:
- Only provide a response format when actually suggesting or selecting a feed
- Never generate fake RSS feeds - only work with GNews categories and search queries
- If the user's request doesn't warrant a feed, respond conversationally without including any special format
- When suggesting feeds, ensure they match GNews's available categories and countries
- For each GNews category, use a consistent naming pattern: "[Category] News Feed"
- Maintain consistency in feed name and description format

Search Request Format:
When you want to search for similar feeds, respond with:
SEARCH_REQUEST:
{
  "searchTerm": "single most relevant search term"
}

After receiving search results, use one of these response formats:

For selecting an existing feed:
FEED_SELECTION:
{
  "response": "Your conversational response to the user",
  "feedId": "id of the selected feed from search results"
}

For creating a new feed:
NEW_FEED:
{
  "response": "Your conversational response to the user",
  "feed": {
    "name": "[Category] News Feed",
    "description": "Latest news from the [category] section",
    "type": "GNEWS",
    "gNewsCategory": "one of the available categories",
    "gNewsCountry": "one of the available country codes",
    "searchTerms": ["array", "of", "search", "terms"],
    "tags": ["array", "of", "relevant", "tags"]
  }
}

Examples:

<example>
User: I'm interested in technology news.

SEARCH_REQUEST:
{
  "searchTerm": "technology"
}

[After receiving empty search results]

NEW_FEED:
{
  "response": "I'll set you up with our technology news feed to keep you updated on the latest tech developments.",
  "feed": {
    "name": "Technology News Feed",
    "description": "Latest news from the technology section",
    "type": "GNEWS",
    "gNewsCategory": "technology",
    "gNewsCountry": "us",
    "searchTerms": ["technology"],
    "tags": ["technology"]
  }
}
</example>

<example>
User: What categories are available?

We've got a bunch of categories: general, world, nation, business, technology, entertainment, sports, science, and health. Which area interests you most?
</example>

<example>
User: I want business news focused on renewable energy.

SEARCH_REQUEST:
{
  "searchTerm": "renewable energy"
}

[After receiving search results showing an existing renewable energy feed with id "feed-123"]

FEED_SELECTION:
{
  "response": "I found a perfect feed that covers business news with a focus on renewable energy developments.",
  "feedId": "feed-123"
}
</example>`;
interface SearchRequest {
  searchTerm: string;
}

interface FeedSelection {
  response: string;
  feedId: string;
}

interface NewFeed {
  response: string;
  feed: {
    name: string;
    description: string;
    type: string;
    gNewsCategory: Schema["Feed"]["type"]["gNewsCategory"];
    gNewsCountry: Schema["Feed"]["type"]["gNewsCountry"];
    searchTerms: string[];
    tags: string[];
  }
}

const searchForFeeds = async (searchTerm: string) => {
  console.log('Starting feed search with term:', searchTerm);
  try {
    const [titleResults, termResults] = await Promise.all([
      client.models.Feed.list({
        filter: {
          name: { contains: searchTerm }
        }
      }),
      client.models.Feed.list({
        filter: {
          searchTerms: { contains: searchTerm }
        }
      })
    ]);

    const allFeeds = [...(titleResults.data || []), ...(termResults.data || [])];
    const uniqueFeeds = Array.from(new Map(allFeeds.map(feed => [feed.id, feed])).values());
    
    console.log('Final unique feeds found:', uniqueFeeds);
    return uniqueFeeds;
  } catch (error) {
    console.error('Error searching for feeds:', error);
    return [];
  }
};

const createFeed = async (feedData: NewFeed['feed']) => {
  console.log('Attempting to create new feed with data:', feedData);
  try {
    const websiteId = await createOrGetGnewsWebsiteId();
    const completeFeedData = { ...feedData, websiteId, url: 'gnews://', type: 'GNEWS' as const };
    const result = await client.models.Feed.create(completeFeedData);
    console.log('Feed creation result:', result);
    return result;
  } catch (error) {
    console.error('Error creating feed:', error);
    throw error;
  }
};

const createOrGetGnewsWebsiteId = async () => {
  try {
    const websiteResponse = await client.models.Website.list({
      filter: {
        name: { eq: 'GNews' }
      }
    });
    if (websiteResponse.data.length > 0) {
      return websiteResponse.data[0].id;
    }
    const newWebsite = await client.models.Website.create({
      name: 'GNews',
      url: 'gnews://',
      category: 'News',
      tags: ['news', 'gnews']
    });
    if(!newWebsite.data) {
      throw new Error('Failed to create GNews website');
    }
    return newWebsite.data.id;
  } catch (error) {
    console.error('Error creating or getting GNews website:', error);
    throw error;
  }
}

async function handleLLMResponse(
  response: string,
  messages: LLMMessage[]
): Promise<{ response: string; feed: string | null }> {
  const processed = processLLMResponse(response);
  console.log('Processing response type:', processed.type);

  switch (processed.type) {
    case 'search': {
      console.log('Handling search response');
      const searchResults = await searchForFeeds(processed.data.searchTerm);
      
      messages.push({
        role: 'assistant',
        content: response
      });
      messages.push({
        role: 'system',
        content: `Search results: ${JSON.stringify(searchResults)}`
      });
      
      const nextResponse = await openClient.generateResponse(messages, {
        model: 'gpt-4-turbo-preview',
        temperature: 0.7,
        maxTokens: 800
      });
      
      // Recursively handle the next response
      return handleLLMResponse(nextResponse, messages);
    }
    
    case 'selection': {
      console.log('Handling feed selection');
      return {
        response: processed.data.response,
        feed: processed.data.feedId
      };
    }
    
    case 'creation': {
      console.log('Handling feed creation');
      const newFeed = await createFeed(processed.data.feed);
      return {
        response: processed.data.response,
        feed: newFeed.data ? newFeed.data.id : null
      };
    }
    
    case 'conversation':
    default: {
      console.log('Handling conversation response');
      return {
        response: processed.data.response,
        feed: null
      };
    }
  }
}

const processLLMResponse = (response: string) => {
  console.log('Processing LLM response:', response);
  // Check for search request
  if (response.includes('SEARCH_REQUEST:')) {
    const searchJson = response.split('SEARCH_REQUEST:')[1].trim();
    const parsed = JSON.parse(searchJson) as SearchRequest;
    console.log('Parsed search request:', parsed);
    return {
      type: 'search' as const,
      data: parsed
    };
  }
  
  // Check for feed selection
  if (response.includes('FEED_SELECTION:')) {
    const selectionJson = response.split('FEED_SELECTION:')[1].trim();
    const parsed = JSON.parse(selectionJson) as FeedSelection;
    console.log('Parsed feed selection:', parsed);
    return {
      type: 'selection' as const,
      data: parsed
    };
  }
  
  // Check for new feed creation
  if (response.includes('NEW_FEED:')) {
    const feedJson = response.split('NEW_FEED:')[1].trim();
    const parsed = JSON.parse(feedJson) as NewFeed;
    console.log('Parsed new feed request:', parsed);
    return {
      type: 'creation' as const,
      data: parsed
    };
  }
  
  // Regular conversation response
  console.log('Processing as regular conversation');
  return {
    type: 'conversation' as const,
    data: { response: response.trim() }
  };
};

export const handler: Schema["chatWithLLM"]["functionHandler"] = async (event): Promise<{ response?: string | null; feed?: string | null } | null> => {
  console.log('Handler started with event:', event);
  const { message, chatHistory } = event.arguments;

  if (!message || !chatHistory) {
    console.error('Missing required parameters:', { message: !message, chatHistory: !chatHistory });
    throw new Error(`Missing required parameters: ${!message ? 'message ' : ''}${!chatHistory ? 'chatHistory' : ''}`);
  }

  try {
    const messages = chatHistory as LLMMessage[];

    if (!messages.some(msg => msg.role === 'system')) {
      messages.unshift({
        role: 'system',
        content: SYSTEM_PROMPT
      });
    }

    messages.push({
      role: 'user',
      content: message
    });

    const initialResponse = await openClient.generateResponse(messages, {
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
      maxTokens: 800
    });

    // Use the new handleLLMResponse function to process the response
    const result = await handleLLMResponse(initialResponse, messages);
    
    return {
      response: result.response,
      feed: result.feed
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
