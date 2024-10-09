import { defineFunction, secret } from '@aws-amplify/backend';

export const summarize = defineFunction({
    name: 'summarize',
    entry: './handler.ts',
    environment: {
        OPENAI_API_KEY: secret('openai-api-key'),
    }
});

