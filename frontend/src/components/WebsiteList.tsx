import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import { Collection, Card, Heading, Text, View, Button, Loader } from '@aws-amplify/ui-react';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

function WebsiteList() {
  const [websites, setWebsites] = useState<Schema['Website']['type'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWebsites() {
      try {
        const response = await client.models.Website.list();
        setWebsites(response.data);
      } catch (err) {
        console.error('Error fetching websites:', err);
        setError('Failed to load websites. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchWebsites();
  }, []);

  if (loading) return <Loader variation="linear" />;
  if (error) return <Text color="red">{error}</Text>;

  return (
    <View padding="1rem">
      <Heading level={2}>All Websites</Heading>
      <Collection
        type="grid"
        items={websites}
        gap="1rem"
        templateColumns="1fr 1fr 1fr"
      >
        {(website) => (
          <Card key={website.id} padding="1rem">
            <Heading level={3}>{website.name}</Heading>
            <Text>{website.url}</Text>
            {website.category && <Text>Category: {website.category}</Text>}
            {website.tags && website.tags.length > 0 && (
              <Text>Tags: {website.tags.join(', ')}</Text>
            )}
            <Button
              as={Link}
              to={`/website/${website.id}`}
              variation="primary"
              marginTop="1rem"
            >
              View Articles
            </Button>
          </Card>
        )}
      </Collection>
    </View>
  );
}

export default WebsiteList;