// Stripe is not used — all orgs are treated as subscribed.
export const checkSubscription = async (): Promise<boolean> => {
  return true;
};
