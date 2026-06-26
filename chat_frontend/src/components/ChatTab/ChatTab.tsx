import { useEffect, useRef, useState } from 'react';
import { sendMessageToAgent } from '../../services/agentConnector';
import './ChatTab.css';

type MessageRole = 'agent' | 'user';

interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
}

function makeId() {
  if ('randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2, 10);
}

const STARTER_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-message',
    role: 'agent',
    text: 'Hi, I am your agent placeholder. Send a message here and connect me to your backend later.',
  },
];

export default function ChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>(STARTER_MESSAGES);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMessage: ChatMessage = {
      id: makeId(),
      role: 'user',
      text: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setSending(true);

    try {
      const reply = await sendMessageToAgent(trimmed);
      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: 'agent',
          text: reply.text,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: 'agent',
          text: 'Sorry, I could not reach the agent service. Check your backend connection.',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  return (
    <section className="chat-tab" aria-label="Agent chat">
      <header className="chat-header">
        <div>
          <p className="eyebrow">Agent chat</p>
          <h1>Talk to your agent</h1>
        </div>
        <span className="status-pill">Mock mode</span>
      </header>

      <div className="message-panel">
        {messages.map((message) => (
          <div key={message.id} className={`message-row ${message.role}`}>
            <div className="message-bubble">{message.text}</div>
          </div>
        ))}

        {sending && (
          <div className="message-row agent">
            <div className="message-bubble typing" aria-label="Agent is typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <footer className="composer">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message your agent..."
          rows={1}
          disabled={sending}
        />
        <button onClick={() => void sendMessage()} disabled={!input.trim() || sending}>
          Send
        </button>
      </footer>
    </section>
  );
}
