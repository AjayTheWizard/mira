// Shared between the customer portal and manager portal — both read/write
// the same `notification` table, just scoped by userId.
export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: Date;
};
