import { defineFunction } from '@aws-amplify/backend'

export const rssToDB = defineFunction({
    name: 'write-rss-to-db',
    entry: './handler.ts',
});