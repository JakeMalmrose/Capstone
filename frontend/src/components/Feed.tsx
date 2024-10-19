import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
import { Collection, Card, Heading, Text, View, Loader, Button } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

// Define interfaces for the data structures
interface FeedData {
  name: string;
  url: string;
  description: string;
  type: string;
  websiteId: string;
}

interface ArticleData {
  url: string;
  title: string;
  fullText: string;
  createdAt: string;
}

interface ProcessRssFeedResponse {
  success: boolean;
  feedData: FeedData;
  articlesData: ArticleData[];
}

function Feed() {
  const { feedId } = useParams<{ feedId: string }>();
  const [feed, setFeed] = useState<Schema['Feed']['type'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [articles, setArticles] = useState<Schema['Article']['type'][]>([]);

  const fetchFeedArticles = async () => {
    if (!feedId) return;

    setLoading(true);
    try {
      // Fetch the feed
      const feedResponse = await client.models.Feed.get({ id: feedId });
      setFeed(feedResponse.data);

      // Fetch the articles for this feed
      const articlesResponse = await client.models.Article.list({
        filter: { feedId: { eq: feedId } },
      });
      setArticles(articlesResponse.data);
    } catch (err) {
      console.error('Error fetching feed:', err);
      setError('Failed to load feed and articles. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const processRss = async () => {
    if (feed === null) return;
    try {
      // Fetch the current auth session
      const { accessToken } = (await fetchAuthSession()).tokens ?? {};
      if (!accessToken) {
        throw new Error('No access token found');
      }
      // Call the mutation with the user's token
      const response = await client.mutations.processRssFeed(
        { feedUrl: feed.url, websiteId: feed.websiteId },
        { authToken: accessToken.toString() }
      );

      // Cast the response data to our defined interface
      const responseData = response.data as ProcessRssFeedResponse;

      if (responseData?.success) {
        const { feedData, articlesData } = responseData;
        if (!feedData || !articlesData) {
          throw new Error('Invalid data received from processRssFeed');
        }
        // Create the feed in the database
        const createdFeedResponse = await client.models.Feed.create({
          name: feedData.name,
          url: feedData.url,
          description: feedData.description,
          type: feedData.type as any, // Cast if necessary
          websiteId: feedData.websiteId,
        });
        const createdFeed = createdFeedResponse.data;
        if (!createdFeed || !createdFeed.id) {
          throw new Error('Failed to create feed in the database');
        }
        const newFeedId = createdFeed.id;
        // Create the articles in the database, linking them to the feed
        for (const articleData of articlesData) {
          await client.models.Article.create({
            url: articleData.url,
            title: articleData.title,
            fullText: articleData.fullText,
            createdAt: articleData.createdAt,
            feedId: newFeedId,
          });
        }
        // Refresh the feed and articles
        await fetchFeedArticles();
      } else {
        console.log(response.data);

        throw new Error(response.data?.toString() || 'Failed to process RSS feed');
      }
    } catch (err) {
      console.error('Error in processRss:', err);
      setError('Failed to process RSS feed. Please try again later.');
    }
  };

  useEffect(() => {
    if (!feedId) return;
    fetchFeedArticles();
  }, [feedId]);

  if (loading) return <Loader variation="linear" />;
  if (error) return <Text color="red">{error}</Text>;
  if (!feed) return <Text>Feed not found</Text>;

  return (
    <View padding="1rem">
      <Button onClick={() => window.history.back()}>Back</Button>
      <Button onClick={processRss}>Process RSS Feed</Button>
      <Button onClick={() => window.location.reload()}>Refresh</Button>
      <Heading level={2}>{feed.name} Articles</Heading>
      <Text>{feed.url}</Text>
      {feed.tags && feed.tags.length > 0 && <Text>Tags: {feed.tags.join(', ')}</Text>}
      <Collection type="list" items={articles} gap="1rem" padding="1rem 0">
        {(article) => (
          <Card key={article.id} padding="1rem">
            <Heading level={3}>{article.title}</Heading>
            <Text>{article.url}</Text>
            <Text>{article.fullText}</Text>
          </Card>
        )}
      </Collection>
    </View>
  );
}

export default Feed;
