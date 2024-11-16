// amplify/functions/stripe/create-session/resource.ts
import { defineFunction, secret } from "@aws-amplify/backend";

export const createCheckoutSession = defineFunction({
  name: "createStripeCheckout",
  entry: "./handler.ts",
  environment: {
    STRIPE_SECRET_KEY: secret("stripe-secret-key"),
    STRIPE_PRICE_ID: secret("stripe-price-id"),
    CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5137",
  },
  timeoutSeconds: 30,
});