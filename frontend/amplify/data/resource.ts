import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { summarize } from "../functions/summarize/resource";
import { extractUrls } from "../functions/extract-urls/resource";
import { processRssFeed } from "../functions/rss-parser/resource";
import { fetchGNews } from "../functions/gnews/resource";
import { chatWithLLM } from "../functions/chat-llm/resource";
import { gnewsFetchAll } from "../functions/gnewsFetchAll/resource";
import { createCheckoutSession } from "../functions/stripe/create-session/resource";
import { handleStripeWebhook } from "../functions/stripe/webhook/resource";
import { populateUnreadArticles } from "../functions/populateUnreadArticles/resource";

const feedDataType = a.customType({
  name: a.string(),
  url: a.string(),
  description: a.string(),
  type: a.enum(["RSS", "OTHER"]),
  websiteId: a.id(),
});

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

const chatResponseType = a.customType({
  response: a.string(),
  feed: a.id(),
});

const schema = a.schema({
  // Functions
  createStripeCheckout: a
    .mutation()
    .arguments({
      priceId: a.string().required(),
      userId: a.string().required(),
    })
    .returns(
      a.customType({
        sessionId: a.string(),
        url: a.string(),
      })
    )
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(createCheckoutSession)),

  stripeWebhook: a
    .mutation()
    .arguments({
      signature: a.string().required(),
      payload: a.string().required(),
    })
    .returns(a.boolean())
    .authorization((allow) => [allow.guest(), allow.publicApiKey()])
    .handler(a.handler.function(handleStripeWebhook)),

  chatWithLLM: a
    .query()
    .arguments({
      message: a.string(),
      chatHistory: a.json(),
    })
    .returns(chatResponseType)
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(chatWithLLM)),

  summarize: a
    .query()
    .arguments({
      text: a.string(),
      articleId: a.string(),
      summarizerId: a.string(),
      specialRequests: a.string(),
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
    .authorization((allow) => [
      allow.authenticated(),
      allow.publicApiKey(),
    ])
    .handler(a.handler.function(extractUrls)),

  processRssFeed: a
    .query()
    .arguments({
      feedUrl: a.string(),
      websiteId: a.string(),
      jwt: a.string(),
    })
    .returns(processRssFeedReturnType)
    .authorization((allow) => [
      allow.authenticated(),
      allow.publicApiKey(),
    ])
    .handler(a.handler.function(processRssFeed)),

  fetchGNews: a
    .mutation()
    .arguments({
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

  fetchAllGNews: a
    .mutation()
    .returns(
      a.json()
    )
    .authorization((allow) => [
      allow.publicApiKey(),
      allow.groups(["Admin"]),
    ])
    .handler(a.handler.function(gnewsFetchAll)),

  populateUnreadArticles: a
    .query()
    .arguments({
      userId: a.string().required(),
      feedId: a.string().required(),
    })
    .returns(
      a.customType({
        success: a.boolean(),
        message: a.string(),
        results: a.json().array()
      })
    )
    .authorization((allow) => [
      allow.authenticated(),
      allow.publicApiKey(),
    ])
    .handler(a.handler.function(populateUnreadArticles)),

  // Data Models
  Feedback: a
    .model({
      type: a.enum(["BUG", "FEEDBACK"]),
      status: a.enum(["NEW", "IN_PROGRESS", "RESOLVED"]),
      title: a.string().required(),
      description: a.string().required(),
      userId: a.string().required(),
      articleId: a.string(),
      articleTitle: a.string(),
      articleUrl: a.string(),
      adminNotes: a.string(),
      resolvedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(["read", "create"]),
      allow.groups(["Admin"]).to(['read', 'create', 'update', 'delete']),
    ]),

  SpecialRequestPreset: a
    .model({
      name: a.string().required(),
      content: a.string().required(),
      description: a.string(),
      isActive: a.boolean().required(),
    })
    .authorization((allow) => [
      allow.authenticated(),//.to(['read']),
      allow.groups(["Admin"]).to(['create', 'update', 'delete']),
      
    ]),

  UserPreferences: a
  .model({
    userId: a.string().required(),
    isPremium: a.boolean().authorization((allow) => [allow.groups(["Admin"])]),
    defaultSummarizerId: a.string(),
    specialRequests: a.string(),
    gNewsCountry: gNewsCountryEnum,
    gNewsCategory: gNewsCategoryEnum,
    lastUpdated: a.datetime(),
  })
  .authorization((allow) => [
    allow.owner(),
    allow.authenticated(),
    allow.publicApiKey().to(['read', 'create', 'update', 'delete']),
    allow.groups(["Admin"]),
  ]),

  UserFeedSubscription: a
    .model({
      userId: a.string().required(),
      feedId: a.id().required(),
      feed: a.belongsTo("Feed", "feedId"),
      subscriptionDate: a.datetime(),
      notificationsEnabled: a.boolean(),
      customName: a.string(),
      lastReadDate: a.datetime(),
      lastPopulatedArticleId: a.id(),  // To track bulk population of unread articles
      lastPopulatedAt: a.datetime(),   // To track when we last populated articles
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(["read"]),
      allow.publicApiKey(),
      allow.groups(["Admin"]),
    ]),

  UserArticleStatus: a
    .model({
      userId: a.string().required(),
      articleId: a.id().required(),
      article: a.belongsTo("Article", "articleId"),
      isRead: a.boolean().required(),
      readAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(["read"]),
      allow.publicApiKey(),
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
      subscribers: a.hasMany("UserFeedSubscription", "feedId"),
      gNewsCategory: gNewsCategoryEnum,
      gNewsCountry: gNewsCountryEnum,
      searchTerms: a.string().array(),
    })
    .authorization((allow) => [
      allow.owner(), 
      allow.publicApiKey().to(['read', 'create', 'update', 'delete']),
      allow.authenticated().to(["read"]),
      allow.groups(["Admin"]),
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
      userStatuses: a.hasMany("UserArticleStatus", "articleId"),
      unreadEntries: a.hasMany("UnreadArticle", "articleId"),
    })
    .authorization((allow) => [
      allow.owner(), 
      allow.publicApiKey(),
      allow.authenticated().to(["read"]),
      allow.groups(["Admin"]),
    ]),

  UnreadArticle: a
    .model({
      userId: a.string().required(),
      feedId: a.id().required(),
      articleId: a.id().required(),
      createdAt: a.datetime().required(),
      article: a.belongsTo("Article", "articleId"),
      title: a.string().required(),
      url: a.string().required(),
      feedName: a.string(),
      websiteId: a.id(),
    })
    .secondaryIndexes((index) => [
      // Using userId as the hash key since that's what we'll query by
      index("userId")
        .queryField("listUnreadByUser")
        .sortKeys(["createdAt"]),
      // Add another index if we need to query by feed
      index("feedId")
        .queryField("listUnreadByFeed")
        .sortKeys(["createdAt"])
    ])
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(["read"]),
      allow.publicApiKey(),
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
      specialRequests: a.string(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.publicApiKey(), 
      allow.authenticated().to(["read"]),
      allow.groups(["Admin"]),
    ]),

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
