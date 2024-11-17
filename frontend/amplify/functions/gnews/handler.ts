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
    if (!article.url || !article.title || !article.feedId) {
      throw new Error(`Missing required fields: ${JSON.stringify({ 
        hasUrl: !!article.url, 
        hasTitle: !!article.title, 
        hasFeedId: !!article.feedId 
      })}`);
    }

    const normalizedArticle = {
      ...article,
      fullText: article.fullText?.substring(0, 400000) || '',
      title: article.title?.substring(0, 1000) || '',
      createdAt: article.createdAt || new Date().toISOString(),
      tags: Array.isArray(article.tags) ? article.tags : []
    };

    // First, try to get an existing article with a composite key of URL and feedId
    const existingArticles = await client.models.Article.list({
      filter: {
        url: { eq: article.url },
        feedId: { eq: article.feedId }
      }
    });

    // If article exists, return early with success: false
    if (existingArticles.data.length > 0) {
      return { 
        success: false, 
        error: 'Article already exists'
      };
    }

    // If no existing article, attempt creation with optimistic locking
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        // Add a unique constraint violation check
        const result = await client.models.Article.create({
          ...normalizedArticle,
          // Add a composite unique identifier
          uniqueIdentifier: `${article.feedId}-${Buffer.from(article.url).toString('base64')}`
        });
        
        if (result.errors) {
          // Check if error is due to unique constraint violation
          if (result.errors.some(e => e.message?.includes('unique constraint') || e.message?.includes('duplicate key'))) {
            return { 
              success: false, 
              error: 'Article already exists (concurrent creation detected)'
            };
          }
          throw new Error(`Article creation failed: ${JSON.stringify(result.errors)}`);
        }

        if (!result.data) {
          throw new Error('Article creation returned no data');
        }

        return { success: true, article: result.data };
      } catch (error) {
        attempts++;
        if (attempts === maxAttempts) {
          throw error;
        }
        // Exponential backoff with jitter to prevent thundering herd
        const jitter = Math.random() * 100;
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 100 + jitter));
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

async function fetchGNewsArticles(
  websiteId: string,
  feedId: string,
  feed: FeedData,
) {
  const results = {
    created: 0,
    skipped: 0,
    errors: 0,
    duplicates: 0,
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

    // Process articles concurrently with rate limiting
    const concurrencyLimit = 3; // Adjust based on your needs
    const chunks = [];
    for (let i = 0; i < articles.length; i += concurrencyLimit) {
      chunks.push(articles.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(async (article) => {
          try {
            const creationResult = await createArticle(article);

            if (creationResult.success && creationResult.article) {
              results.created++;
              results.successfulArticles.push(creationResult.article);
              return { type: 'success' };
            } else if (creationResult.error === 'Article already exists' || 
                      creationResult.error === 'Article already exists (concurrent creation detected)') {
              results.duplicates++;
              return { type: 'duplicate' };
            } else {
              results.errors++;
              console.error('Article creation failed:', {
                url: article.url,
                error: creationResult.error
              });
              return { type: 'error' };
            }
          } catch (error) {
            results.errors++;
            console.error('Article processing error:', {
              url: article.url,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            return { type: 'error' };
          }
        })
      );
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

// Helper functions remain mostly the same, updated formatResultMessage
function formatResultMessage(results: { 
  created: number, 
  skipped: number, 
  errors: number,
  duplicates: number 
}) {
  return `Created ${results.created} new articles, detected ${results.duplicates} duplicate articles${
    results.errors > 0 ? `, failed to process ${results.errors} articles` : ''
  }.`;
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

async function checkArticleExists(url: string, feedId: string): Promise<boolean> {
  const existingArticles = await client.models.Article.list({
    filter: {
      url: { eq: url },
      feedId: { eq: feedId }
    }
  });

  return existingArticles.data.length > 0;
}