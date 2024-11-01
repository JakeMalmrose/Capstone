import { Amplify } from '@aws-amplify/core';
import { generateClient } from "@aws-amplify/api";
import type { Schema } from "../data/resource";
import cloudOutputs from "./cloudOutputs2.json";
import localOutputs from "./localOutputs2.json";

const isLocal = process.env.IS_LOCAL;

if (isLocal === "true") {
  Amplify.configure(localOutputs);
} else {
  Amplify.configure(cloudOutputs);
}

const client = generateClient<Schema>({
    authMode: 'apiKey'
  });

export default client;