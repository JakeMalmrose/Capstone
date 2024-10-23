import axios from 'axios';
import type { Schema } from "../../data/resource"

export const handler: Schema["extractUrls"]["functionHandler"] = async (event) => {
  const { url, typeOfLink } = event.arguments;

  if (typeof url !== 'string' || typeof typeOfLink !== 'string') {
    throw new Error('URL and typeOfLink must be strings');
  }

  return extractUrls(url, typeOfLink);
}

const extractUrls = async function(url: string, typeOfLink: string) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    let urlRegex: RegExp;

    if (typeOfLink === "XML") {
      urlRegex = /href=["'](https?:\/\/[^"']+\.xml)["']/gi;
    } else if(typeOfLink === "rss") {
      urlRegex = /href=["'](https?:\/\/[^"']+\.rss)["']/gi;
    } else {
      // Default regex for general URLs
      urlRegex = /href=["'](https?:\/\/[^"']+|\/[^"']+)["']/gi;
    }

    const urls: string[] = [];
    let match;

    while ((match = urlRegex.exec(html)) !== null) {
      const extractedUrl = typeOfLink === "XML" ? match[1] : match[1];
      if (extractedUrl.startsWith('http')) {
        urls.push(extractedUrl);
      } else if (extractedUrl.startsWith('/')) {
        urls.push(new URL(extractedUrl, url).href);
      }
    }

    return urls;
  } catch (error) {
    console.error('Error extracting URLs:', error);
    throw error; // Re-throw the error after logging
  }
};