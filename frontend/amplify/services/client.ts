import { Amplify } from '@aws-amplify/core';
import { generateClient } from "@aws-amplify/api";
import type { Schema } from "../data/resource";

let cloudOutputs;
let localOutputs;
try {
  cloudOutputs = require("./cloudOutputs.json");
  localOutputs = require("./localOutputs.json");
} catch (e) {
  console.warn('Failed to import outputs:', e);
}

const fallbackConfig = {
  aws_project_region: process.env.REGION,
  aws_appsync_graphqlEndpoint: process.env.API_ENDPOINT,
  aws_appsync_apiKey: process.env.API_KEY,
  aws_appsync_region: process.env.REGION,
  aws_appsync_authenticationType: 'API_KEY'
};

// Use cloud outputs in production, local outputs in development, fall back to env vars
const outputs = process.env.NODE_ENV === 'production' 
  ? (cloudOutputs || fallbackConfig)
  : (localOutputs || fallbackConfig);

Amplify.configure(outputs);

const client = generateClient<Schema>({
    authMode: 'apiKey'
  });

export default client;