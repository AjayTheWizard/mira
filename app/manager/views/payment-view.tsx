"use client";

import type { Payment, PaymentStatus } from "@/lib/db/types";

type PaymentViewProps = {
  payments: Payment[];
  changePayment: (id: string, status: PaymentStatus) => Promise<void>;
};

const PAYMENT_STATUSES: PaymentStatus[] = [
  "pending",
  "partial",
  "paid",
  "refunded",
  "cancelled",
];

export function PaymentView({ payments, changePayment }: PaymentViewProps) {
  const collectedThisMonth = payments
    .filter((payment) => payment.status === "paid")
    .reduce((total, payment) => total + payment.amount, 0);

  const formatCurrency = (amount: number) =>
    `रू${amount.toLocaleString("en-IN")}`;

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <>
      <div className="manager-view-toolbar">
        <div>
          <p className="eyebrow">PAYMENTS</p>

          <h2>Manual payment management</h2>

          <p className="muted">
            Update payment status after collecting at the salon.
          </p>
        </div>

        <div className="payment-total">
          <span>Collected this month</span>

          <strong>{formatCurrency(collectedThisMonth)}</strong>
        </div>
      </div>

      <section className="profile-panel">
        <div className="appointment-table full">
          <div className="table-head">
            <span>Customer</span>
            <span>Appointment</span>
            <span>Total</span>
            <span>Method</span>
            <span>Status</span>
            <span>Update</span>
          </div>

          {payments.length === 0 ? (
            <div className="empty-state">No payments found.</div>
          ) : (
            payments.map((payment) => (
              <div className="table-row" key={payment.id}>
                <strong>{payment.customerName}</strong>

                <span>
                  {payment.serviceName}

                  <small>{formatDate(payment.createdAt)}</small>
                </span>

                <span>{formatCurrency(payment.amount)}</span>

                <span>{payment.method || "Pay at salon"}</span>

                <span className="status-badge">{payment.status}</span>

                <select
                  value={payment.status}
                  onChange={(event) =>
                    changePayment(
                      payment.id,
                      event.target.value as PaymentStatus,
                    )
                  }
                >
                  {PAYMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
