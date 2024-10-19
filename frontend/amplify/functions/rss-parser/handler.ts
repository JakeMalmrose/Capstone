// rss-parser/handler.ts
import { Schema } from '../../data/resource';
import { generateClient } from 'aws-amplify/api';
import Parser from 'rss-parser';
import { v4 as uuidv4 } from 'uuid';
import { Amplify } from 'aws-amplify';
import outputs from '../../../amplify_outputs.json';

Amplify.configure({
  ...outputs,
});

const rssParser = new Parser();

export const handler = async (event: {
  arguments: { feedUrl: string; websiteId: string };
}) => {
  const { feedUrl, websiteId } = event.arguments;

  const client = generateClient<Schema>();

  let feed;
  try {
    // Parse the RSS feed
    feed = await rssParser.parseURL(feedUrl);

    const feedId = uuidv4();
    await client.models.Feed.create(
      {
        id: feedId,
        name: feed.title || 'Unnamed Feed',
        url: feedUrl,
        description: feed.description,
        type: 'RSS',
        websiteId,
      },
      {
        authMode: 'lambda',
      }
    );

    // Process each item in the feed
    for (const item of feed.items) {
      const articleId = uuidv4();
      await client.models.Article.create(
        {
          id: articleId,
          url: item.link || '',
          title: item.title || 'Untitled',
          fullText: item.content || item.contentSnippet || '',
          createdAt: item.pubDate
            ? new Date(item.pubDate).toISOString()
            : new Date().toISOString(),
          feedId,
        },
        { authMode: 'lambda' }
      );
    }

    return {
      success: true,
      message: `Processed ${feed.items.length} articles from the RSS feed.`,
    };
  } catch (error) {
    console.error('Error processing RSS feed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `Error processing RSS feed: ${errorMessage}, here's the feed {${JSON.stringify(feed)}}`,
    };
  }
};
