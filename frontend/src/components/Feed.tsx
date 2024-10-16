import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
import { Collection, Card, Heading, Text, View, Loader, Button } from '@aws-amplify/ui-react';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

function Feed() {
  const { feedId } = useParams<{ feedId: string }>();
  const [feed, setFeed] = useState<Schema['Feed']['type'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [articles, setArticles] = useState<Schema['Article']['type'][]>([]);

  const processRss = async () => {
    if (feed === null) return;
    await client.mutations.processRssFeed({ feedUrl: feed.url, websiteId: feed.websiteId });
  }

  useEffect(() => {
    async function fetchFeedArticles() {
      if (!feedId) return;
      
      try {
        // Fetch the feed
        const feedResponse = await client.models.Feed.get({ id: feedId });
        setFeed(feedResponse.data);

        // Fetch the articles for this feed
        const articlesResponse = await client.models.Article.list({
          filter: { feedId: { eq: feedId } }
        });
        setArticles(articlesResponse.data);

      } catch (err) {
        console.error('Error fetching feed:', err);
        setError('Failed to load feed and articles. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

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
      {feed.tags && feed.tags.length > 0 && (
        <Text>Tags: {feed.tags.join(', ')}</Text>
      )}
      <Collection
        type="list"
        items={articles}
        gap="1rem"
        padding="1rem 0"
      >
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
