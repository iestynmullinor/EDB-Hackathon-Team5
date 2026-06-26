import { useMemo, useState } from 'react';
import './ApplePayMock.css';

type PaymentStatus = 'idle' | 'authorising' | 'success';

type Transaction = {
  id: string;
  merchant: string;
  amount: string;
  card: string;
  createdAt: string;
};

type EditablePaymentDetails = {
  card: string;
  merchant: string;
  amount: string;
  shipLabel: string;
  recipient: string;
  addressLineOne: string;
  addressLineTwo: string;
  country: string;
};

type Props = {
  onClose: () => void;
};

const defaultPaymentDetails: EditablePaymentDetails = {
  card: 'Apple Card',
  merchant: 'Pet Store',
  amount: 'US$24.99',
  shipLabel: 'Ship to',
  recipient: 'Juan Chavez',
  addressLineOne: '683 Jefferson Street',
  addressLineTwo: 'Tiburon CA 91423',
  country: 'United States',
};

function makeId() {
  if ('randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2, 10);
}

function AppleLogoIcon() {
  return (
    <svg className="apple-logo-icon" viewBox="0 0 24 28" aria-hidden="true" focusable="false">
      <path d="M18.9 14.6c0-3 2.5-4.4 2.6-4.5-1.4-2.1-3.6-2.4-4.4-2.4-1.9-.2-3.6 1.1-4.6 1.1-.9 0-2.4-1.1-4-1.1-2.1 0-4 1.2-5 3.1-2.2 3.8-.6 9.4 1.5 12.5 1 1.5 2.3 3.2 3.9 3.1 1.6-.1 2.2-1 4-1s2.3 1 4 1c1.7 0 2.7-1.5 3.7-3 1.2-1.7 1.7-3.3 1.7-3.4-.1-.1-3.3-1.3-3.4-5.4ZM15.9 5.7c.9-1 1.4-2.4 1.3-3.8-1.2.1-2.6.8-3.5 1.8-.8.9-1.5 2.3-1.3 3.7 1.3.1 2.7-.7 3.5-1.7Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="close-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="m6.2 6.2 7.6 7.6M13.8 6.2l-7.6 7.6" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className="chevron-icon" viewBox="0 0 12 20" aria-hidden="true" focusable="false">
      <path d="m3.2 2.8 6 7.2-6 7.2" />
    </svg>
  );
}

function AppleCardIcon() {
  return (
    <svg className="apple-card-icon" viewBox="0 0 48 34" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="cardBaseGradient" x1="5" x2="43" y1="2" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff7df" />
          <stop offset="0.48" stopColor="#f8faff" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <radialGradient id="cardWarmBlob" cx="0" cy="0" r="1" gradientTransform="translate(14 15) rotate(47) scale(16 13)" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff8a3d" />
          <stop offset="0.45" stopColor="#ffd84d" />
          <stop offset="1" stopColor="#ffd84d" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cardCoolBlob" cx="0" cy="0" r="1" gradientTransform="translate(31 18) rotate(133) scale(19 15)" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fb4dff" />
          <stop offset="0.45" stopColor="#3478ff" />
          <stop offset="1" stopColor="#3478ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="48" height="34" rx="7" fill="url(#cardBaseGradient)" />
      <rect width="48" height="34" rx="7" fill="url(#cardWarmBlob)" opacity="0.92" />
      <rect width="48" height="34" rx="7" fill="url(#cardCoolBlob)" opacity="0.86" />
      <rect x="0.5" y="0.5" width="47" height="33" rx="6.5" fill="none" stroke="white" strokeOpacity="0.55" />
    </svg>
  );
}

function AddressIcon() {
  return (
    <svg className="address-icon" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
      <rect width="28" height="28" rx="6" fill="currentColor" opacity="0.08" />
      <path d="M14 5.7c-2.6 0-4.6 2-4.6 4.6 0 3.5 4.6 8.2 4.6 8.2s4.6-4.7 4.6-8.2c0-2.6-2-4.6-4.6-4.6Zm0 6.4a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6Z" fill="currentColor" />
      <path d="M8.2 21.5h11.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.72" />
    </svg>
  );
}

function DogFoodIcon() {
  return (
    <svg className="dog-food-icon" viewBox="0 0 52 52" aria-hidden="true" focusable="false">
      <circle cx="26" cy="26" r="26" fill="currentColor" />
      <path d="M16.4 28.8c0-6.9 3.9-10.8 10.1-10.8h4.8c3.3 0 5.5 2.2 5.5 5.5v9.8c0 3-2.4 5.4-5.4 5.4h-9.5c-3.2 0-5.5-2.7-5.5-6v-3.9Z" fill="white" opacity="0.78" />
      <path d="M31.8 14.2c2.5.4 4.7 2 5.9 4.2l3.4-.6c.6-.1 1 .5.8 1l-1.6 4.1c-.4 1.1-1.5 1.8-2.7 1.8h-2.4c-2.2 0-4-1.8-4-4v-5.9c0-.4.3-.7.6-.6Z" fill="white" opacity="0.78" />
      <circle cx="35.9" cy="20.7" r="1.3" fill="#3d894f" />
      <path d="M18.2 37.2v5.2M26 38.7v4.5M33.8 37.2v5.2" stroke="white" strokeOpacity="0.78" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function SideButtonIcon() {
  return (
    <svg className="side-button-svg" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2.25" />
      <path d="M16 7.8v16.4" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
      <path d="m13 12.2 4 3.8-4 3.8" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FaceIdIcon() {
  return (
    <svg className="face-id-svg" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <path d="M11 3H7a4 4 0 0 0-4 4v4M29 3h4a4 4 0 0 1 4 4v4M3 29v4a4 4 0 0 0 4 4h4M37 29v4a4 4 0 0 1-4 4h-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M15 15v3.7M25 15v3.7M20 14.8v8.1c0 1.3-.7 2-2.1 2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M13.8 28.2c1.4 1.8 3.5 2.8 6.2 2.8s4.8-1 6.2-2.8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function SuccessIcon() {
  return (
    <svg className="success-icon-svg" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="15" fill="currentColor" />
      <path d="m9.4 16.5 4.3 4.3 9.3-10" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg className="speaker-icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4.2 9.2h4.1l5.2-4.1v13.8l-5.2-4.1H4.2V9.2Z" fill="currentColor" />
      <path d="M16.5 8.2a5.3 5.3 0 0 1 0 7.6M18.7 5.9a8.6 8.6 0 0 1 0 12.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function ApplePayMock({ onClose }: Props) {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentDetails, setPaymentDetails] = useState(defaultPaymentDetails);

  const latestTransaction = transactions[0];

  const statusLabel = useMemo(() => {
    if (status === 'authorising') return 'Authorising payment';
    if (status === 'success') return 'Payment complete';
    return 'Ready to pay';
  }, [status]);

  const updatePaymentDetail = (field: keyof EditablePaymentDetails, value: string) => {
    setPaymentDetails((current) => ({ ...current, [field]: value }));
  };

  const performPayment = () => {
    if (status === 'authorising') return;

    setStatus('authorising');

    window.setTimeout(() => {
      setTransactions((current) => [
        {
          id: makeId(),
          merchant: paymentDetails.merchant,
          amount: paymentDetails.amount,
          card: paymentDetails.card,
          createdAt: new Date().toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
        ...current,
      ]);
      setStatus('success');
    }, 900);
  };

  const resetPayment = () => {
    setStatus('idle');
  };

  return (
    <section className={`apple-pay-screen ${status}`} aria-label="Mock Apple Pay screen">
      <div className="apple-pay-canvas">
        <div className="basket-page" aria-hidden="true">
          <div className="device-cutout" />
          <div className="basket-content">
            <h1>Basket</h1>
            <article className="basket-product-card">
              <div className="dog-icon">
                <DogFoodIcon />
              </div>
              <div>
                <h2>Bag of Dog Food</h2>
                <p>A nutritious meal for your best pal.</p>
              </div>
            </article>
          </div>
        </div>

        <div className="apple-pay-dim" />

        <section className="apple-pay-sheet" aria-label={statusLabel} aria-live="polite">
          <header className="apple-pay-sheet-header">
            <div className="apple-pay-wordmark" aria-label="Apple Pay">
              <AppleLogoIcon />
              <span>Pay</span>
            </div>
            <button className="apple-pay-close" onClick={onClose} type="button" aria-label="Close Apple Pay">
              <CloseIcon />
            </button>
          </header>

          <div className="apple-pay-row apple-pay-card-row">
            <AppleCardIcon />
            <input
              aria-label="Payment card"
              className="apple-pay-editable-input apple-pay-card-input"
              value={paymentDetails.card}
              onChange={(event) => updatePaymentDetail('card', event.target.value)}
            />
            <ChevronIcon />
          </div>

          <div className="apple-pay-row apple-pay-address-row">
            <div className="row-symbol" aria-hidden="true">
              <AddressIcon />
            </div>
            <div className="row-copy">
              <input
                aria-label="Shipping label"
                className="apple-pay-editable-input row-label-input"
                value={paymentDetails.shipLabel}
                onChange={(event) => updatePaymentDetail('shipLabel', event.target.value)}
              />
              <input
                aria-label="Recipient name"
                className="apple-pay-editable-input row-strong-input"
                value={paymentDetails.recipient}
                onChange={(event) => updatePaymentDetail('recipient', event.target.value)}
              />
              <input
                aria-label="Address line one"
                className="apple-pay-editable-input row-copy-input"
                value={paymentDetails.addressLineOne}
                onChange={(event) => updatePaymentDetail('addressLineOne', event.target.value)}
              />
              <input
                aria-label="Address line two"
                className="apple-pay-editable-input row-copy-input"
                value={paymentDetails.addressLineTwo}
                onChange={(event) => updatePaymentDetail('addressLineTwo', event.target.value)}
              />
              <input
                aria-label="Country"
                className="apple-pay-editable-input row-copy-input"
                value={paymentDetails.country}
                onChange={(event) => updatePaymentDetail('country', event.target.value)}
              />
            </div>
            <ChevronIcon />
          </div>

          <div className="apple-pay-total-row">
            <div>
              <label className="apple-pay-total-label">
                <span>Pay</span>
                <input
                  aria-label="Merchant"
                  className="apple-pay-editable-input merchant-input"
                  value={paymentDetails.merchant}
                  onChange={(event) => updatePaymentDetail('merchant', event.target.value)}
                />
              </label>
              <input
                aria-label="Payment amount"
                className="apple-pay-editable-input amount-input"
                value={paymentDetails.amount}
                onChange={(event) => updatePaymentDetail('amount', event.target.value)}
              />
            </div>
            <ChevronIcon />
          </div>

          <div className="apple-pay-action-area">
            {status === 'idle' && (
              <button className="double-click-button" onClick={performPayment} type="button">
                <SideButtonIcon />
                <span>Double-Click to Pay</span>
              </button>
            )}

            {status === 'authorising' && (
              <div className="payment-status-panel" role="status">
                <FaceIdIcon />
                <span>Confirming with Face ID</span>
              </div>
            )}

            {status === 'success' && (
              <div className="payment-status-panel success-panel" role="status">
                <SuccessIcon />
                <strong>Done</strong>
                <span>
                  {latestTransaction
                    ? `${latestTransaction.amount} paid to ${latestTransaction.merchant}`
                    : 'Mock payment complete'}
                </span>
                <button onClick={resetPayment} type="button">Pay again</button>
              </div>
            )}
          </div>

          <div className="home-indicator" aria-hidden="true" />
          <div className="sound-icon" aria-hidden="true">
            <SpeakerIcon />
          </div>
        </section>
      </div>
    </section>
  );
}
