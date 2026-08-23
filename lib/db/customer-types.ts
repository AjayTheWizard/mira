// Types for the customer-facing portal (explore, booking, appointments).
// Kept in a separate file from lib/db/types.ts so nothing there is touched —
// import from both files as needed.

export type { NotificationItem } from "./notification-types";

export type ServiceOption = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  durationMinutes: number;
  price: number;
  isActive: boolean;
};

export type StaffOption = {
  id: string;
  name: string;
  role: string | null;
};

export type ExploreSalon = {
  branchId: string;
  salonId: string;
  ownerId: string; // manager's userId — needed when creating appointments/payments
  name: string;
  logoUrl: string | null;
  area: string; // city or address fragment shown under the name
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  rating: number; // average, 0 if no reviews yet
  reviewCount: number;
  fromPrice: number | null; // lowest active service price
  services: string[]; // service names, for the tag row
  distanceKm: number | null; // null unless a location was provided
};

export type SalonDetail = ExploreSalon & {
  description: string | null;
  phone: string | null;
  services: string[];
  serviceOptions: ServiceOption[];
  staff: StaffOption[];
};

export type MyAppointment = {
  id: string;
  salonName: string;
  serviceName: string;
  staffName: string | null;
  appointmentDate: Date;
  durationMinutes: number;
  amount: number;
  status: string;
  notes: string | null;
  rated: boolean;
};

export type TimeSlot = {
  time: string; // "HH:MM", 24h
  label: string; // "10:30 AM"
};

export type CustomerPreferences = {
  location: string | null;
  notificationsEnabled: boolean;
  paymentRemindersEnabled: boolean;
};
