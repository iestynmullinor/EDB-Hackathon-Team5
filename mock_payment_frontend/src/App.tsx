import ApplePayMock from './components/ApplePayMock/ApplePayMock';
import './App.css';

export default function App() {
  const notificationMessage = "";
  const shouldPaymentGoThrough = true;

  return (
    <main className="app-shell">
      <ApplePayMock
        notificationMessage={notificationMessage}
        shouldPaymentGoThrough={shouldPaymentGoThrough}
      />
    </main>
  );
}
