import { useEffect, useRef, useState } from 'react';
import { sendMessageToAgent, startConversation } from '../../services/agentConnector';
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

export default function ChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const bootstrapped = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // On mount, bootstrap the conversation with the hardcoded customer ID and
  // show the backend's first greeting instead of a placeholder.
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    const init = async () => {
      setSending(true);
      try {
        const reply = await startConversation();
        setMessages([
          {
            id: makeId(),
            role: 'agent',
            text: reply.text,
          },
        ]);
      } catch {
        setMessages([
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

    void init();
  }, []);

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
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <p className="eyebrow">Lloyds Bank</p>
            <h1>Budget Assistant</h1>
          </div>
        </div>
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
