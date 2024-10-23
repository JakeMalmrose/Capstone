import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
import { Collection, Card, Heading, Text, View, Loader, Button } from '@aws-amplify/ui-react';
import type { Schema } from '../../amplify/data/resource';
import { fetchAuthSession, JWT } from 'aws-amplify/auth';

const client = generateClient<Schema>();

function WebsiteFeeds() {
  const { websiteId } = useParams<{ websiteId: string }>();
  const [website, setWebsite] = useState<Schema['Website']['type'] | null>(null);
  const [feeds, setFeeds] = useState<Schema['Feed']['type'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<JWT | null>(null);

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

  const writeRssToDB = async () => {
    if (!website) return;
    try {
      const result = await client.mutations.rssToDB({ websiteId: website.id, feedUrl: website.url }, { headers: { Authorization: `Bearer something` } }); 
      console.log({
        success: true,
        message: result.data?.message || "RSS written to DB successfully"
      });
    } catch (err) {
      console.log({
        success: false,
        message: (err instanceof Error ? err.message : "Unknown error") || "Error writing RSS to DB"
      });
    }
  };

  useEffect(() => {
    async function fetchToken() {
      return;
      try {
        const session = await fetchAuthSession();
        if (session) {
          if (session.tokens?.accessToken) {
            setToken(session.tokens.accessToken);
          }
        }
      } catch (err) {
        console.error('Error fetching token:', err);
        setError('Failed to fetch token. Please try again later.');
      }
    }

    fetchToken();
  }, [token]);

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
      <Button onClick={writeRssToDB} variation="primary" marginTop="1rem">
        Write RSS to DB
      </Button>
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