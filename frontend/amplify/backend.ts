import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { sayHello } from './functions/say-hello/resource';
import { summarize } from './functions/summarize/resource';
import { extractUrls } from './functions/extract-urls/resource';
import { processRssFeed } from './functions/rss-parser/resource';
import { rssToDB } from './functions/write-rss-to-db/resource';

defineBackend({
  auth,
  data,
  sayHello,
  summarize,
  extractUrls,
  processRssFeed,
  rssToDB,
});
