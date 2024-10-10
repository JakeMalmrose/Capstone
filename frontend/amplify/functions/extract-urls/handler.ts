import axios from 'axios';
import type { Schema } from "../../data/resource"

export const handler: Schema["extractUrls"]["functionHandler"] = async (event) => {
  const { url } = event.arguments;

  if (typeof url !== 'string') {
    throw new Error('URL must be a string');
  }

  return extractUrls(url);
}

const extractUrls = async function(url: string) {
  try {
    const response = await axios.get(url);
    const html = response.data;

    // Regular expression to match href attributes
    const hrefRegex = /href=["'](https?:\/\/[^"']+|\/[^"']+)["']/gi;
    const urls: string[] = [];

    for (const match of html.matchAll(hrefRegex)) {
      const href = match[1];
      if (href.startsWith('http')) {
        urls.push(href);
      } else if (href.startsWith('/')) {
        urls.push(new URL(href, url).href);
      }
    }

    return urls;
  } catch (error) {
    console.error('Error extracting URLs:', error);
    throw error; // Re-throw the error after logging
  }
};
