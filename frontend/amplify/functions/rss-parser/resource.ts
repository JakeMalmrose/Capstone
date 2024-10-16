import { defineFunction } from "@aws-amplify/backend";

export const processRssFeed = defineFunction({
    name: 'processRssFeed',
    entry: './handler.ts',
});