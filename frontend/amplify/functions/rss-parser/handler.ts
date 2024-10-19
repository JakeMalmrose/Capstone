// rss-parser/handler.ts
import Parser from 'rss-parser';

const rssParser = new Parser();

export const handler = async (event: {
  arguments: { feedUrl: string; websiteId: string };
}) => {
  const { feedUrl, websiteId } = event.arguments;

  try {
    // Parse the RSS feed
    const feed = await rssParser.parseURL(feedUrl);

    const feedData = {
      name: feed.title || 'Unnamed Feed',
      url: feedUrl,
      description: feed.description || '',
      type: 'RSS',
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
      articlesData,
      message: `Processed ${articlesData.length} articles from the RSS feed.`,
    };
  } catch (error) {
    console.error('Error processing RSS feed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `Error processing RSS feed: ${errorMessage}`,
    };
  }
};
