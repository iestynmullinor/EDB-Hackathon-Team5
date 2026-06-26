# Two-tab Agent Chat and Mock Apple Pay Frontend

This is a minimal Vite + React frontend with two tabs:

1. **Chat** - a simple chat interface for an agent you can connect later.
2. **Apple Pay** - a full-screen Apple Pay-style mock payment UI for frontend demos only.

The Apple Pay tab is built entirely with React, CSS, and inline SVG icons. It does not use screenshot backgrounds, static image files, favicons, or imported image assets. The Basket background is reconstructed with styled HTML elements and CSS gradients.

The mock payment UI includes:

- top tab buttons that stay visible while on the pay page
- dimmed Basket background rebuilt with CSS
- Apple Pay-style bottom sheet
- editable card text
- editable Ship to label and address fields
- editable merchant and amount fields
- Double-Click to Pay mock button
- mock Face ID confirmation and Done state

The payment flow is frontend-only. It does not charge cards, store real card data, or contact a payment processor.

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL printed in your terminal, usually:

```text
http://localhost:5173
```

## Build

```bash
npm run build
```

## Where to connect your agent later

Edit this file:

```text
src/services/agentConnector.ts
```

Replace the mock `sendMessageToAgent` function with your backend call. For example:

```ts
export async function sendMessageToAgent(message: string) {
  const response = await fetch('/api/agent/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) throw new Error('Agent request failed');
  return await response.json();
}
```

## Main files

```text
src/App.tsx
src/App.css
src/components/ChatTab/ChatTab.tsx
src/components/ChatTab/ChatTab.css
src/components/ApplePayMock/ApplePayMock.tsx
src/components/ApplePayMock/ApplePayMock.css
src/services/agentConnector.ts
```
