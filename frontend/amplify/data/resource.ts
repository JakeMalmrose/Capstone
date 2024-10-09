import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { sayHello } from "../functions/say-hello/resource";

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
    .authorization(allow => [allow.authenticated()]),
  //other things
  Summary: a
    .model({
      articleUrl: a.string().required(),
      title: a.string().required(),
      fullText: a.string().required(),
      summary: a.string().required(),
      tags: a.string().array(),
      createdAt: a.datetime(),
      userId: a.string(),
      websiteId: a.string(),
    })
    .authorization(allow => [allow.owner(), allow.authenticated().to(["read"])]),

  Website: a
    .model({
      name: a.string().required(),
      url: a.string().required(),
      category: a.string(),
      tags: a.string().array(),
    })
    .authorization(allow => [allow.owner(), allow.authenticated().to(["read"])]),

  Feed: a
    .model({
      name: a.string().required(),
      description: a.string(),
      url: a.string().required(),
      type: a.enum(['RSS', 'OTHER']),
      websiteId: a.string(),
    })
    .authorization(allow => [allow.owner(), allow.authenticated().to(["read"])])
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});