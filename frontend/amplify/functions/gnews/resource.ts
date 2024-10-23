// functions/gnews/resource.ts
import { defineFunction, secret } from '@aws-amplify/backend';

export const fetchGNews = defineFunction({
    name: 'fetchGNews',
    entry: './handler.ts',
    timeoutSeconds: 90,
    environment: {
        GNEWS_API_KEY: secret('gnews-api-key'),
    }
});