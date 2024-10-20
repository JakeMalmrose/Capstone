import React, { useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { Button, Heading, Text, View, TextField, SelectField } from '@aws-amplify/ui-react';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

function Extractor() {
  const [url, setUrl] = useState('');
  const [linkType, setLinkType] = useState('ANY');
  const [extractedUrls, setExtractedUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExtractUrls = async () => {
    setLoading(true);
    setError(null);
    setExtractedUrls([]);
    try {
      if(linkType !== 'ANY' && linkType !== 'XML') {
        throw new Error('Invalid link type');
      }
      const result = await client.queries.extractUrls({ url: url, typeOfLink: linkType });
      if (result.data) {
        setExtractedUrls(result.data.filter((url: string | null) => url !== null) as string[]);
      } else if (result.errors) {
        throw new Error(result.errors.map((e: { message: any; }) => e.message).join(', '));
      } else {
        throw new Error('An unknown error occurred');
      }
    } catch (err) {
      console.error('Error extracting URLs:', err);
      setError(err instanceof Error ? err.message : 'Failed to extract URLs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View padding="1rem">
      <Heading level={1}>URL Extractor</Heading>
      <View marginTop="2rem">
        <TextField
          label="Enter URL to Extract Links"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
        />
      </View>
      <View marginTop="1rem">
        <SelectField
          label="Link Type"
          value={linkType}
          onChange={(e) => setLinkType(e.target.value)}
        >
          <option value="ANY">Any Links</option>
          <option value="XML">XML Links</option>
        </SelectField>
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

export default Extractor;