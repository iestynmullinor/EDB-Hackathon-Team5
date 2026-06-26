export type PaymentRequest = {
  merchant: string;
  amount: string;
  card: string;
};

export type EnforcerDecision = {
  approve: boolean;
  notification: string;
};

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const FALLBACK_DECISION: EnforcerDecision = {
  approve: true,
  notification:
    "Enforcer Agent could not be reached, so this mock payment was approved locally.",
};

const baseUrl = (import.meta.env.VITE_AGENT_BASE_URL || "/adk").replace(/\/$/, "");
const appName = import.meta.env.VITE_ADK_APP_NAME || "enforcer_agent";
const userId = import.meta.env.VITE_ADK_USER_ID || "web_user";
const sessionStorageKey = `adk-session:${appName}:${userId}`;

function getSessionId() {
  try {
    const existingSessionId = window.localStorage.getItem(sessionStorageKey);
    if (existingSessionId) return existingSessionId;

    const newSessionId = `payment_${crypto.randomUUID?.() || Date.now().toString(36)}`;
    window.localStorage.setItem(sessionStorageKey, newSessionId);
    return newSessionId;
  } catch {
    return `payment_${Date.now().toString(36)}`;
  }
}

async function ensureSession(sessionId: string) {
  const response = await fetch(
    `${baseUrl}/apps/${encodeURIComponent(appName)}/users/${encodeURIComponent(
      userId,
    )}/sessions/${encodeURIComponent(sessionId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    },
  );

  // ADK returns an error if the session already exists. That is fine here
  // because we intentionally reuse the same browser session for continuity.
  if (!response.ok && response.status !== 400 && response.status !== 409) {
    throw new Error(`Could not create ADK session (${response.status})`);
  }
}

function buildPrompt(payment: PaymentRequest) {
  return `Evaluate this debit card transaction.

Return your normal structured output with approve and notification.

Transaction JSON:
${JSON.stringify(
    {
      merchant: payment.merchant,
      amount: payment.amount,
      card: payment.card,
      currency: "GBP",
    },
    null,
    2,
  )}`;
}

function stripCodeFence(text: string) {
  return text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

function normaliseDecision(value: unknown): EnforcerDecision | null {
  if (!value || typeof value !== "object") return null;

  const maybeDecision = value as Record<string, unknown>;
  const approve = maybeDecision.approve;
  const notification = maybeDecision.notification;

  if (typeof approve !== "boolean" || typeof notification !== "string") {
    return null;
  }

  return {
    approve,
    notification: notification.trim() || FALLBACK_DECISION.notification,
  };
}

function findDecision(value: unknown): EnforcerDecision | null {
  const directDecision = normaliseDecision(value);
  if (directDecision) return directDecision;

  if (typeof value === "string") {
    const cleaned = stripCodeFence(value);

    try {
      return findDecision(JSON.parse(cleaned));
    } catch {
      const jsonMatch = cleaned.match(/\{[\s\S]*"approve"[\s\S]*"notification"[\s\S]*\}/);
      if (!jsonMatch) return null;

      try {
        return findDecision(JSON.parse(jsonMatch[0]));
      } catch {
        return null;
      }
    }
  }

  if (Array.isArray(value)) {
    for (let index = value.length - 1; index >= 0; index -= 1) {
      const decision = findDecision(value[index]);
      if (decision) return decision;
    }
    return null;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    const knownResponseFields = [
      record.output,
      record.response,
      record.result,
      record.text,
      record.content,
      record.parts,
    ];

    for (const fieldValue of knownResponseFields) {
      const decision = findDecision(fieldValue);
      if (decision) return decision;
    }

    for (const fieldValue of Object.values(record)) {
      const decision = findDecision(fieldValue);
      if (decision) return decision;
    }
  }

  return null;
}

async function runAgent(sessionId: string, payment: PaymentRequest) {
  const response = await fetch(`${baseUrl}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      appName,
      userId,
      sessionId,
      newMessage: {
        role: "user",
        parts: [{ text: buildPrompt(payment) }],
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`ADK run failed (${response.status})`);
  }

  return (await response.json()) as JsonValue;
}

export async function evaluatePaymentWithEnforcer(
  payment: PaymentRequest,
): Promise<EnforcerDecision> {
  try {
    const sessionId = getSessionId();
    await ensureSession(sessionId);
    const adkEvents = await runAgent(sessionId, payment);
    const decision = findDecision(adkEvents);

    if (!decision) {
      throw new Error("Enforcer Agent response did not include approve and notification.");
    }

    return decision;
  } catch (error) {
    console.error("Enforcer Agent payment check failed", error);
    return FALLBACK_DECISION;
  }
}
