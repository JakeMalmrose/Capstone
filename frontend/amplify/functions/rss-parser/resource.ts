import { defineFunction } from "@aws-amplify/backend";

export const rssParser = defineFunction({
    name: 'rssParser',
    entry: './handler.ts',
});