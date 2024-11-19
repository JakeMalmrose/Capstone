import { defineFunction } from '@aws-amplify/backend';


export const populateUnreadArticles = defineFunction({
  name: 'populateUnreadArticles',
  entry: 'handler.ts',
});