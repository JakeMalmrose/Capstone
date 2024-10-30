// resource.ts
import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { sayHello } from "../functions/say-hello/resource";
import { summarize } from "../functions/summarize/resource";
import { extractUrls } from "../functions/extract-urls/resource";
import { processRssFeed } from "../functions/rss-parser/resource";
import { rssToDB } from "../functions/write-rss-to-db/resource";
import { fetchGNews } from "../functions/gnews/resource";

const feedDataType = a.customType({
  name: a.string(),
  url: a.string(),
  description: a.string(),
  type: a.enum(["RSS", "OTHER"]),
  websiteId: a.id(),
});

// const articleDataType = a.customType({
//   url: a.string(),
//   title: a.string(),
//   fullText: a.string(),
//   createdAt: a.string(),
// });

const processRssFeedReturnType = a.customType({
  success: a.boolean(),
  feedData: feedDataType,
  articlesData: a.json(),
  message: a.string(),
});



const gNewsCategoryEnum = a.enum([
  "general", "world", "nation", "business", "technology", 
  "entertainment", "sports", "science", "health"
]);

const gNewsCountryEnum = a.enum([
  "us", "gb", "au", "ca", "in"
]);





const schema = a.schema({
  // Functions
  sayHello: a
    .query()
    .arguments({
      name: a.string(),
    })
    .returns(a.string())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(sayHello)),

  summarize: a
    .query()
    .arguments({
      text: a.string(),
      articleId: a.string(),
      summarizerId: a.string(),
    })
    .returns(a.string())
    .authorization((allow) => [
      allow.authenticated(),
      allow.publicApiKey(),
    ])
    .handler(a.handler.function(summarize)),

  extractUrls: a
    .query()
    .arguments({
      url: a.string(),
      typeOfLink: a.enum(["XML", "RSS", "ANY"]),
    })
    .returns(a.string().array())
    .authorization((allow) => [allow.authenticated(),
      allow.publicApiKey(),])
    .handler(a.handler.function(extractUrls)),

  processRssFeed: a
    .query()
    .arguments({
      feedUrl: a.string(),
      websiteId: a.string(),
      jwt: a.string(),
    })
    .returns(processRssFeedReturnType)
    .authorization((allow) => [allow.authenticated(),
      allow.publicApiKey(),])
    .handler(a.handler.function(processRssFeed)),

  rssToDB: a
    .mutation()
    .arguments({
      feedUrl: a.string(),
      websiteId: a.string(),
    })
    .authorization((allow) => [allow.authenticated(),
      allow.publicApiKey(),])
    .returns(a.customType({ success: a.boolean(), message: a.string() }))
    .handler(a.handler.function(rssToDB)),

  fetchGNews: a
    .mutation()
    .arguments({
      country: a.string(),
      category: a.string(),
      websiteId: a.string().required(),
      feedId: a.string().required(),
    })
    .returns(
      a.customType({
        success: a.boolean(),
        message: a.string(),
        articles: a.json().array()
      })
    )
    .authorization((allow) => [
      allow.authenticated(),
      allow.publicApiKey(),
    ])
    .handler(a.handler.function(fetchGNews)),

  // Data Models
  UserPreferences: a
  .model({
    userId: a.string().required(),
    gNewsCountry: gNewsCountryEnum,
    gNewsCategory: gNewsCategoryEnum,
    lastUpdated: a.datetime(),
  })
  .authorization((allow) => [
    allow.owner(),
    allow.authenticated().to(["read"]),
  ]),

  Website: a
    .model({
      name: a.string().required(),
      url: a.string().required(),
      category: a.string(),
      tags: a.string().array(),
      feeds: a.hasMany("Feed", "websiteId"),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(["read"]),
      allow.publicApiKey(),
      allow.groups(["Admin"]),
    ]),

  Feed: a
    .model({
      name: a.string().required(),
      url: a.string().required(),
      description: a.string(),
      type: a.enum(["GNEWS", "RSS", "OTHER"]),
      tags: a.string().array(),
      websiteId: a.id().required(),
      website: a.belongsTo("Website", "websiteId"),
      articles: a.hasMany("Article", "feedId"),
    })
    .authorization((allow) => [
      allow.owner(), 
      allow.publicApiKey(),
      allow.authenticated().to(["read"]),
    ]),

  Article: a
    .model({
      url: a.string().required(),
      title: a.string().required(),
      fullText: a.string(),
      tags: a.string().array(),
      createdAt: a.datetime(),
      feedId: a.id().required(),
      feed: a.belongsTo("Feed", "feedId"),
      summaries: a.hasMany("Summary", "articleId"),
    })
    .authorization((allow) => [
      allow.owner(), 
      allow.publicApiKey(),
      allow.authenticated().to(["read"]),
    ]),

  Summary: a
    .model({
      text: a.string().required(),
      tags: a.string().array(),
      createdAt: a.datetime(),
      summarizerId: a.id(),
      summarizer: a.belongsTo("Summarizer", "summarizerId"),
      articleId: a.id(),
      article: a.belongsTo("Article", "articleId"),
    })
    .authorization((allow) => [allow.owner(),
      allow.publicApiKey(), allow.authenticated().to(["read"])]),

  Summarizer: a
    .model({
      name: a.string().required(),
      description: a.string(),
      tags: a.string().array(),
      tier: a.enum(["FREE", "PRO"]),
      summaries: a.hasMany("Summary", "summarizerId"),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(["read"]),
      allow.groups(["Admin"]),
      allow.publicApiKey(),
    ]),

    // UserFeedFavorites: a
    // .model({
    //   userId: a.id().required(),
    //   feedId: a.id().required(),
    //   user: a.belongsTo("User", "userId"),
    //   feed: a.belongsTo("Feed", "feedId"),
    // })
    // .authorization((allow) => [allow.owner()]),

    // Custom Types
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 32,
    }
  },
});
