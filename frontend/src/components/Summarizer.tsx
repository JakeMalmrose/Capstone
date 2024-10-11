import { useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { Button, Heading, Text, View, TextAreaField } from '@aws-amplify/ui-react';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

function Summarizer() {
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSummarize = async () => {
    setLoading(true);
    setError(null);
    setSummary('');
    try {
      const result = await client.queries.summarize({ text: text });
      if (result.data) {
        setSummary(result.data);
      } else if (result.errors) {
        throw new Error(result.errors.map((e: { message: any; }) => e.message).join(', '));
      } else {
        throw new Error('An unknown error occurred');
      }
    } catch (err) {
      console.error('Error calling summarize:', err);
      setError(err instanceof Error ? err.message : 'Failed to get summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View padding="1rem">
      <Heading level={1}>Text Summarizer</Heading>
      <View marginTop="1rem">
        <TextAreaField
          label="Enter Text to Summarize"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your text here..."
          rows={6}
        />
      </View>
      <Button
        onClick={handleSummarize}
        isLoading={loading}
        loadingText="Summarizing..."
        marginTop="1rem"
      >
        Summarize
      </Button>
      {summary && (
        <View marginTop="1rem">
          <Heading level={3}>Summary:</Heading>
          <Text fontSize="1.2rem">
            {summary}
          </Text>
        </View>
      )}
      {error && (
        <Text marginTop="1rem" color="red">
          {error}
        </Text>
      )}
    </View>
  );
}

export default Summarizer;
