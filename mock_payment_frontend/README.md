# Mock Payment Frontend

Standalone Vite + React app containing the mock Apple Pay-style payment UI.

When the user taps **Tap to Pay**, the frontend now sends the payment merchant and amount to the `enforcer_agent` through the ADK API server. The agent response decides whether the mock payment is approved or declined, and its `notification` text is shown in the Wallet-style notification and declined-payment modal.

This is a frontend-only mock. It does not charge cards, store real card data, or contact a payment processor.

## Run locally

Start the ADK backend from the folder that contains `enforcer_agent`:

```bash
adk api_server --port 8080
```

Then start this frontend:

```bash
npm install
npm run dev
```

Open the local URL printed in the terminal, usually `http://localhost:5173`.

## Environment variables

```text
VITE_AGENT_BASE_URL=/adk
VITE_ADK_APP_NAME=enforcer_agent
VITE_ADK_USER_ID=web_user
```

In local development, `/adk` is proxied to `http://127.0.0.1:8080` in `vite.config.ts`. If you deploy the backend separately, set `VITE_AGENT_BASE_URL` to the backend URL instead.

## Main files

```text
src/App.tsx
src/lib/enforcerAgent.ts
src/components/ApplePayMock/ApplePayMock.tsx
src/components/ApplePayMock/ApplePayMock.css
vite.config.ts
```
