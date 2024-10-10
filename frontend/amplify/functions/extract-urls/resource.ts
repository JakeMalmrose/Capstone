import { defineFunction } from '@aws-amplify/backend';

export const extractUrls = defineFunction({
    name: 'extractUrls',
    entry: './handler.ts',
});
