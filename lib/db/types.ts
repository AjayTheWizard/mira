import type { FormEvent } from "react";
import { branch, appointment, payment, rating, salon, staff, service } from "./schema";
export type Salon = typeof salon.$inferSelect;
export type NewSalon = typeof salon.$inferInsert;
export type Branch = typeof branch.$inferSelect;
export type NewBranch = typeof branch.$inferInsert;
export type Appointment = typeof appointment.$inferSelect;
export type NewAppointment = typeof appointment.$inferInsert;
export type Payment = typeof payment.$inferSelect;
export type NewPayment = typeof payment.$inferInsert;
export type Rating = typeof rating.$inferSelect;
export type NewRating = typeof rating.$inferInsert;
export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;
export type Service = typeof service.$inferSelect;
export type NewService = typeof service.$inferInsert;
export type User = {
  name?: string;
  email?: string;
};
export type ManagerStats = {
  todayAppointments: number;
  upcomingAppointments: number;
  completedToday: number;
  cancelledToday: number;
  todayRevenue: number;
  pendingPaymentCount: number;
  pendingPaymentAmount: number;
  pendingPaymentPercentage: number;
  customers: number;
  staff: number;
};
export type MonthlyRevenue = {
  date: string;
  revenue: number;
};
export type ManagerAppointment = {
  id: string;
  customerId: string;
  customerName: string;
  salonName: string;
  serviceName: string;
  appointmentDate: Date;
  durationMinutes: number;
  amount: number;
  status: string;
  notes: string | null;
  staffId: string | null;
  staffName: string | null;
};
export type ManagerWorkspaceProps = {
  initialSalon: Salon | null;
  initialBranches: Branch[];
  initialPayments: Payment[];
  ratings: Rating[];
  initialAppointments?: ManagerAppointment[];
  initialStaff?: Staff[];
  stats?: ManagerStats;
  monthlyRevenue?: MonthlyRevenue[];
  user?: User;
};
export type AppointmentViewModel = {
  id: string;
  customer: string;
  salon: string;
  service: string;
  staff: string;
  time: string;
  date: Date;
  status: string;
  amount: string;
};
export const managerViews = [
  "Home",
  "Appointments",
  "My Salons",
  "My Services",
  "My Staffs",
  "Availability",
  "Payments",
  "Profile",
] as const;
export type ManagerView = (typeof managerViews)[number];
export type RevenueRange = "7d" | "30d" | "12m";
export const paymentStatuses = [
  "pending",
  "partial",
  "paid",
  "refunded",
  "cancelled",
] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];
