import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import { Alert, Heading, Text, View, Collection, Card } from '@aws-amplify/ui-react';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

function WebsiteArticles() {
  const { websiteId } = useParams<{ websiteId: string }>();
  const [website, setWebsite] = useState<Schema['Website']['type'] | null>(null);
  const [articles, setArticles] = useState<Array<Schema['Summary']['type']>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWebsiteAndArticles() {
      if (!websiteId) {
        setError('No website ID provided');
        setLoading(false);
        return;
      }

      try {
        // Fetch website details
        const websiteResponse = await client.models.Website.get({ id: websiteId });
        if (websiteResponse.data) {
          setWebsite(websiteResponse.data);
        } else {
          throw new Error('Website not found');
        }

        // Fetch summaries (articles) for this website
        const summariesResponse = await client.models.Summary.list({
          filter: { websiteId: { eq: websiteId } }
        });
        setArticles(summariesResponse.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch website details and articles');
      } finally {
        setLoading(false);
      }
    }

    fetchWebsiteAndArticles();
  }, [websiteId]);

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Alert variation="error">{error}</Alert>;
  if (!website) return <Alert variation="warning">Website not found</Alert>;

  return (
    <View padding="1rem">
      <Heading level={2}>{website.name}</Heading>
      <Text>{website.url}</Text>
      <Heading level={3} padding="1rem 0">Articles</Heading>
      <Collection
        type="list"
        items={articles}
        gap="1rem"
      >
        {(article) => (
          <Card key={article.id}>
            <Heading level={4}>{article.title}</Heading>
            <Text>{article.summary.substring(0, 100)}...</Text>
            <Link to={`/summary/${article.id}`}>Read more</Link>
          </Card>
        )}
      </Collection>
    </View>
  );
}

export default WebsiteArticles;