import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { 
  Card, 
  Heading, 
  Text, 
  View, 
  Loader, 
  SelectField,
  Alert,
  Flex,
  Divider
} from '@aws-amplify/ui-react';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

interface SummaryState {
  text: string;
  loading: boolean;
  error: string | null;
}

function Article() {
  const { articleId } = useParams<{ articleId: string }>();
  const { user } = useAuthenticator();
  const [article, setArticle] = useState<Schema['Article']['type'] | null>(null);
  const [summarizers, setSummarizers] = useState<Schema['Summarizer']['type'][]>([]);
  const [selectedSummarizerId, setSelectedSummarizerId] = useState<string>('');
  const [summaryState, setSummaryState] = useState<SummaryState>({
    text: '',
    loading: false,
    error: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch article, summarizers, and user preferences on component mount
  useEffect(() => {
    async function fetchData() {
      if (!articleId) return;

      setLoading(true);
      try {
        const [articleResponse, summarizersResponse, preferencesResponse] = await Promise.all([
          client.models.Article.get({ id: articleId }),
          client.models.Summarizer.list(),
          client.models.UserPreferences.list({
            filter: {
              userId: {
                eq: user.username
              }
            }
          })
        ]);

        setArticle(articleResponse.data);
        setSummarizers(summarizersResponse.data);
        
        // Only set the selectedSummarizerId after all data is loaded
        const userPreference = preferencesResponse.data[0]?.defaultSummarizerId;
        const defaultSummarizer = summarizersResponse.data[0]?.id;
        setSelectedSummarizerId(userPreference || defaultSummarizer || '');
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load article or summarizers. Please try again later.');
        setLoading(false);
      }
    }

    fetchData();
  }, [articleId, user.username]);

  // Fetch or generate summary when summarizer is selected and not loading
  useEffect(() => {
    async function fetchSummary() {
      if (!selectedSummarizerId || !article || loading) return;

      setSummaryState(prev => ({ ...prev, loading: true, error: null }));

      try {
        // First try to fetch existing summary
        const existingSummaries = await client.models.Summary.list({
          filter: {
            articleId: { eq: articleId },
            summarizerId: { eq: selectedSummarizerId }
          }
        });

        if (existingSummaries.data.length > 0) {
          setSummaryState(prev => ({
            ...prev,
            text: existingSummaries.data[0].text,
            loading: false
          }));
          return;
        }

        // If no existing summary, generate new one
        const result = await client.queries.summarize({
            text: article.fullText,
            articleId: article.id,
            summarizerId: selectedSummarizerId
          });
        console.log('Summarize request:', {
        textLength: article.fullText?.length,
        articleId: article.id,
        summarizerId: selectedSummarizerId
        });

        setSummaryState(prev => ({
          ...prev,
          text: result.data || 'hewwooooo',
          loading: false
        }));
      } catch (err) {
        console.error('Error fetching/generating summary:', err);
        setSummaryState(prev => ({
          ...prev,
          error: 'Failed to generate summary. Please try again.',
          loading: false
        }));
      }
    }

    fetchSummary();
  }, [selectedSummarizerId, article, articleId, loading]);

  if (loading) return <Loader />;
  if (error) return <Alert variation="error">{error}</Alert>;
  if (!article) return <Text>No article found</Text>;

  return (
    <View padding="2rem">
      <Card>
        <Heading level={1} marginBottom="1rem">{article.title}</Heading>
        <Text variation="tertiary" marginBottom="1rem">
          Published: {article.createdAt ? new Date(article.createdAt).toLocaleDateString() : 'Unknown'}
        </Text>
        
        <Text marginBottom="2rem">{article.fullText}</Text>
        
        <Divider marginBottom="2rem" />
        
        <Heading level={3} marginBottom="1rem">Article Summary</Heading>
        
        <Flex direction="column" gap="1rem">
          <SelectField
            label="Select Summarizer"
            value={selectedSummarizerId}
            onChange={e => setSelectedSummarizerId(e.target.value)}
          >
            {summarizers.map(summarizer => (
              <option key={summarizer.id} value={summarizer.id}>
                {summarizer.name} {summarizer.tier === 'PRO' ? '(Pro)' : ''}
              </option>
            ))}
          </SelectField>

          {summaryState.loading ? (
            <Flex alignItems="center" gap="1rem">
              <Loader size="small" />
              <Text>Generating summary...</Text>
            </Flex>
          ) : summaryState.error ? (
            <Alert variation="error">{summaryState.error}</Alert>
          ) : summaryState.text ? (
            <Card variation="elevated">
              <Text>{summaryState.text}</Text>
            </Card>
          ) : null}
        </Flex>
      </Card>
    </View>
  );
}

export default Article;
