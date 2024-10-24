import { Amplify } from '@aws-amplify/core';
import type { Schema } from "../data/resource";
import { generateClient } from "@aws-amplify/api";

const amplifyConfig = {
  aws_project_region: process.env.AWS_REGION,
  aws_appsync_graphqlEndpoint: process.env.API_ENDPOINT,
  aws_appsync_apiKey: process.env.API_KEY,
  aws_appsync_region: process.env.AWS_REGION,
  aws_appsync_authenticationType: 'API_KEY'
};

Amplify.configure(amplifyConfig);

const client = generateClient<Schema>({
  authMode: 'apiKey'
});

export default client;