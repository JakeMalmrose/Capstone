import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import { Collection, Card, Heading, Text, View, Loader } from '@aws-amplify/ui-react';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

function WebsiteFeeds() {
  const { websiteId } = useParams<{ websiteId: string }>();
  const [website, setWebsite] = useState<Schema['Website']['type'] | null>(null);
  const [feeds, setFeeds] = useState<Schema['Feed']['type'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWebsiteAndFeeds() {
      if (!websiteId) return;
      
      try {
        // Fetch the website
        const websiteResponse = await client.models.Website.get({ id: websiteId });
        setWebsite(websiteResponse.data);

        // Fetch the feeds for this website
        const feedsResponse = await client.models.Feed.list({
          filter: { websiteId: { eq: websiteId } }
        });
        setFeeds(feedsResponse.data);
      } catch (err) {
        console.error('Error fetching website and feeds:', err);
        setError('Failed to load website and feeds. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchWebsiteAndFeeds();
  }, [websiteId]);

  if (loading) return <Loader variation="linear" />;
  if (error) return <Text color="red">{error}</Text>;
  if (!website) return <Text>Website not found</Text>;

  return (
    <View padding="1rem">
      <Heading level={2}>{website.name} Feeds</Heading>
      <Text>{website.url}</Text>
      {website.category && <Text>Category: {website.category}</Text>}
      {website.tags && website.tags.length > 0 && (
        <Text>Tags: {website.tags.join(', ')}</Text>
      )}
      <Collection
        type="list"
        items={feeds}
        gap="1rem"
        padding="1rem 0"
      >
        {(feed) => (
          <Card key={feed.id} padding="1rem">
            <Heading level={3}>{feed.name}</Heading>
            <Text>{feed.url}</Text>
            {feed.description && <Text>{feed.description}</Text>}
            <Text>Type: {feed.type}</Text>
            {feed.tags && feed.tags.length > 0 && (
              <Text>Tags: {feed.tags.join(', ')}</Text>
            )}
            <Link to={`/feed/${feed.id}`}>View Feed</Link>
          </Card>
        )}
      </Collection>
    </View>
  );
}

export default WebsiteFeeds;
