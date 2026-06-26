import { useEffect, useMemo, useState } from "react";
import { evaluatePaymentWithEnforcer } from "../../lib/enforcerAgent";
import "./ApplePayMock.css";

type PaymentStatus = "idle" | "authorising" | "success" | "declined";

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
  onClose?: () => void;
  notificationMessage?: string;
  shouldPaymentGoThrough?: boolean;
};

const defaultPaymentDetails: EditablePaymentDetails = {
  card: "Lloyds Debit Card",
  merchant: "Pet Store",
  amount: "£24.99",
  shipLabel: "Merchant",
  recipient: "Juan Chavez",
  addressLineOne: "683 Jefferson Street",
  addressLineTwo: "Tiburon CA 91423",
  country: "United Kingdom",
};

function makeId() {
  if ("randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2, 10);
}

function CloseIcon() {
  return (
    <svg
      className="close-icon"
      viewBox="0 0 20 20"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m6.2 6.2 7.6 7.6M13.8 6.2l-7.6 7.6" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="chevron-icon"
      viewBox="0 0 12 20"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m3.2 2.8 6 7.2-6 7.2" />
    </svg>
  );
}

function LloydsCardIcon() {
  return (
    <svg
      className="lloyds-card-icon"
      viewBox="0 0 48 34"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient
          id="lbgGrad"
          x1="0"
          y1="0"
          x2="48"
          y2="34"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#006A4E" />
          <stop offset="1" stopColor="#004D38" />
        </linearGradient>
      </defs>
      <rect width="48" height="34" rx="7" fill="url(#lbgGrad)" />
      <rect
        x="0.5"
        y="0.5"
        width="47"
        height="33"
        rx="6.5"
        fill="none"
        stroke="white"
        strokeOpacity="0.2"
      />
      {/* Lloyds wordmark */}
      <text
        x="7"
        y="14"
        fill="white"
        fillOpacity="0.9"
        fontSize="5"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        LLOYDS
      </text>
      <text
        x="7"
        y="20"
        fill="white"
        fillOpacity="0.6"
        fontSize="3.5"
        fontFamily="Arial, sans-serif"
      >
        BANK
      </text>
      {/* Card number dots */}
      <g fill="white" fillOpacity="0.55">
        <circle cx="8" cy="28" r="1.3" />
        <circle cx="12" cy="28" r="1.3" />
        <circle cx="16" cy="28" r="1.3" />
        <circle cx="20" cy="28" r="1.3" />
        <circle cx="26" cy="28" r="1.3" />
        <circle cx="30" cy="28" r="1.3" />
        <circle cx="34" cy="28" r="1.3" />
        <circle cx="38" cy="28" r="1.3" />
      </g>
      {/* Contactless symbol */}
      <g
        fill="none"
        stroke="white"
        strokeOpacity="0.7"
        strokeWidth="1.2"
        strokeLinecap="round"
      >
        <path d="M39 8a5 5 0 0 1 0 7" />
        <path d="M41 6a8 8 0 0 1 0 11" />
      </g>
    </svg>
  );
}

function AddressIcon() {
  return (
    <svg
      className="address-icon"
      viewBox="0 0 28 28"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="28" height="28" rx="6" fill="currentColor" opacity="0.08" />
      <path
        d="M14 5.7c-2.6 0-4.6 2-4.6 4.6 0 3.5 4.6 8.2 4.6 8.2s4.6-4.7 4.6-8.2c0-2.6-2-4.6-4.6-4.6Zm0 6.4a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6Z"
        fill="currentColor"
      />
      <path
        d="M8.2 21.5h11.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.72"
      />
    </svg>
  );
}

function DogFoodIcon() {
  return (
    <svg
      className="dog-food-icon"
      viewBox="0 0 52 52"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="26" cy="26" r="26" fill="currentColor" />
      <path
        d="M16.4 28.8c0-6.9 3.9-10.8 10.1-10.8h4.8c3.3 0 5.5 2.2 5.5 5.5v9.8c0 3-2.4 5.4-5.4 5.4h-9.5c-3.2 0-5.5-2.7-5.5-6v-3.9Z"
        fill="white"
        opacity="0.78"
      />
      <path
        d="M31.8 14.2c2.5.4 4.7 2 5.9 4.2l3.4-.6c.6-.1 1 .5.8 1l-1.6 4.1c-.4 1.1-1.5 1.8-2.7 1.8h-2.4c-2.2 0-4-1.8-4-4v-5.9c0-.4.3-.7.6-.6Z"
        fill="white"
        opacity="0.78"
      />
      <circle cx="35.9" cy="20.7" r="1.3" fill="#006A4E" />
      <path
        d="M18.2 37.2v5.2M26 38.7v4.5M33.8 37.2v5.2"
        stroke="white"
        strokeOpacity="0.78"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TapPayIcon() {
  // NFC / contactless tap icon
  return (
    <svg
      className="side-button-svg"
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="16"
        cy="16"
        r="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
      />
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M11 16a5 5 0 0 1 5-5" />
        <path d="M11 16a5 5 0 0 0 5 5" />
        <path d="M14 16a2 2 0 0 1 2-2" />
        <path d="M14 16a2 2 0 0 0 2 2" />
      </g>
      <circle cx="16" cy="16" r="1.4" fill="currentColor" />
    </svg>
  );
}

function FingerprintIcon() {
  return (
    <svg
      className="face-id-svg"
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M20 6C12.3 6 6 12.3 6 20s6.3 14 14 14 14-6.3 14-14S27.7 6 20 6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M14 20c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M17 20a3 3 0 1 1 6 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M11 20c0-5 4-9 9-9s9 4 9 9c0 3-1.4 5.7-3.5 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SuccessIcon() {
  return (
    <svg
      className="success-icon-svg"
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="16" cy="16" r="15" fill="currentColor" />
      <path
        d="m9.4 16.5 4.3 4.3 9.3-10"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DeclinedIcon() {
  return (
    <svg
      className="declined-icon-svg"
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="16" cy="16" r="15" fill="currentColor" />
      <path
        d="m10.4 10.4 11.2 11.2M21.6 10.4 10.4 21.6"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg
      className="speaker-icon-svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4.2 9.2h4.1l5.2-4.1v13.8l-5.2-4.1H4.2V9.2Z"
        fill="currentColor"
      />
      <path
        d="M16.5 8.2a5.3 5.3 0 0 1 0 7.6M18.7 5.9a8.6 8.6 0 0 1 0 12.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

type NotificationTone = "success" | "declined";

function WalletNotificationIcon({ tone }: { tone: NotificationTone }) {
  return (
    <svg
      className="wallet-notification-icon"
      viewBox="0 0 44 44"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient
          id="walletIconBase"
          x1="8"
          x2="36"
          y1="5"
          y2="39"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#1f8cff" />
          <stop offset="1" stopColor="#0057ff" />
        </linearGradient>
      </defs>
      <rect
        x="2"
        y="2"
        width="40"
        height="40"
        rx="10"
        fill="url(#walletIconBase)"
      />
      <rect
        x="9"
        y="13"
        width="26"
        height="18"
        rx="5"
        fill="white"
        opacity="0.94"
      />
      <rect x="12" y="16" width="20" height="4" rx="2" fill="#ff9f0a" />
      <rect x="12" y="22" width="16" height="4" rx="2" fill="#34c759" />
      <circle
        className="wallet-notification-badge"
        cx="34"
        cy="34"
        r="8"
        fill="currentColor"
      />
      {tone === "declined" ? (
        <path
          d="m30.8 30.8 6.4 6.4M37.2 30.8l-6.4 6.4"
          fill="none"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="m30.4 34.1 2.5 2.5 5-5.5"
          fill="none"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function PaymentNotification({
  message,
  tone,
  onDismiss,
}: {
  message: string;
  tone: NotificationTone;
  onDismiss: () => void;
}) {
  return (
    <div
      className={`payment-notification ${tone}`}
      role="status"
      aria-live="polite"
    >
      <button
        className="payment-notification-card"
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <WalletNotificationIcon tone={tone} />
        <span className="payment-notification-copy">
          <span className="payment-notification-header">
            <strong>Wallet</strong>
            <span>now</span>
          </span>
          <span className="payment-notification-message">{message}</span>
        </span>
      </button>
    </div>
  );
}

function DeclinedPaymentModal({
  message,
  paymentDetails,
  onClose,
}: {
  message: string;
  paymentDetails: EditablePaymentDetails;
  onClose: () => void;
}) {
  return (
    <div
      className="declined-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <section
        className="declined-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="declined-modal-title"
        aria-describedby="declined-modal-message"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="declined-modal-close"
          type="button"
          onClick={onClose}
          aria-label="Close declined payment modal"
        >
          <CloseIcon />
        </button>

        <div className="declined-modal-icon">
          <DeclinedIcon />
        </div>

        <h2 id="declined-modal-title">Payment declined</h2>
        <p id="declined-modal-message">{message}</p>

        <dl className="declined-payment-summary">
          <div>
            <dt>Merchant</dt>
            <dd>{paymentDetails.merchant}</dd>
          </div>
          <div>
            <dt>Amount</dt>
            <dd>{paymentDetails.amount}</dd>
          </div>
          <div>
            <dt>Card</dt>
            <dd>{paymentDetails.card}</dd>
          </div>
        </dl>

        <div className="declined-modal-actions">
          <button
            className="modal-primary-button"
            type="button"
            onClick={onClose}
          >
            Dismiss
          </button>
        </div>
      </section>
    </div>
  );
}

export default function ApplePayMock({
  onClose,
  notificationMessage = "",
  shouldPaymentGoThrough = true,
}: Props = {}) {
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentDetails, setPaymentDetails] = useState(defaultPaymentDetails);
  const [activeNotification, setActiveNotification] = useState<string | null>(
    null,
  );
  const [enforcerNotification, setEnforcerNotification] = useState<
    string | null
  >(null);
  const [isDeclinedModalOpen, setIsDeclinedModalOpen] = useState(false);

  const latestTransaction = transactions[0];
  const customNotificationMessage = notificationMessage.trim();
  const declinedMessage =
    enforcerNotification ||
    customNotificationMessage ||
    "Your payment was declined. Please check the card details or try another card.";

  const statusLabel = useMemo(() => {
    if (status === "authorising") return "Authorising payment";
    if (status === "success") return "Payment complete";
    if (status === "declined") return "Payment declined";
    return "Ready to pay";
  }, [status]);

  useEffect(() => {
    if (!activeNotification) return;

    const timeout = window.setTimeout(() => {
      setActiveNotification(null);
    }, 4200);

    return () => window.clearTimeout(timeout);
  }, [activeNotification]);

  const updatePaymentDetail = (
    field: keyof EditablePaymentDetails,
    value: string,
  ) => {
    setPaymentDetails((current) => ({ ...current, [field]: value }));
  };

  const performPayment = async () => {
    if (status === "authorising") return;

    setStatus("authorising");
    setIsDeclinedModalOpen(false);
    setActiveNotification(null);
    setEnforcerNotification(null);

    const enforcerDecision = await evaluatePaymentWithEnforcer({
      merchant: paymentDetails.merchant,
      amount: paymentDetails.amount,
      card: paymentDetails.card,
    });

    const paymentApproved = enforcerDecision.approve && shouldPaymentGoThrough;
    const notification = shouldPaymentGoThrough
      ? enforcerDecision.notification
      : customNotificationMessage ||
        "Payment blocked by the local mock setting.";
    setEnforcerNotification(notification);

    if (!paymentApproved) {
      setStatus("declined");
      setIsDeclinedModalOpen(true);
      setActiveNotification(notification);
      return;
    }

    setTransactions((current) => [
      {
        id: makeId(),
        merchant: paymentDetails.merchant,
        amount: paymentDetails.amount,
        card: paymentDetails.card,
        createdAt: new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
      ...current,
    ]);
    setStatus("success");
    setActiveNotification(notification);
  };

  const resetPayment = () => {
    setStatus("idle");
    setIsDeclinedModalOpen(false);
    setEnforcerNotification(null);
  };

  const handleClose = () => {
    onClose?.();
    resetPayment();
  };

  return (
    <section
      className={`apple-pay-screen ${status}`}
      aria-label="Mock Lloyds Pay screen"
    >
      <div className="apple-pay-canvas">
        {activeNotification && (
          <PaymentNotification
            message={activeNotification}
            tone={status === "declined" ? "declined" : "success"}
            onDismiss={() => setActiveNotification(null)}
          />
        )}

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

        <section
          className="apple-pay-sheet"
          aria-label={statusLabel}
          aria-live="polite"
        >
          <header className="apple-pay-sheet-header">
            <div className="apple-pay-wordmark" aria-label="Lloyds Pay">
              <span>
                Lloyds <strong>Pay</strong>
              </span>
            </div>
            <button
              className="apple-pay-close"
              onClick={handleClose}
              type="button"
              aria-label="Close Lloyds Pay"
            >
              <CloseIcon />
            </button>
          </header>

          <div className="apple-pay-row apple-pay-card-row">
            <LloydsCardIcon />
            <input
              aria-label="Payment card"
              className="apple-pay-editable-input apple-pay-card-input"
              value={paymentDetails.card}
              onChange={(event) =>
                updatePaymentDetail("card", event.target.value)
              }
            />
            <ChevronIcon />
          </div>

          <div className="apple-pay-row apple-pay-address-row">
            <div className="row-symbol" aria-hidden="true">
              <AddressIcon />
            </div>
            <div className="row-copy">
              <input
                aria-label="Payment detail label"
                className="apple-pay-editable-input row-label-input"
                value={paymentDetails.shipLabel}
                onChange={(event) =>
                  updatePaymentDetail("shipLabel", event.target.value)
                }
              />
              <input
                aria-label="Merchant name"
                className="apple-pay-editable-input row-strong-input"
                value={paymentDetails.merchant}
                onChange={(event) =>
                  updatePaymentDetail("merchant", event.target.value)
                }
              />
              <input
                aria-label="Address line one"
                className="apple-pay-editable-input row-copy-input"
                value={paymentDetails.addressLineOne}
                onChange={(event) =>
                  updatePaymentDetail("addressLineOne", event.target.value)
                }
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
                  onChange={(event) =>
                    updatePaymentDetail("merchant", event.target.value)
                  }
                />
              </label>
              <input
                aria-label="Payment amount"
                className="apple-pay-editable-input amount-input"
                value={paymentDetails.amount}
                onChange={(event) =>
                  updatePaymentDetail("amount", event.target.value)
                }
              />
            </div>
            <ChevronIcon />
          </div>

          <div className="apple-pay-action-area">
            {status === "idle" && (
              <button
                className="double-click-button"
                onClick={performPayment}
                type="button"
              >
                <TapPayIcon />
                <span>Tap to Pay</span>
              </button>
            )}

            {status === "authorising" && (
              <div className="payment-status-panel" role="status">
                <FingerprintIcon />
                <span>Checking with Enforcer Agent</span>
              </div>
            )}

            {status === "success" && (
              <div
                className="payment-status-panel result-panel success-panel"
                role="status"
              >
                <SuccessIcon />
                <strong>Done</strong>
                <span>
                  {latestTransaction
                    ? `${latestTransaction.amount} paid to ${latestTransaction.merchant}`
                    : "Mock payment complete"}
                </span>
                <button onClick={resetPayment} type="button">
                  Pay again
                </button>
              </div>
            )}

            {status === "declined" && (
              <div
                className="payment-status-panel result-panel declined-panel"
                role="status"
              >
                <DeclinedIcon />
                <strong>Declined</strong>
                <span>{declinedMessage}</span>
                <button onClick={resetPayment} type="button">
                  Try again
                </button>
              </div>
            )}
          </div>

          <div className="home-indicator" aria-hidden="true" />
          <div className="sound-icon" aria-hidden="true">
            <SpeakerIcon />
          </div>
        </section>

        {isDeclinedModalOpen && (
          <DeclinedPaymentModal
            message={declinedMessage}
            paymentDetails={paymentDetails}
            onClose={() => setIsDeclinedModalOpen(false)}
          />
        )}
      </div>
    </section>
  );
}
