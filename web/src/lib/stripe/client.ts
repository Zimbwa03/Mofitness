import Stripe from "stripe";

import { getServerEnv } from "@/lib/env";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  const env = getServerEnv();
  if (!env.stripeSecretKey) {
    return null;
  }

  stripeClient = new Stripe(env.stripeSecretKey, {
    apiVersion: "2025-02-24.acacia",
  });

  return stripeClient;
}
