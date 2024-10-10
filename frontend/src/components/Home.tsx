import { Amplify } from 'aws-amplify';
import { useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { Button, Heading, Text, View, TextAreaField, TextField } from '@aws-amplify/ui-react';
import type { Schema } from '../../amplify/data/resource';
import outputs from "../../amplify_outputs.json";

Amplify.configure(outputs);

const client = generateClient<Schema>();

function Home() {
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [extractedUrls, setExtractedUrls] = useState<string[]>([]);

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

  const handleExtractUrls = async () => {
    var result;
    console.log("url: " + url);
    setLoading(true);
    console.log("not yet crashed 1")
    setError(null);
    console.log("not yet crashed 2")
    setExtractedUrls([]);
    console.log("not yet crashed 3")
    try {
        result = await client.queries.extractUrls({ url: url });
        if(result.data) {
            console.log("result.data before crashing: " + result.data);
            setExtractedUrls(result.data.filter((url: string | null) => url !== null) as string[]);
        } else if (result.errors) {
            throw new Error(result.errors.map((e: { message: any; }) => e.message).join(', '));
        } else {
            throw new Error('An unknown error occurred');
        }
    } catch (err) {
        console.log("crashed finally block");
        console.log("extracted urls: " + JSON.stringify(result));
      console.error('Error extracting URLs:', err);
      setError(err instanceof Error ? err.message : 'Failed to extract URLs. Please try again.');
    } finally {
      setLoading(false);
      console.log("crashed finally block");
      console.log("extracted urls: " + extractedUrls);
    }
  };

  return (
    <View padding="1rem">
      <Heading level={1}>Text Summarizer and URL Extractor</Heading>
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
      <View marginTop="2rem">
        <TextField
          label="Enter URL to Extract Links"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
        />
      </View>
      <Button
        onClick={handleExtractUrls}
        isLoading={loading}
        loadingText="Extracting URLs..."
        marginTop="1rem"
      >
        Extract URLs
      </Button>
      {extractedUrls.length > 0 && (
        <View marginTop="1rem">
          <Heading level={3}>Extracted URLs:</Heading>
          <ul>
            {extractedUrls.map((extractedUrl, index) => (
              <li key={index}>
                <a href={extractedUrl} target="_blank" rel="noopener noreferrer">
                  {extractedUrl}
                </a>
              </li>
            ))}
          </ul>
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

export default Home;
