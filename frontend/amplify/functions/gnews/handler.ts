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

    // Store articles in the database using Promise.all
    const results = await Promise.all(
      articles.map(async (article) => {
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
            return { created: true, article: result.data };
          }
          return { created: false, article: existingArticles.data[0] };
        } catch (error) {
          console.error('Error creating article:', error);
          return { created: false, error };
        }
      })
    );

    const createdCount = results.filter(r => r.created).length;
    const lastArticleMade = results[results.length - 1]?.article;

    return {
      success: true,
      message: `Processed ${articles.length} articles, created ${createdCount} new articles.`,
      articles,
    };

  } catch (error) {
    console.error('Error in fetchGNewsArticles:', error);
    throw error;
  }
};
