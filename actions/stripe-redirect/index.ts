"use server";

import { createSafeAction } from "@/lib/create-safe-action";
import { StripeRedirect } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (_data: InputType): Promise<ReturnType> => {
  return { error: "Stripe is not configured in this project." };
};

export const stripeRedirect = createSafeAction(StripeRedirect, handler);
