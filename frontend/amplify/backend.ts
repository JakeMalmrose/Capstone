// amplify/backend.ts
import { defineBackend } from '@aws-amplify/backend';
import { Stack } from "aws-cdk-lib";
import {
  AuthorizationType,
  Cors,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { auth } from './auth/resource';
import { data } from './data/resource';
import { summarize } from './functions/summarize/resource';
import { extractUrls } from './functions/extract-urls/resource';
import { processRssFeed } from './functions/rss-parser/resource';
import { fetchGNews } from './functions/gnews/resource';
import { chatWithLLM } from './functions/chat-llm/resource';
import { gnewsFetchAll } from './functions/gnewsFetchAll/resource';
import { handleStripeWebhook } from './functions/stripe/webhook/resource';
import { createCheckoutSession } from './functions/stripe/create-session/resource';

const backend = defineBackend({
  auth,
  data,
  summarize,
  extractUrls,
  processRssFeed,
  fetchGNews,
  chatWithLLM,
  gnewsFetchAll,
  handleStripeWebhook,
  createCheckoutSession,
});

// Create API Stack
const apiStack = backend.createStack("stripe-webhook-api");

// Create REST API
const stripeWebhookApi = new RestApi(apiStack, "StripeWebhookApi", {
  restApiName: "stripe-webhook-api",
  deploy: true,
  deployOptions: {
    stageName: "dev",
  },
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS,
    allowMethods: Cors.ALL_METHODS,
    allowHeaders: [
      'Content-Type',
      'X-Amz-Date',
      'Authorization',
      'X-Api-Key',
      'stripe-signature',
    ],
  },
});

// Create Lambda integration for webhook
const webhookIntegration = new LambdaIntegration(
  backend.handleStripeWebhook.resources.lambda
);

// Add webhook endpoint
const webhookPath = stripeWebhookApi.root.addResource("stripe-webhook");
webhookPath.addMethod("POST", webhookIntegration, {
  authorizationType: AuthorizationType.NONE, // Webhook needs to be public
});

// Add outputs to the configuration file
backend.addOutput({
  custom: {
    API: {
      [stripeWebhookApi.restApiName]: {
        endpoint: stripeWebhookApi.url,
        region: Stack.of(stripeWebhookApi).region,
        apiName: stripeWebhookApi.restApiName,
      },
    },
  },
});