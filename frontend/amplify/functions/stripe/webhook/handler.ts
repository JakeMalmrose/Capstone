// amplify/functions/stripe/webhook/handler.ts
import type { APIGatewayProxyHandler } from "aws-lambda";
import type { Schema } from "../../../data/resource";
import { generateClient } from 'aws-amplify/api';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-10-28.acacia'
});

const client = generateClient<Schema>();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const signature = event.headers['stripe-signature'];
    
    if (!signature) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No signature found' }),
      };
    }

    const stripeEvent = stripe.webhooks.constructEvent(
      event.body || '',
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;

        if (!userId) {
          throw new Error('No userId found in session');
        }

        // Update user preferences to premium
        const userPrefsResponse = await client.models.UserPreferences.list({
          filter: {
            userId: { eq: userId }
          }
        });

        if (userPrefsResponse.data && userPrefsResponse.data.length > 0) {
          const userPref = userPrefsResponse.data[0];
          await client.models.UserPreferences.update({
            id: userPref.id,
            userId: userPref.userId,
            isPremium: true,
            lastUpdated: new Date().toISOString()
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;

        if (!userId) {
          throw new Error('No userId found in subscription');
        }

        // Remove premium status
        const userPrefsResponse = await client.models.UserPreferences.list({
          filter: {
            userId: { eq: userId }
          }
        });

        if (userPrefsResponse.data && userPrefsResponse.data.length > 0) {
          const userPref = userPrefsResponse.data[0];
          await client.models.UserPreferences.update({
            id: userPref.id,
            userId: userPref.userId,
            isPremium: false,
            lastUpdated: new Date().toISOString()
          });
        }
        break;
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      },
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('Error handling webhook:', error);
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      },
      body: JSON.stringify({ error: 'Webhook error' }),
    };
  }
};