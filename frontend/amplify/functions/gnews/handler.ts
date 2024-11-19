import axios from 'axios';
import type { Schema } from "../../data/resource";
import client from '../../services/client';

type Nullable<T> = T | null;

interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
}

interface GNewsResponse {
  totalArticles: number;
  articles: GNewsArticle[];
}

interface FeedData {
  gNewsCategory?: string | null;
  gNewsCountry?: string | null;
  searchTerms?: Nullable<string>[] | null;
}

interface ArticleCreationResult {
  success: boolean;
  article?: any;
  error?: any;
}

export const handler: Schema["fetchGNews"]["functionHandler"] = async (event) => {
  const { websiteId, feedId } = event.arguments;

  if (!websiteId || !feedId) {
    throw new Error('websiteId and feedId are required');
  }

  try {
    // Fetch and validate feed
    const feed = await client.models.Feed.get({ id: feedId });
    
    if (!feed.data) {
      throw new Error(`Feed with ID ${feedId} not found`);
    }

    if (feed.errors) {
      throw new Error(`Error fetching feed: ${JSON.stringify(feed.errors)}`);
    }

    return await fetchGNewsArticles(websiteId, feedId, feed.data);
  } catch (error) {
    console.error('Handler error:', error);
    throw error;
  }
};

async function createArticle(article: any): Promise<ArticleCreationResult> {
  try {
    // Validate required fields before attempting creation
    if (!article.url || !article.title || !article.feedId) {
      throw new Error(`Missing required fields: ${JSON.stringify({ 
        hasUrl: !!article.url, 
        hasTitle: !!article.title, 
        hasFeedId: !!article.feedId 
      })}`);
    }

    // Normalize article data
    const normalizedArticle = {
      ...article,
      fullText: article.fullText?.substring(0, 400000) || '', // Prevent potential field length issues
      title: article.title?.substring(0, 1000) || '', // Add reasonable limits
      createdAt: article.createdAt || new Date().toISOString(),
      tags: Array.isArray(article.tags) ? article.tags : []
    };

    // Attempt creation with retry logic
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const result = await client.models.Article.create(normalizedArticle);
        
        if (result.errors) {
          throw new Error(`Article creation failed: ${JSON.stringify(result.errors)}`);
        }

        if (!result.data) {
          throw new Error('Article creation returned no data');
        }

        // Verify creation
        const verification = await client.models.Article.get({ id: result.data.id });
        if (!verification.data) {
          throw new Error('Article creation verification failed');
        }

        return { success: true, article: result.data };
      } catch (error) {
        attempts++;
        if (attempts === maxAttempts) {
          throw error;
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 100));
      }
    }

    throw new Error('Max retry attempts reached');
  } catch (error) {
    console.error('Article creation error:', {
      articleUrl: article.url,
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : error
    });

    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during article creation'
    };
  }
}

async function createArticleWithUnreadEntries(article: any): Promise<ArticleCreationResult> {
  try {
    // First create the article as before
    const articleResult = await createArticle(article);
    if (!articleResult.success || !articleResult.article) {
      return articleResult;
    }

    // Get all subscribers to this feed
    const subscribers = await client.models.UserFeedSubscription.list({
      filter: { feedId: { eq: article.feedId } }
    });

    if (subscribers.errors) {
      console.error('Error fetching subscribers:', subscribers.errors);
      // Article was created but we failed to create unread entries
      return { 
        success: true, 
        article: articleResult.article,
        error: 'Failed to create some unread entries'
      };
    }

    // Create UnreadArticle entries for each subscriber
    const unreadPromises = subscribers.data.map(subscription => 
      client.models.UnreadArticle.create({
        userId: subscription.userId,
        feedId: article.feedId,
        articleId: articleResult.article.id,
        createdAt: article.createdAt || new Date().toISOString(),
        // Denormalized fields for performance
        title: article.title,
        url: article.url,
        feedName: article.feedName, // You might need to fetch this
        websiteId: article.websiteId // You might need to fetch this
      })
    );

    // Wait for all UnreadArticle creations, but don't fail if some fail
    const unreadResults = await Promise.allSettled(unreadPromises);
    
    const failedUnreads = unreadResults.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected'
    );

    if (failedUnreads.length > 0) {
      console.error('Some UnreadArticle creations failed:', {
        articleId: articleResult.article.id,
        failedCount: failedUnreads.length,
        firstError: failedUnreads[0].reason
      });
    }

    return {
      success: true,
      article: articleResult.article,
      error: failedUnreads.length > 0 
        ? `Article created but ${failedUnreads.length} unread entries failed`
        : undefined
    };
  } catch (error) {
    console.error('Article creation with unread entries error:', {
      articleUrl: article.url,
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : error
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during article creation'
    };
  }
}

