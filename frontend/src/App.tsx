import { useState } from 'react';
import ApplePayMock from './components/ApplePayMock/ApplePayMock';
import ChatTab from './components/ChatTab/ChatTab';
import './App.css';

type AppTab = 'chat' | 'pay';

const tabs: Array<{ id: AppTab; label: string }> = [
  { id: 'chat', label: 'Chat' },
  { id: 'pay', label: 'Apple Pay' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('chat');
  const isPayMode = activeTab === 'pay';

  return (
    <main className={`app-shell ${isPayMode ? 'pay-mode' : ''}`}>
      <nav className="tab-bar" aria-label="Main sections">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className={`tab-content ${isPayMode ? 'pay-content' : ''}`}>
        {activeTab === 'chat' ? <ChatTab /> : <ApplePayMock onClose={() => setActiveTab('chat')} />}
      </div>
    </main>
  );
}
