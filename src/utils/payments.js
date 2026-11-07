// Online invoice payments (Agency): thin client for the Connect edge functions.
import { invokeEdgeFunction, getValidSession } from "./stripe";

/**
 * The online-payment UI (Profile "Get paid online", the Jobs "Pay link" button, the pay link in emailed invoices) is switched OFF until the Stripe Connect functions are
 * deployed and live keys are approved (docs/pay-link-architecture.md). Turn it on for a build with VITE_PAY_LINK=1; nothing else needs to change.
 */
export const PAY_LINK_ENABLED = import.meta.env?.VITE_PAY_LINK === "1";

async function call(name, body) {
  const session = await getValidSession();
  if (!session?.access_token) throw new Error("Please sign in again to use online payments.");
  return invokeEdgeFunction(name, body, session.access_token);
}

/** { connected, ready }: ready means card payments are active on the freelancer's Stripe account. */
export const getConnectStatus = () => call("connect-onboard", { action: "status" });

/** Opens Stripe's hosted onboarding for the freelancer's connected account. */
export async function startConnectOnboarding() {
  const { url } = await call("connect-onboard", {});
  if (!url) throw new Error("Stripe did not return an onboarding link.");
  window.location.assign(url);
}

/** A Checkout link the client can pay (direct charge on the freelancer's account). */
export async function createInvoicePayLink(jobId) {
  const { url } = await call("create-invoice-payment", { jobId });
  if (!url) throw new Error("Stripe did not return a payment link.");
  return url;
}
