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
    console.log('Starting article creation process for:', {
      url: article.url,
      title: article.title,
      feedId: article.feedId
    });

    // Validate required fields
    if (!article.url || !article.title || !article.feedId) {
      console.log('Missing required fields:', { 
        hasUrl: !!article.url, 
        hasTitle: !!article.title, 
        hasFeedId: !!article.feedId 
      });
      throw new Error(`Missing required fields: ${JSON.stringify({ 
        hasUrl: !!article.url, 
        hasTitle: !!article.title, 
        hasFeedId: !!article.feedId 
      })}`);
    }

    // Normalize article data
    const normalizedArticle = {
      feedId: article.feedId,
      url: article.url,
      title: article.title?.substring(0, 1000) || '',
      fullText: article.fullText?.substring(0, 400000) || '',
      createdAt: article.createdAt || new Date().toISOString(),
      tags: Array.isArray(article.tags) ? article.tags : []
    };

    console.log('Normalized article data:', normalizedArticle);

    // Check for existing article with retries
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      console.log(`Attempt ${attempts + 1} of ${maxAttempts} to create article`);
      try {
        // Check for existing article
        const existingArticles = await client.models.Article.list({
          filter: {
            url: { eq: article.url },
            feedId: { eq: article.feedId }
          }
        });

        if (existingArticles.errors) {
          console.log('Error checking for existing article:', existingArticles.errors);
          throw new Error(`Error checking for existing article: ${JSON.stringify(existingArticles.errors)}`);
        }

        console.log('Existing articles check result:', {
          count: existingArticles.data.length,
          articles: existingArticles.data.map(a => ({
            id: a.id,
            url: a.url,
            feedId: a.feedId
          }))
        });

        // If article exists, return early
        if (existingArticles.data && existingArticles.data.length > 0) {
          console.log('Article already exists, skipping creation');
          return { 
            success: false, 
            error: 'Article already exists'
          };
        }

        console.log('No existing article found, proceeding with creation');

        // Attempt to create the article
        const result = await client.models.Article.create(normalizedArticle);
        
        if (result.errors) {
          console.log('Article creation failed with errors:', result.errors);
          throw new Error(`Article creation failed: ${JSON.stringify(result.errors)}`);
        }

        if (!result.data) {
          console.log('Article creation returned no data');
          throw new Error('Article creation returned no data');
        }

        // Double-check creation was successful
        console.log('Verifying article creation');
        const verification = await client.models.Article.get({ id: result.data.id });
        if (!verification.data) {
          console.log('Article creation verification failed');
          throw new Error('Article creation verification failed');
        }

        console.log('Article created successfully:', {
          id: result.data.id,
          url: result.data.url
        });

        return { success: true, article: result.data };
      } catch (error) {
        attempts++;
        
        // If this is a duplicate error from the GraphQL API, handle it gracefully
        if (error instanceof Error && 
            (error.message.includes('duplicate key') || 
             error.message.includes('unique constraint'))) {
          console.log('Detected concurrent creation attempt');
          return { 
            success: false, 
            error: 'Article already exists (concurrent creation detected)'
          };
        }

        console.log(`Attempt ${attempts} failed:`, error);

        if (attempts === maxAttempts) {
          throw error;
        }

        // Exponential backoff with jitter
        const jitter = Math.random() * 100;
        const delay = Math.pow(2, attempts) * 100 + jitter;
        console.log(`Retrying after ${delay}ms delay`);
        await new Promise(resolve => setTimeout(resolve, delay));
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
    console.log('Starting fetchGNewsArticles for feed:', feedId);
    const apiKey = process.env.GNEWS_API_KEY;
    if (!apiKey) {
      throw new Error('GNEWS_API_KEY is not set');
    }

    const queryParams = buildQueryParams(apiKey, feed);
    console.log('Fetching articles with params:', queryParams.toString());
    const response = await fetchArticles(queryParams);
    const articles = transformArticles(response.data, feedId, feed);
    console.log(`Transformed ${articles.length} articles for processing`);

    // Process articles in smaller batches to reduce concurrency issues
    const batchSize = 3;
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}, size: ${batch.length}`);
      
      const batchResults = await Promise.all(
        batch.map(async (article) => {
          try {
            const creationResult = await createArticle(article);

            if (creationResult.success && creationResult.article) {
              results.created++;
              results.successfulArticles.push(creationResult.article);
              console.log('Article created successfully:', {
                url: article.url,
                resultId: creationResult.article.id
              });
            } else if (creationResult.error?.includes('Article already exists')) {
              results.duplicates++;
              console.log('Duplicate article detected:', article.url);
            } else {
              results.errors++;
              console.error('Article creation failed:', {
                url: article.url,
                error: creationResult.error
              });
            }
          } catch (error) {
            results.errors++;
            console.error('Article processing error:', {
              url: article.url,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        })
      );

      console.log(`Batch ${Math.floor(i/batchSize) + 1} complete. Current results:`, results);
      // Add a small delay between batches to reduce pressure
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('Final results:', results);
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
