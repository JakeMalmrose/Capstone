import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Todo: a
  .model({
    content: a.string(),
  })
  .authorization((allow) => [allow.owner()]),
  Summary: a
    .model({
      articleUrl: a.string().required(),
      title: a.string().required(),
      fullText: a.string().required(),
      summary: a.string().required(),
      tags: a.string().array(),
      createdAt: a.datetime(),
      userId: a.string(),
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
    .authorization(allow => [allow.owner(), allow.authenticated().to(["read"])]),

  User: a
    .model({
      email: a.string().required(),
      favoriteFeeds: a.string().array(),
      isAdmin: a.boolean().default(false),
    })
    .authorization(allow => [allow.owner(), allow.authenticated().to(["read"])]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});



/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
