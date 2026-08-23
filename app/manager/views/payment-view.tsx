"use client";

import type {
  AppointmentViewModel,
  Payment,
  PaymentStatus,
} from "@/lib/db/types";

const PAYMENT_METHODS = ["Pay at salon", "Cash", "Card", "UPI", "Bank transfer"];

type PaymentViewProps = {
  payments: Payment[];
  changePayment: (id: string, status: PaymentStatus) => Promise<void>;
  changeMethod: (id: string, method: string) => Promise<void>;
  appointments: AppointmentViewModel[];
  setShowAppointment: (appointment: AppointmentViewModel | null) => void;
};

const PAYMENT_STATUSES: PaymentStatus[] = [
  "pending",
  "partial",
  "paid",
  "refunded",
  "cancelled",
];

export function PaymentView({
  payments,
  changePayment,
  changeMethod,
  appointments,
  setShowAppointment,
}: PaymentViewProps) {
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

          <h2>Payment tracking</h2>

          <p className="muted">
            Every booking creates a payment automatically — update status
            once you've collected it at the salon.
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
            <div className="empty-state">
              No payments yet — they're created automatically as customers
              book.
            </div>
          ) : (
            payments.map((payment) => {
              const linkedAppointment = payment.appointmentId
                ? appointments.find((a) => a.id === payment.appointmentId)
                : undefined;

              return (
                <div className="table-row" key={payment.id}>
                  <strong>{payment.customerName}</strong>

                  {linkedAppointment ? (
                    <button
                      type="button"
                      className="text-button"
                      style={{ textAlign: "left" }}
                      onClick={() => setShowAppointment(linkedAppointment)}
                    >
                      <span>
                        {payment.serviceName}
                        <small>{formatDate(payment.createdAt)}</small>
                      </span>
                    </button>
                  ) : (
                    <span>
                      {payment.serviceName}
                      <small>{formatDate(payment.createdAt)}</small>
                    </span>
                  )}

                  <span>{formatCurrency(payment.amount)}</span>

                  <select
                    value={payment.method ?? "Pay at salon"}
                    onChange={(event) =>
                      changeMethod(payment.id, event.target.value)
                    }
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>

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
              );
            })
          )}
        </div>
      </section>
    </>
  );
}
