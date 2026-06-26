export interface AgentReply {
  text: string;
}

const MOCK_DELAY_MS = 450;

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * Replace this function when you are ready to connect your real agent backend.
 *
 * Example:
 * const response = await fetch('/api/agent/chat', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ message }),
 * });
 * return await response.json();
 */
export async function sendMessageToAgent(message: string): Promise<AgentReply> {
  await wait(MOCK_DELAY_MS);

  return {
    text: `Mock agent received: "${message}". Replace src/services/agentConnector.ts when your backend is ready.`,
  };
}
