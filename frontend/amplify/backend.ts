import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { summarize } from './functions/summarize/resource';
import { extractUrls } from './functions/extract-urls/resource';
import { processRssFeed } from './functions/rss-parser/resource';
import { fetchGNews } from './functions/gnews/resource';
import { chatWithLLM } from './functions/chat-llm/resource';

defineBackend({
  auth,
  data,
  summarize,
  extractUrls,
  processRssFeed,
  fetchGNews,
  chatWithLLM,
});
