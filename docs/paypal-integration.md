# PayPal Integration Files

This project now includes server-backed PayPal integration files for both one-time orders and subscriptions.

## Added files

- `lib/paypal-server.js`
  - OAuth token retrieval
  - Generic PayPal API request helper
  - Webhook signature verification helper
- `pages/api/paypal/create-order.js`
- `pages/api/paypal/capture-order.js`
- `pages/api/paypal/create-subscription.js`
- `pages/api/paypal/get-subscription.js`
- `pages/api/paypal/webhook.js`

## Required server environment variables

```bash
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_ID=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Existing client-side environment variables used

```bash
NEXT_PUBLIC_PAYPAL_CLIENT_ID=
NEXT_PUBLIC_PAYPAL_MONTHLY_PLAN_ID=
NEXT_PUBLIC_PAYPAL_YEARLY_PLAN_ID=
NEXT_PUBLIC_PAYPAL_AMOUNT=5.00
NEXT_PUBLIC_PAYPAL_CURRENCY=USD
NEXT_PUBLIC_PAYPAL_MODE=sandbox
```
