// amplify/functions/stripe/webhook/resource.ts
import { defineFunction, secret } from "@aws-amplify/backend";

export const handleStripeWebhook = defineFunction({
  name: "stripeWebhook",
  entry: "./handler.ts",
  environment: {
    STRIPE_SECRET_KEY: secret("stripe-secret-key"),
    STRIPE_WEBHOOK_SECRET: secret("stripe-webhook-secret"),
  },
  timeoutSeconds: 30,
});