// Paiement en ligne avec Stripe Checkout (mode test avec une clé « sk_test_… »).
// Aucune donnée de carte ne transite par TripVision : le client saisit sa carte sur la page Stripe.
import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY || '';
export const stripe = key ? new Stripe(key) : null;
export const paymentsEnabled = Boolean(stripe);
export const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
export const testMode = key.startsWith('sk_test_');

const cents = (euros) => Math.round(Number(euros) * 100);

/** Crée la page de paiement Stripe d'une réservation. `lines` : [{ label, amount }] en euros. */
export async function createCheckout({ bookingId, reference, cancelToken, email, lines, appUrl, kind = 'booking', successUrl, cancelUrl, description }) {
  const items = lines.filter((l) => Number(l.amount) > 0).map((l) => ({
    quantity: 1,
    price_data: { currency: 'eur', unit_amount: cents(l.amount), product_data: { name: String(l.label).slice(0, 120) } },
  }));
  return stripe.checkout.sessions.create({
    mode: 'payment',
    locale: 'fr',
    customer_email: email,
    client_reference_id: String(bookingId),
    metadata: kind === 'pack' ? { request_id: String(bookingId), reference } : kind === 'cancel' ? { cancel_booking_id: String(bookingId), reference } : { booking_id: String(bookingId), reference },
    line_items: items,
    payment_intent_data: { description: description || `Réservation TripVision ${reference}`, metadata: kind === 'pack' ? { request_id: String(bookingId) } : kind === 'cancel' ? { cancel_booking_id: String(bookingId) } : { booking_id: String(bookingId) } },
    expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
    success_url: successUrl || `${appUrl}/?payment=success&session_id={CHECKOUT_SESSION_ID}#reserve`,
    cancel_url: cancelUrl || `${appUrl}/?payment=cancelled&b=${bookingId}&t=${cancelToken}#reserve`,
  });
}

export const retrieveSession = (id) => stripe.checkout.sessions.retrieve(id);
export const expireSession = (id) => stripe.checkout.sessions.expire(id).catch(() => null);
// Sans montant : remboursement total ; avec un montant (en euros) : remboursement partiel.
export const refundPayment = (paymentIntent, amount) => stripe.refunds.create({ payment_intent: paymentIntent, ...(amount ? { amount: cents(amount) } : {}) });
export const constructEvent = (rawBody, signature) => stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
