# Chat Frontend

Standalone Vite + React app containing only the agent chat UI.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed in the terminal, usually `http://localhost:5173`.

## Connect your agent backend

Edit:

```text
src/services/agentConnector.ts
```

Replace the mock `sendMessageToAgent` function with your backend API call.

## Main files

```text
src/App.tsx
src/components/ChatTab/ChatTab.tsx
src/components/ChatTab/ChatTab.css
src/services/agentConnector.ts
```
