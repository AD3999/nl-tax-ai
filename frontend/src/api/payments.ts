import { client } from "./client";

export const createCheckoutSession = async (): Promise<string> => {
  const { data } = await client.post<{ url: string }>("/payments/create-checkout-session/");
  return data.url;
};

export const createBillingPortalSession = async (): Promise<string> => {
  const { data } = await client.get<{ url: string }>("/payments/billing-portal/");
  return data.url;
};
