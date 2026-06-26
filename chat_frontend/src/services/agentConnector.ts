export interface AgentReply {
  text: string;
}

// Hardcoded customer for this build. Sent to the backend to bootstrap the
// conversation so the agent's first greeting is already customer-aware.
// Both the name and ID are sent so the backend can do ID-based lookups, but
// the agent is instructed to address the customer by first name only.
export const CUSTOMER_ID = 'CUST_ABZ_003';
export const CUSTOMER_NAME = 'Charlie';

const INIT_MESSAGE =
  `Hello, my name is ${CUSTOMER_NAME} and my customer ID is ${CUSTOMER_ID}.`;

// Defaults to the Vite dev proxy path ('/adk' -> 127.0.0.1:8080, see
// vite.config.ts) so requests are same-origin and avoid CORS errors.
const AGENT_BASE_URL = (
  import.meta.env.VITE_AGENT_BASE_URL ?? '/adk'
).replace(/\/$/, '');

const ADK_APP_NAME = import.meta.env.VITE_ADK_APP_NAME ?? 'front_of_house_agent';
const USER_ID = import.meta.env.VITE_ADK_USER_ID ?? 'web_user';

let sessionId: string | null = sessionStorage.getItem('front_of_house_session_id');
let creatingSession: Promise<string> | null = null;

interface AdkEvent {
  author?: string;
  content?: {
    role?: string;
    parts?: Array<{
      text?: string;
    }>;
  };
}

async function createSession(): Promise<string> {
  const response = await fetch(
    `${AGENT_BASE_URL}/apps/${ADK_APP_NAME}/users/${USER_ID}/sessions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to create ADK session: ${response.status}`);
  }

  const session = await response.json();

  sessionId = session.id;
  sessionStorage.setItem('front_of_house_session_id', session.id);

  return session.id;
}

async function ensureSession(): Promise<string> {
  if (sessionId) return sessionId;

  if (!creatingSession) {
    creatingSession = createSession().finally(() => {
      creatingSession = null;
    });
  }

  return creatingSession;
}

function extractTextFromEvents(events: AdkEvent[]): string {
  const textEvents = events.filter((event) =>
    event.content?.parts?.some((part) => part.text)
  );

  const modelEvents = textEvents.filter(
    (event) =>
      event.content?.role === 'model' ||
      event.author === ADK_APP_NAME ||
      event.author === 'root_agent'
  );

  const finalEvent = modelEvents.at(-1) ?? textEvents.at(-1);

  const text = finalEvent?.content?.parts
    ?.map((part) => part.text ?? '')
    .join('')
    .trim();

  return text || 'The agent returned no text response.';
}

async function runAgent(message: string, currentSessionId: string): Promise<AgentReply> {
  const response = await fetch(`${AGENT_BASE_URL}/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      appName: ADK_APP_NAME,
      userId: USER_ID,
      sessionId: currentSessionId,
      streaming: false,
      newMessage: {
        role: 'user',
        parts: [
          {
            text: message,
          },
        ],
      },
    }),
  });

  if (response.status === 404) {
    sessionStorage.removeItem('front_of_house_session_id');
    sessionId = null;

    const newSessionId = await createSession();
    return runAgent(message, newSessionId);
  }

  if (!response.ok) {
    throw new Error(`ADK run failed: ${response.status}`);
  }

  const events: AdkEvent[] = await response.json();

  return {
    text: extractTextFromEvents(events),
  };
}

export async function sendMessageToAgent(message: string): Promise<AgentReply> {
  const currentSessionId = await ensureSession();
  return runAgent(message, currentSessionId);
}

// Bootstraps the conversation: opens a session, sends the hardcoded customer ID
// to the backend, and returns the agent's first (real) greeting.
export async function startConversation(): Promise<AgentReply> {
  const currentSessionId = await ensureSession();
  return runAgent(INIT_MESSAGE, currentSessionId);
}