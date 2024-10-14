import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { sayHello } from "../functions/say-hello/resource";
import { summarize } from "../functions/summarize/resource";
import { extractUrls } from "../functions/extract-urls/resource";

const schema = a.schema({
  //functions
  sayHello: a
    .query()
    .arguments({
      name: a.string(),
    })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(sayHello)),
  summarize: a
    .query()
    .arguments({
      text: a.string(),
    })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(summarize)),
  extractUrls: a
    .query()
    .arguments({
      url: a.string(),
    })
    .returns(a.string().array())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(extractUrls)),

  //data models
  Website: a
  .model({
    websiteId: a.id().required(),
    name: a.string().required(),
    url: a.string().required(),
    category: a.string(),
    tags: a.string().array(),
    feeds: a.hasMany("Feed", "websiteId"),
  })
  .authorization(allow => [allow.owner(), allow.authenticated().to(["read"]), allow.groups(["Admin"])]),
  
  Feed: a
    .model({
      feedId: a.id().required(),
      name: a.string().required(),
      url: a.string().required(),
      description: a.string(),
      type: a.enum(['RSS', 'OTHER']),
      tags: a.string().array(),
      websiteId: a.id(),
      website: a.belongsTo("Website", "websiteId"),
      articles: a.hasMany("Article", "feedId"),
    })
    .authorization(allow => [allow.owner(), allow.authenticated().to(["read"])]),

  Article: a
    .model({
      articleId: a.id().required(),
      url: a.string().required(),
      title: a.string().required(),
      fullText: a.string().required(),
      tags: a.string().array(),
      createdAt: a.datetime(),
      feedId: a.id(),
      feed: a.belongsTo("Feed", "feedId"),
      summaries: a.hasMany("Summary", "articleId"),
    })
    .authorization(allow => [allow.owner(), allow.authenticated().to(["read"])]),

  Summary: a
    .model({
      summaryId: a.id().required(),
      text: a.string().required(),
      tags: a.string().array(),
      createdAt: a.datetime(),
      summarizerId: a.id(),
      summarizer: a.belongsTo("Summarizer", "summarizerId"),
      articleId: a.id(),
      article: a.belongsTo("Article", "articleId"),
    })
    .authorization(allow => [allow.owner(), allow.authenticated().to(["read"])]),

  Summarizer: a
    .model({
      summarizerId: a.id().required(),
      name: a.string().required(),
      description: a.string(),
      tags: a.string().array(),
      tier: a.enum(['FREE', 'PRO']),
      summaries: a.hasMany("Summary", "summarizerId"),
    })
    .authorization(allow => [allow.owner(), allow.authenticated().to(["read"]), allow.groups(["Admin"])])
  });

  

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
