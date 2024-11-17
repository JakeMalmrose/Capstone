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


async function checkArticleExists(url: string, feedId: string): Promise<boolean> {
  // Add retries with exponential backoff for the existence check
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second base delay
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Checking existence of article (attempt ${attempt + 1}/${maxRetries}):`, { url, feedId });
      
      const existingArticles = await client.models.Article.list({
        filter: {
          url: { eq: url },
          feedId: { eq: feedId }
        }
      });

      if (existingArticles.errors) {
        console.error('Error checking article existence:', existingArticles.errors);
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
        continue;
      }

      console.log('Existing articles found:', existingArticles.data.length);
      
      if (existingArticles.data.length > 0) {
        console.log('Found existing article(s):', existingArticles.data.map(a => a.id));
        return true;
      }
      
      // Add a small delay even on success to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 500));
      return false;
    } catch (error) {
      console.error(`Article existence check failed (attempt ${attempt + 1}):`, error);
      if (attempt === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
    }
  }
  
  return false;
}

async function createArticle(article: any): Promise<ArticleCreationResult> {
  console.log('Starting article creation process for:', {
    url: article.url,
    title: article.title,
    feedId: article.feedId
  });

  try {
    // Validate required fields
    if (!article.url || !article.title || !article.feedId) {
      throw new Error(`Missing required fields: ${JSON.stringify({ 
        hasUrl: !!article.url, 
        hasTitle: !!article.title, 
        hasFeedId: !!article.feedId 
      })}`);
    }

    // Double-check existence with retries before creation
    const exists = await checkArticleExists(article.url, article.feedId);
    if (exists) {
      return { 
        success: false, 
        error: 'Article already exists'
      };
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

    // Create with retries
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        console.log(`Attempt ${attempts + 1} of ${maxAttempts} to create article`);
        
        // Final existence check right before creation
        const finalCheck = await checkArticleExists(article.url, article.feedId);
        if (finalCheck) {
          return { 
            success: false, 
            error: 'Article already exists (caught in final check)'
          };
        }

        const result = await client.models.Article.create(normalizedArticle);
        
        if (result.errors) {
          throw new Error(`Article creation failed: ${JSON.stringify(result.errors)}`);
        }

        if (!result.data) {
          throw new Error('Article creation returned no data');
        }

        // Wait for a moment to ensure consistency
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verify creation
        const verification = await client.models.Article.get({ id: result.data.id });
        if (!verification.data) {
          throw new Error('Article creation verification failed');
        }

        return { success: true, article: result.data };
      } catch (error) {
        attempts++;
        console.error(`Creation attempt ${attempts} failed:`, error);
        
        if (attempts === maxAttempts) {
          throw error;
        }
        
        // Exponential backoff with jitter
        const jitter = Math.random() * 500;
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempts) * 1000 + jitter)
        );
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

    // Process articles sequentially instead of in parallel
    console.log(`Processing ${articles.length} articles sequentially`);
    
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      console.log(`Processing article ${i + 1}/${articles.length}`);
      
      try {
        const creationResult = await createArticle(article);

        if (creationResult.success && creationResult.article) {
          results.created++;
          results.successfulArticles.push(creationResult.article);
          console.log(`Successfully created article: ${creationResult.article.id}`);
        } else if (creationResult.error?.includes('Article already exists')) {
          results.duplicates++;
          console.log(`Skipped duplicate article: ${article.url}`);
        } else {
          results.errors++;
          console.error('Article creation failed:', {
            url: article.url,
            error: creationResult.error
          });
        }

        // Add delay between articles to ensure database consistency
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        results.errors++;
        console.error('Article processing error:', {
          url: article.url,
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
