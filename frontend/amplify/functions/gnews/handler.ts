import axios from 'axios';
import type { Schema } from "../../data/resource";
import { generateClient } from "@aws-amplify/api";
import { Amplify } from '@aws-amplify/core';
import client from '../../services/client';

type Nullable<T> = T | null;

export const handler: Schema["fetchGNews"]["functionHandler"] = async (event) => {
  const { websiteId, feedId } = event.arguments;

  if (!websiteId || !feedId) {
    throw new Error('websiteId and feedId are required');
  }

  // Fetch the feed to get its GNews parameters
  const feed = await client.models.Feed.get({ id: feedId });
  console.log('Fetched feed:', JSON.stringify(feed));
  console.log("Feed search terms: ", feed.data?.searchTerms);
  
  
  if (!feed.data) {
    throw new Error(`Feed with ID ${feedId} not found`);
  }

  return fetchGNewsArticles(websiteId, feedId, feed.data);
};

type GNewsArticle = {
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
};

type GNewsResponse = {
  totalArticles: number;
  articles: GNewsArticle[];
};

type FeedData = {
  gNewsCategory?: string | null;
  gNewsCountry?: string | null;
  searchTerms?: Nullable<string>[] | null;
};

const fetchGNewsArticles = async function(
  websiteId: string,
  feedId: string,
  feed: FeedData,
) {
  try {
    const apiKey = process.env.GNEWS_API_KEY;
    // Use search endpoint instead of top-headlines for better search and category support
    const baseUrl = "https://gnews.io/api/v4/search";
    if (!apiKey) {
      throw new Error('GNEWS_API_KEY is not set');
    }
    
    // Build query parameters
    const queryParams: Record<string, string> = {
      apikey: apiKey,
      lang: 'en'
    };

    // Add parameters from feed if they exist
    if (feed.gNewsCountry) queryParams.country = feed.gNewsCountry;
    if (feed.gNewsCategory) queryParams.category = feed.gNewsCategory;
    
    // Join search terms with OR operator if they exist, filtering out null values
    if (feed.searchTerms && feed.searchTerms.length > 0) {
      const validSearchTerms = feed.searchTerms.filter((term): term is string => term !== null);
      if (validSearchTerms.length > 0) {
        queryParams.q = validSearchTerms.join(' OR ');
      }
    } else if (feed.gNewsCategory) {
      // If no search terms but category exists, use category as a general search term
      queryParams.q = feed.gNewsCategory;
    } else {
      // Default search if no terms or category specified
      queryParams.q = 'news';
    }

    const params = new URLSearchParams(queryParams);

    const response = await axios.get(`${baseUrl}?${params.toString()}`);
    
    if (response.status !== 200) {
      throw new Error(`GNews API responded with status: ${response.status}`);
    }

    const data = response.data as GNewsResponse;
    console.log(`Received ${data.articles.length} articles from GNews API`);

    // Process articles
    const articles = data.articles.map((article) => ({
      feedId,
      url: article.url,
      title: article.title,
      fullText: article.content,
      createdAt: new Date(article.publishedAt).toISOString(),
      // Use feed parameters for tags and add each valid search term as a separate tag
      tags: [
        feed.gNewsCategory || 'general',
        feed.gNewsCountry || 'us',
        ...(feed.searchTerms?.filter((term): term is string => term !== null).map(term => 'search:' + term) || [])
      ]
    }));

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process articles sequentially to ensure accurate counting
    for (const article of articles) {
      try {
        // Check if article already exists
        const existingArticles = await client.models.Article.list({
          filter: {
            url: { eq: article.url },
            feedId: { eq: feedId }
          }
        });

        if (existingArticles.data.length === 0) {
          // Create new article if it doesn't exist
          const result = await client.models.Article.create(article);
          if (result.data) {
            createdCount++;
            console.log(`Created new article: ${article.title}`);
            console.log("Article creation result data: ", JSON.stringify(result.data));
          } else {
            errorCount++;
            console.error(`Failed to create article: ${article.title}`);
          }
        } else {
          skippedCount++;
          console.log(`Skipped existing article: ${article.title}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`Error processing article ${article.title}:`, error);
      }
    }

    console.log(`Final counts - Created: ${createdCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);

    return {
      success: true,
      message: `Fetched ${articles.length} articles from GNews API. Created ${createdCount} new articles, skipped ${skippedCount} existing articles${errorCount > 0 ? `, failed to process ${errorCount} articles` : ''}.`,
      articles,
    };

  } catch (error) {
    console.error('Error in fetchGNewsArticles:', error);
    throw error;
  }
};
