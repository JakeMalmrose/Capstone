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
  searchTerms?: string | null;
};

const fetchGNewsArticles = async function(
  websiteId: string,
  feedId: string,
  feed: FeedData,
) {
  try {
    const apiKey = process.env.GNEWS_API_KEY;
    const baseUrl = "https://gnews.io/api/v4/top-headlines";
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
    if (feed.searchTerms) queryParams.q = feed.searchTerms;

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
      // Use feed parameters for tags
      tags: [
        feed.gNewsCategory || 'general',
        feed.gNewsCountry || 'us',
        ...(feed.searchTerms ? ['search:' + feed.searchTerms] : [])
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