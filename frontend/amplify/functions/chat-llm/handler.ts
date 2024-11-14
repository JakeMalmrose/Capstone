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
    // Search in both title and searchTerms
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

    console.log('Title search results:', titleResults.data);
    console.log('Term search results:', termResults.data);

    // Combine and deduplicate results
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

    // Ensure system message is present
    if (!messages.some(msg => msg.role === 'system')) {
      console.log('Adding system prompt to messages');
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

    console.log('Getting initial response from LLM');
    // Get initial response from LLM
    const initialResponse = await openClient.generateResponse(messages, {
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
      maxTokens: 800
    });

    console.log('Initial LLM response:', initialResponse);

    // Process the response
    const processedResponse = processLLMResponse(initialResponse);
    console.log('Processed response type:', processedResponse.type);

    // Handle different response types
    switch (processedResponse.type) {
      case 'search': {
        console.log('Handling search response');
        // Perform search and add results to conversation
        const searchResults = await searchForFeeds(processedResponse.data.searchTerm);
        console.log('Search results:', searchResults);
        
        // Add search results to conversation and get next response
        messages.push({
          role: 'assistant',
          content: initialResponse
        });
        messages.push({
          role: 'system',
          content: `Search results: ${JSON.stringify(searchResults)}`
        });
        
        console.log('Getting next response from LLM');
        const nextResponse = await openClient.generateResponse(messages, {
          model: 'gpt-4-turbo-preview',
          temperature: 0.7,
          maxTokens: 800
        });
        
        console.log('Next LLM response:', nextResponse);
        const finalProcessed = processLLMResponse(nextResponse);
        console.log('Final processed response type:', finalProcessed.type);
        
        // Handle feed selection or creation
        if (finalProcessed.type === 'selection') {
          const selectedFeed = searchResults.find(feed => feed.id === finalProcessed.data.feedId);
          console.log('Selected feed:', selectedFeed);
          return {
            response: finalProcessed.data.response,
            feed: selectedFeed ? selectedFeed.id : null
          };
        } else if (finalProcessed.type === 'creation') {
          console.log('Creating new feed');
          const newFeed = await createFeed(finalProcessed.data.feed);
          console.log('New feed created:', newFeed);
          return {
            response: finalProcessed.data.response,
            feed: newFeed.data ? newFeed.data.id : null
          };
        }
        break;
      }
      
      case 'selection':
      case 'creation': {
        // Handle direct selection or creation (shouldn't normally happen)
        console.warn('Received direct selection/creation without search step');
        return {
          response: processedResponse.data.response,
          feed: null
        };
      }
      
      case 'conversation':
      default: {
        // Regular conversation response
        console.log('Returning conversation response');
        return {
          response: processedResponse.data.response,
          feed: null
        };
      }
    }

    // Fallback response if something unexpected happened
    console.warn('Reached fallback response');
    return {
      response: "I apologize, but I encountered an unexpected situation. Please try your request again.",
      feed: null
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
