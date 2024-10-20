import Parser from 'rss-parser';
import type { Schema } from "../../data/resource"

const rssParser = new Parser();

export const handler: Schema["processRssFeed"]["functionHandler"] = async (event) => {
  const { feedUrl, websiteId } = event.arguments;

  if (typeof feedUrl !== 'string' || typeof websiteId !== 'string') {
    throw new Error('Feed URL and website ID must be strings');
  }

  return await processRssFeedHandler(feedUrl, websiteId);
}

const processRssFeedHandler = async function(feedUrl: string, websiteId: string): Promise<{ success: boolean; feedData: any; articlesData: any; message: string }> {

  try {
    // Parse the RSS feed
    const feed = await rssParser.parseURL(feedUrl);

    const feedData = {
      name: feed.title || 'Unnamed Feed',
      url: feedUrl,
      description: feed.description || '',
      type: 'RSS' as const,
      websiteId,
    };

    const articlesData = (feed.items || []).map((item) => ({
      url: item.link || '',
      title: item.title || 'Untitled',
      fullText: item.content || item.contentSnippet || '',
      createdAt: item.pubDate
        ? new Date(item.pubDate).toISOString()
        : new Date().toISOString(),
    }));

    return {
      success: true,
      feedData,
      articlesData: articlesData,
      message: `Processed ${articlesData.length} articles from the RSS feed.`,
    };
  } catch (error) {
    console.error('Error processing RSS feed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      feedData: null,
      articlesData: null,
      message: `Error processing RSS feed: ${errorMessage}`,
    };
  }
};