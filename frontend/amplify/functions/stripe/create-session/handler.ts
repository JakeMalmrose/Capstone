// amplify/backend/functions/stripe/create-session/handler.ts

import type { Schema } from "../../../data/resource";
import { generateClient } from 'aws-amplify/api';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-10-28.acacia'
});

export const handler = async (event: {
  arguments: {
    priceId: string;
    userId: string;
  };
}) => {
  try {
    const { priceId, userId } = event.arguments;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/preferences?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/preferences`,
      client_reference_id: userId,
      metadata: {
        userId: userId,
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
};