import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export async function getAllUrls(url: string): Promise<string[]> {
  try {
    const result = await client.queries.extractUrls({ url: url });
    if (result.data) {
      // Filter out any null or undefined values and assert the type
      return result.data.filter((extractedUrl): extractedUrl is string => extractedUrl != null);
    } else if (result.errors) {
      throw new Error(result.errors.map(e => e.message).join(', '));
    } else {
      throw new Error('An unknown error occurred');
    }
  } catch (error) {
    console.error('Error extracting URLs:', error);
    throw error;
  }
}