async function fetchGNewsArticles(
  websiteId: string,
  feedId: string,
  feed: FeedData,
) {
  const results = {
    created: 0,
    skipped: 0,
    errors: 0,
    successfulArticles: [] as any[]
  };

  try {
    const apiKey = process.env.GNEWS_API_KEY;
    if (!apiKey) {
      throw new Error('GNEWS_API_KEY is not set');
    }

    const queryParams = buildQueryParams(apiKey, feed);
    const response = await fetchArticles(queryParams);
    const articles = transformArticles(response.data, feedId, feed);

    // Process articles with better error handling
    for (const article of articles) {
      try {
        const exists = await checkArticleExists(article.title, feedId);
        
        if (exists) {
          results.skipped++;
          continue;
        }

        const creationResult = await createArticleWithUnreadEntries(article);

        if (creationResult.success && creationResult.article) {
          results.created++;
          results.successfulArticles.push(creationResult.article);
        } else {
          results.errors++;
          console.error('Article creation failed:', {
            title: article.title,
            error: creationResult.error
          });
        }
      } catch (error) {
        results.errors++;
        console.error('Article processing error:', {
          title: article.title,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      success: true,
      message: formatResultMessage(results),
      articles: results.successfulArticles,
    };

  } catch (error) {
    console.error('Fatal error in fetchGNewsArticles:', error);
    throw error;
  }
}

// Helper functions
function buildQueryParams(apiKey: string, feed: FeedData): URLSearchParams {
  const params: Record<string, string> = {
    apikey: apiKey,
    lang: 'en',
    expand: 'content',
    nullable: 'image'
  };

  if (feed.gNewsCountry) params.country = feed.gNewsCountry;
  if (feed.gNewsCategory) params.category = feed.gNewsCategory;
  
  params.q = buildSearchQuery(feed);

  return new URLSearchParams(params);
}

function buildSearchQuery(feed: FeedData): string {
  if (feed.searchTerms?.length) {
    const validTerms = feed.searchTerms.filter((term): term is string => !!term);
    if (validTerms.length) return validTerms.join(' OR ');
  }
  
  return feed.gNewsCategory || 'news';
}

async function fetchArticles(params: URLSearchParams): Promise<{ data: GNewsResponse }> {
  const baseUrl = "https://gnews.io/api/v4/search";
  const response = await axios.get(`${baseUrl}?${params.toString()}`);
  
  if (response.status !== 200) {
    throw new Error(`GNews API responded with status: ${response.status}`);
  }

  return response;
}

function transformArticles(data: GNewsResponse, feedId: string, feed: FeedData) {
  return data.articles.map(article => ({
    feedId,
    url: article.url,
    title: article.title,
    fullText: article.content,
    createdAt: new Date(article.publishedAt).toISOString(),
    tags: [
      feed.gNewsCategory || 'general',
      feed.gNewsCountry || 'us',
      ...(feed.searchTerms?.filter((term): term is string => term !== null)
        .map(term => `search:${term}`) || [])
    ]
  }));
}

async function checkArticleExists(title: string, feedId: string): Promise<boolean> {
  const existingArticles = await client.models.Article.list({
    filter: {
      title: { eq: title },
      feedId: { eq: feedId }
    }
  });

  console.log("Existing articles in checkArticleExists:", existingArticles.data);
  return existingArticles.data.length > 0;
}

function formatResultMessage(results: { created: number, skipped: number, errors: number }) {
  return `Created ${results.created} new articles, skipped ${results.skipped} existing articles${
    results.errors > 0 ? `, failed to process ${results.errors} articles` : ''
  }.`;
}
