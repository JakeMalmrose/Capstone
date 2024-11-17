// amplify/functions/stripe/webhook/handler.ts
import type { APIGatewayProxyHandler } from "aws-lambda";
import type { Schema } from "../../../data/resource";
import { generateClient } from 'aws-amplify/api';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-10-28.acacia'
});

const client = generateClient<Schema>();

interface WebhookError {
  type: string;
  message: string;
  stack?: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    console.log("Beginning webhook handler");
    console.log("Full event:", JSON.stringify(event, null, 2));
    console.log("Headers received:", JSON.stringify(event.headers, null, 2));
    
    // Check all possible header variations
    const signature = 
      event.headers['stripe-signature'] ||
      event.headers['Stripe-Signature'] ||
      event.headers['STRIPE-SIGNATURE'] ||
      event.headers['stripeSignature'];
    
    console.log("Stripe signature found:", signature);
    console.log("Webhook secret exists:", !!process.env.STRIPE_WEBHOOK_SECRET);
    
    if (!signature) {
      console.log("No signature found in headers");
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,stripe-signature',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'No signature found',
          headers: event.headers,
          availableHeaders: Object.keys(event.headers)
        }),
      };
    }

    console.log("Raw body:", event.body);
    console.log("Body type:", typeof event.body);
    
    if (!event.body) {
      console.log("No body found in request");
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,stripe-signature',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'No body found in request' }),
      };
    }

    let stripeEvent: Stripe.Event;
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        event.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
      
      console.log("Stripe event constructed successfully:", {
        type: stripeEvent.type,
        id: stripeEvent.id
      });
    } catch (error) {
      const stripeError = error as Stripe.errors.StripeError;
      console.error('Stripe webhook construction error:', {
        error: stripeError,
        message: stripeError.message,
        type: stripeError.type,
        stack: stripeError.stack
      });
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,stripe-signature',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Stripe webhook error',
          message: stripeError.message,
          type: stripeError.type
        }),
      };
    }

    // Handle different event types
    console.log("Processing event type:", stripeEvent.type);
    
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        console.log("Processing checkout.session.completed");
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        console.log("Session data:", JSON.stringify(session, null, 2));
        
        const userId = session.client_reference_id;
        console.log("User ID from session:", userId);

        if (!userId) {
          throw new Error('No userId found in session');
        }

        const userPrefsResponse = await client.models.UserPreferences.list({
          filter: {
            userId: { eq: userId }
          }
        });

        console.log("User preferences found:", JSON.stringify(userPrefsResponse.data, null, 2));

        if (userPrefsResponse.data && userPrefsResponse.data.length > 0) {
          const userPref = userPrefsResponse.data[0];
          const updateResult = await client.models.UserPreferences.update({
            id: userPref.id,
            userId: userPref.userId,
            isPremium: true,
            lastUpdated: new Date().toISOString()
          });
          console.log("Update result:", JSON.stringify(updateResult, null, 2));
        }
        break;
      }

      case 'charge.succeeded': {
        console.log("Processing charge.succeeded");
        const charge = stripeEvent.data.object as Stripe.Charge;
        console.log("Charge data:", JSON.stringify(charge, null, 2));
        // You might want to handle this event type as well
        break;
      }

      case 'customer.subscription.deleted': {
        console.log("Processing customer.subscription.deleted");
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        console.log("Subscription data:", JSON.stringify(subscription, null, 2));
        
        const userId = subscription.metadata.userId;
        console.log("User ID from subscription:", userId);

        if (!userId) {
          throw new Error('No userId found in subscription');
        }

        const userPrefsResponse = await client.models.UserPreferences.list({
          filter: {
            userId: { eq: userId }
          }
        });

        console.log("User preferences found:", JSON.stringify(userPrefsResponse.data, null, 2));

        if (userPrefsResponse.data && userPrefsResponse.data.length > 0) {
          const userPref = userPrefsResponse.data[0];
          const updateResult = await client.models.UserPreferences.update({
            id: userPref.id,
            userId: userPref.userId,
            isPremium: false,
            lastUpdated: new Date().toISOString()
          });
          console.log("Update result:", JSON.stringify(updateResult, null, 2));
        }
        break;
      }

      default: {
        console.log("Unhandled event type:", stripeEvent.type);
      }
    }

    console.log('Webhook processed successfully');
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,stripe-signature',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        received: true,
        eventType: stripeEvent.type,
        eventId: stripeEvent.id
      }),
    };

  } catch (error) {
    const generalError = error as Error;
    console.error('General webhook error:', {
      error: generalError,
      message: generalError.message,
      stack: generalError.stack
    });
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,stripe-signature',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Webhook error',
        message: generalError.message
      }),
    };
  }
};