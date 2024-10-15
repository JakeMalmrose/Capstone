import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
import { Alert, Heading, Text, View, Collection, Card, Button } from '@aws-amplify/ui-react';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

function WebsiteArticles() {
  const { websiteId } = useParams<{ websiteId: string }>();
  const [website, setWebsite] = useState<Schema['Website']['type'] | null>(null);
  const [articles, setArticles] = useState<Array<Schema['Summary']['type']>>([]);
  const [extractedLinks, setExtractedLinks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingLinks, setProcessingLinks] = useState(false);

  const extractWebsiteUrls = async (url: string) => {
    setProcessingLinks(true);
    setError(null);
    try {
      const result = await client.queries.extractUrls({ url: url });
      if (result.data) {
        // Filter out null values and use type assertion
        const validLinks = result.data.filter((link): link is string => link !== null);
        setExtractedLinks(validLinks);
        console.log('Extracted links:', validLinks);
      } else if (result.errors) {
        throw new Error(result.errors.map((e: { message: string }) => e.message).join(', '));
      } else {
        throw new Error('An unknown error occurred while extracting URLs from the website');
      }
    } catch (err) {
      console.error('Error extracting URLs from website:', err);
      setError(err instanceof Error ? err.message : 'Failed to extract URLs from website. Please try again.');
    } finally {
      setProcessingLinks(false);
    }
  };

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
          // Extract URLs from the website
          await extractWebsiteUrls(websiteResponse.data.url);
        } else {
          throw new Error('Website not found');
        }

        // Fetch summaries (articles) for this website
        const summariesResponse = await client.models.Summary.list({
          filter: { id: { eq: websiteId } }
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
      <Heading level={3} padding="1rem 0">Extracted Links</Heading>
      <Collection
        type="list"
        items={extractedLinks}
        gap="0.5rem"
      >
        {(link) => (
          <Text key={link}>{link}</Text>
        )}
      </Collection>
      <Heading level={3} padding="1rem 0">Articles</Heading>
      <Collection
        type="list"
        items={articles}
        gap="1rem"
      >
        {(article) => (
          <Card key={article.id}>
            {/* <Heading level={4}>{article.title}</Heading> */}
            {/* <Text>{article.summary.substring(0, 100)}...</Text> */}
            <Link to={`/summary/${article.id}`}>Read more</Link>
          </Card>
        )}
      </Collection>
      <Button 
        onClick={() => extractWebsiteUrls(website.url)} 
        isLoading={processingLinks}
        loadingText="Extracting URLs..."
        marginTop="1rem"
      >
        Refresh Links
      </Button>
    </View>
  );
}

export default WebsiteArticles;
