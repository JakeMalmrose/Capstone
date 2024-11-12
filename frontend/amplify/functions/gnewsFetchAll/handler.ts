import type { Schema } from "../../data/resource";
import client from '../../services/client';

export const handler = async () => {
  try {
    // Fetch all feeds
    const feedsResponse = await client.models.Feed.list();
    const feeds = feedsResponse.data;

    // Filter for GNEWS feeds
    const gnewsFeeds = feeds.filter(feed => feed.type === "GNEWS");

    // Process each GNEWS feed
    const results = await Promise.all(
      gnewsFeeds.map(async (feed) => {
        try {
          const result = await client.mutations.fetchGNews({
            websiteId: feed.websiteId,
            feedId: feed.id
          });
          return {
            feedId: feed.id,
            feedName: feed.name,
            success: result.data?.success ?? false,
            message: result.data?.message ?? 'No response data',
            articlesCount: result.data?.articles?.length ?? 0
          };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          return {
            feedId: feed.id,
            feedName: feed.name,
            success: false,
            message: `Error processing feed: ${errorMessage}`,
            articlesCount: 0
          };
        }
      })
    );

    return {
      success: true,
      message: `Processed ${results.length} GNEWS feeds`,
      results
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      message: `Error fetching feeds: ${errorMessage}`,
      results: []
    };
  }
};
