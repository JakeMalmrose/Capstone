import { Schema } from "../../data/resource";
import { generateClient } from 'aws-amplify/api';
import Parser from 'rss-parser';
import { v4 as uuidv4 } from 'uuid';

const rssParser = new Parser();
const client = generateClient<Schema>();

export const handler = async (event: { arguments: { feedUrl: string, websiteId: string } }) => {
  const { feedUrl, websiteId } = event.arguments;

  try {
    // Parse the RSS feed
    const feed = await rssParser.parseURL(feedUrl);

    // Create or update the Feed
    const feedId = uuidv4();
    await client.models.Feed.create({
      feedId,
      name: feed.title || 'Unnamed Feed',
      url: feedUrl,
      description: feed.description,
      type: 'RSS',
      websiteId
    });

    // Process each item in the feed
    for (const item of feed.items) {
      const articleId = uuidv4();
      await client.models.Article.create({
        articleId,
        url: item.link || '',
        title: item.title || 'Untitled',
        fullText: item.content || item.contentSnippet || '',
        createdAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        feedId
      });
    }

    return {
      success: true,
      message: `Processed ${feed.items.length} articles from the RSS feed.`
    };
  } catch (error) {
    console.error('Error processing RSS feed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `Error processing RSS feed: ${errorMessage}`
    };
  }
};