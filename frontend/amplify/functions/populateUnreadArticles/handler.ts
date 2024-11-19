import client from '../../services/client';

export const handler = async (event: { 
  userId: string;
  feedId: string;
}) => {
  try {
    const { userId, feedId } = event;

    // Fetch the feed to get websiteId
    const feedResponse = await client.models.Feed.get({ id: feedId });
    const feed = feedResponse.data;
    if (!feed) {
      throw new Error('Feed not found');
    }

    // Fetch existing articles for this feed
    const articlesResponse = await client.models.Article.list({
      filter: { feedId: { eq: feedId } }
    });
    const articles = articlesResponse.data;

    // Create UnreadArticle entries for each article
    const unreadArticles = await Promise.all(
      articles.map(async (article) => {
        try {
          const unreadArticle = await client.models.UnreadArticle.create({
            userId,
            feedId,
            articleId: article.id,
            createdAt: article.createdAt || new Date().toISOString(),
            title: article.title,
            url: article.url,
            feedName: feed.name,
            websiteId: feed.websiteId
          });
          return {
            articleId: article.id,
            success: true
          };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          return {
            articleId: article.id,
            success: false,
            error: errorMessage
          };
        }
      })
    );

    return {
      success: true,
      message: `Created ${unreadArticles.length} unread article entries`,
      results: unreadArticles
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      message: `Error populating unread articles: ${errorMessage}`,
      results: []
    };
  }
};
