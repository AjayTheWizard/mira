"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  appointment,
  availability,
  branch,
  favorite,
  notification,
  payment,
  preference,
  rating,
  salon,
  service,
  staff,
} from "@/lib/db/schema";
import { distanceKm } from "@/lib/geo";
import type {
  CustomerPreferences,
  ExploreSalon,
  MyAppointment,
  SalonDetail,
  ServiceOption,
  StaffOption,
  TimeSlot,
} from "@/lib/db/customer-types";
import { and, asc, eq, gte, inArray, lt, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

async function customerSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

// ---------------------------------------------------------------------------
// Explore / search
// ---------------------------------------------------------------------------

export async function getExploreSalons(input?: {
  query?: string;
  lat?: number;
  lng?: number;
}): Promise<ExploreSalon[]> {
  const branches = await db
    .select({
      branchId: branch.id,
      salonId: salon.id,
      ownerId: salon.userId,
      name: salon.name,
      logoUrl: salon.logoUrl,
      address: branch.address,
      city: branch.city,
      latitude: branch.latitude,
      longitude: branch.longitude,
      isActive: branch.isActive,
    })
    .from(branch)
    .innerJoin(salon, eq(branch.salonId, salon.id))
    .where(eq(branch.isActive, true));

  if (branches.length === 0) return [];

  const salonIds = [...new Set(branches.map((b) => b.salonId))];

  const [ratingRows, serviceRows] = await Promise.all([
    db
      .select({
        salonId: rating.salonId,
        score: rating.score,
      })
      .from(rating)
      .where(inArray(rating.salonId, salonIds)),
    db
      .select({
        salonId: service.salonId,
        name: service.name,
        price: service.price,
      })
      .from(service)
      .where(and(inArray(service.salonId, salonIds), eq(service.isActive, true))),
  ]);

  const ratingBySalon = new Map<string, { total: number; count: number }>();
  for (const r of ratingRows) {
    const existing = ratingBySalon.get(r.salonId) ?? { total: 0, count: 0 };
    existing.total += r.score;
    existing.count += 1;
    ratingBySalon.set(r.salonId, existing);
  }

  const servicesBySalon = new Map<string, { names: string[]; minPrice: number | null }>();
  for (const s of serviceRows) {
    const existing = servicesBySalon.get(s.salonId) ?? { names: [], minPrice: null };
    existing.names.push(s.name);
    existing.minPrice =
      existing.minPrice === null ? s.price : Math.min(existing.minPrice, s.price);
    servicesBySalon.set(s.salonId, existing);
  }

  const query = input?.query?.trim().toLowerCase() ?? "";
  const hasLocation = input?.lat != null && input?.lng != null;

  let results: ExploreSalon[] = branches.map((b) => {
    const ratingInfo = ratingBySalon.get(b.salonId);
    const serviceInfo = servicesBySalon.get(b.salonId);
    const dist =
      hasLocation && b.latitude != null && b.longitude != null
        ? distanceKm(input!.lat!, input!.lng!, b.latitude, b.longitude)
        : null;

    return {
      branchId: b.branchId,
      salonId: b.salonId,
      ownerId: b.ownerId,
      name: b.name,
      logoUrl: b.logoUrl,
      area: b.city ?? b.address ?? "",
      address: b.address,
      city: b.city,
      latitude: b.latitude,
      longitude: b.longitude,
      isActive: b.isActive,
      rating: ratingInfo ? Number((ratingInfo.total / ratingInfo.count).toFixed(1)) : 0,
      reviewCount: ratingInfo?.count ?? 0,
      fromPrice: serviceInfo?.minPrice ?? null,
      services: serviceInfo?.names ?? [],
      distanceKm: dist,
    };
  });

  if (query) {
    results = results.filter((r) =>
      `${r.name} ${r.area} ${r.services.join(" ")}`.toLowerCase().includes(query),
    );
  }

  if (hasLocation) {
    results.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  } else {
    results.sort((a, b) => b.rating - a.rating);
  }

  return results;
}

export async function getSalonDetail(branchId: string): Promise<SalonDetail | null> {
  const rows = await db
    .select({
      branchId: branch.id,
      salonId: salon.id,
      ownerId: salon.userId,
      name: salon.name,
      logoUrl: salon.logoUrl,
      description: salon.description,
      phone: salon.phone,
      address: branch.address,
      city: branch.city,
      latitude: branch.latitude,
      longitude: branch.longitude,
      isActive: branch.isActive,
    })
    .from(branch)
    .innerJoin(salon, eq(branch.salonId, salon.id))
    .where(eq(branch.id, branchId))
    .limit(1);

  const b = rows[0];
  if (!b) return null;

  const [ratingRows, serviceOptions, staffOptions] = await Promise.all([
    db.select({ score: rating.score }).from(rating).where(eq(rating.salonId, b.salonId)),
    db
      .select({
        id: service.id,
        name: service.name,
        category: service.category,
        description: service.description,
        durationMinutes: service.durationMinutes,
        price: service.price,
        isActive: service.isActive,
      })
      .from(service)
      .where(and(eq(service.salonId, b.salonId), eq(service.isActive, true))),
    db
      .select({ id: staff.id, name: staff.name, role: staff.role })
      .from(staff)
      .where(
        and(
          eq(staff.salonId, b.salonId),
          eq(staff.isActive, true),
          eq(staff.branchId, branchId),
        ),
      ),
  ]);

  // Fall back to salon-wide staff if none are assigned to this specific branch
  const finalStaff: StaffOption[] =
    staffOptions.length > 0
      ? staffOptions
      : await db
          .select({ id: staff.id, name: staff.name, role: staff.role })
          .from(staff)
          .where(and(eq(staff.salonId, b.salonId), eq(staff.isActive, true)));

  const avg = ratingRows.length
    ? Number((ratingRows.reduce((sum, r) => sum + r.score, 0) / ratingRows.length).toFixed(1))
    : 0;

  return {
    branchId: b.branchId,
    salonId: b.salonId,
    ownerId: b.ownerId,
    name: b.name,
    logoUrl: b.logoUrl,
    description: b.description,
    phone: b.phone,
    area: b.city ?? b.address ?? "",
    address: b.address,
    city: b.city,
    latitude: b.latitude,
    longitude: b.longitude,
    isActive: b.isActive,
    rating: avg,
    reviewCount: ratingRows.length,
    fromPrice: serviceOptions.length
      ? Math.min(...serviceOptions.map((s) => s.price))
      : null,
    services: serviceOptions.map((s) => s.name),
    serviceOptions: serviceOptions as ServiceOption[],
    staff: finalStaff,
  };
}

// ---------------------------------------------------------------------------
// Favorites
// ---------------------------------------------------------------------------

export async function getFavoriteSalonIds(): Promise<string[]> {
  const customer = await customerSession();
  const rows = await db
    .select({ salonId: favorite.salonId })
    .from(favorite)
    .where(eq(favorite.userId, customer.id));
  return rows.map((r) => r.salonId);
}

export async function toggleFavorite(salonId: string) {
  const customer = await customerSession();

  const existing = await db
    .select({ id: favorite.id })
    .from(favorite)
    .where(and(eq(favorite.userId, customer.id), eq(favorite.salonId, salonId)))
    .limit(1);

  if (existing[0]) {
    await db.delete(favorite).where(eq(favorite.id, existing[0].id));
    return { saved: false };
  }

  await db.insert(favorite).values({
    id: crypto.randomUUID(),
    userId: customer.id,
    salonId,
  });
  return { saved: true };
}

// ---------------------------------------------------------------------------
// Availability / slots
// ---------------------------------------------------------------------------

const SLOT_STEP_MINUTES = 30;

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToLabel(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

export async function getAvailableSlots(input: {
  staffId: string;
  date: string; // "YYYY-MM-DD"
  durationMinutes: number;
}): Promise<TimeSlot[]> {
  const day = new Date(`${input.date}T00:00:00`);
  const dayOfWeek = day.getDay();

  const availRows = await db
    .select()
    .from(availability)
    .where(
      and(
        eq(availability.staffId, input.staffId),
        eq(availability.dayOfWeek, dayOfWeek),
        eq(availability.isAvailable, true),
      ),
    )
    .limit(1);

  const window = availRows[0];
  if (!window) return [];

  const startOfDay = new Date(`${input.date}T00:00:00`);
  const endOfDay = new Date(`${input.date}T23:59:59`);

  const existing = await db
    .select({
      appointmentDate: appointment.appointmentDate,
      durationMinutes: appointment.durationMinutes,
    })
    .from(appointment)
    .where(
      and(
        eq(appointment.staffId, input.staffId),
        gte(appointment.appointmentDate, startOfDay),
        lt(appointment.appointmentDate, endOfDay),
        ne(appointment.status, "cancelled"),
      ),
    );

  const busy = existing.map((e) => {
    const start = e.appointmentDate.getHours() * 60 + e.appointmentDate.getMinutes();
    return { start, end: start + e.durationMinutes };
  });

  const startMin = timeToMinutes(window.startTime);
  const endMin = timeToMinutes(window.endTime);

  const slots: TimeSlot[] = [];
  const now = new Date();
  const isToday = day.toDateString() === now.toDateString();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  for (let t = startMin; t + input.durationMinutes <= endMin; t += SLOT_STEP_MINUTES) {
    if (isToday && t <= nowMin) continue;
    const overlaps = busy.some((b) => t < b.end && t + input.durationMinutes > b.start);
    if (!overlaps) {
      slots.push({ time: `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, "0")}`, label: minutesToLabel(t) });
    }
  }

  return slots;
}

// ---------------------------------------------------------------------------
// Booking
// ---------------------------------------------------------------------------

export async function createAppointment(input: {
  branchId: string;
  salonId: string;
  ownerId: string;
  serviceId: string;
  staffId: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM"
  notes?: string;
}) {
  const customer = await customerSession();

  const svc = await db
    .select()
    .from(service)
    .where(eq(service.id, input.serviceId))
    .limit(1);
  if (!svc[0]) throw new Error("Service not found");

  const salonRow = await db
    .select({ name: salon.name })
    .from(salon)
    .where(eq(salon.id, input.salonId))
    .limit(1);
  if (!salonRow[0]) throw new Error("Salon not found");

  const [hh, mm] = input.time.split(":").map(Number);
  const appointmentDate = new Date(`${input.date}T00:00:00`);
  appointmentDate.setHours(hh, mm, 0, 0);

  // Re-check the slot is still free right before booking.
  const freshSlots = await getAvailableSlots({
    staffId: input.staffId,
    date: input.date,
    durationMinutes: svc[0].durationMinutes,
  });
  const stillFree = freshSlots.some((s) => s.time === `${hh}:${mm.toString().padStart(2, "0")}`);
  if (!stillFree) {
    throw new Error("That time was just booked by someone else — please pick another slot");
  }

  const id = crypto.randomUUID();

  await db.insert(appointment).values({
    id,
    userId: input.ownerId,
    customerId: customer.id,
    salonId: input.salonId,
    branchId: input.branchId,
    serviceId: input.serviceId,
    staffId: input.staffId,
    customerName: customer.name,
    serviceName: svc[0].name,
    salonName: salonRow[0].name,
    appointmentDate,
    durationMinutes: svc[0].durationMinutes,
    amount: svc[0].price,
    status: "upcoming",
    notes: input.notes ?? null,
  });

  // Every appointment gets a matching payment record so managers have
  // something real to collect against instead of an empty Payments tab.
  await db.insert(payment).values({
    id: crypto.randomUUID(),
    userId: input.ownerId,
    branchId: input.branchId,
    appointmentId: id,
    customerName: customer.name,
    serviceName: svc[0].name,
    amount: svc[0].price,
    status: "pending",
  });

  revalidatePath("/");
  return { id };
}

export async function getMyAppointments(): Promise<MyAppointment[]> {
  const customer = await customerSession();

  const rows = await db
    .select({
      id: appointment.id,
      salonName: appointment.salonName,
      serviceName: appointment.serviceName,
      staffName: staff.name,
      appointmentDate: appointment.appointmentDate,
      durationMinutes: appointment.durationMinutes,
      amount: appointment.amount,
      status: appointment.status,
      notes: appointment.notes,
      ratingId: rating.id,
    })
    .from(appointment)
    .leftJoin(staff, eq(appointment.staffId, staff.id))
    .leftJoin(rating, eq(rating.appointmentId, appointment.id))
    .where(eq(appointment.customerId, customer.id))
    .orderBy(asc(appointment.appointmentDate));

  return rows.map(({ ratingId, ...rest }) => ({ ...rest, rated: ratingId != null }));
}

// ---------------------------------------------------------------------------
// Ratings
// ---------------------------------------------------------------------------

export async function submitRating(input: {
  appointmentId: string;
  score: number;
  comment?: string;
}) {
  const customer = await customerSession();

  if (!Number.isInteger(input.score) || input.score < 1 || input.score > 5) {
    throw new Error("Rating must be a whole number between 1 and 5");
  }

  const rows = await db
    .select()
    .from(appointment)
    .where(
      and(
        eq(appointment.id, input.appointmentId),
        eq(appointment.customerId, customer.id),
      ),
    )
    .limit(1);

  const appt = rows[0];
  if (!appt) throw new Error("Appointment not found");
  if (appt.status !== "completed") {
    throw new Error("Only completed visits can be rated");
  }

  const existing = await db
    .select({ id: rating.id })
    .from(rating)
    .where(eq(rating.appointmentId, appt.id))
    .limit(1);
  if (existing[0]) {
    throw new Error("This visit has already been rated");
  }

  await db.insert(rating).values({
    id: crypto.randomUUID(),
    userId: appt.userId,
    salonId: appt.salonId,
    branchId: appt.branchId,
    staffId: appt.staffId,
    appointmentId: appt.id,
    customerName: appt.customerName,
    score: input.score,
    comment: input.comment?.trim() || null,
  });

  revalidatePath("/");
}

export async function cancelAppointment(id: string) {
  const customer = await customerSession();
  await db
    .update(appointment)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(and(eq(appointment.id, id), eq(appointment.customerId, customer.id)));

  // Void the matching payment too, unless it's already been settled —
  // a cancelled visit shouldn't sit in "pending, needs collecting" forever.
  await db
    .update(payment)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(
      and(
        eq(payment.appointmentId, id),
        ne(payment.status, "paid"),
        ne(payment.status, "refunded"),
      ),
    );

  revalidatePath("/");
}

// ---------------------------------------------------------------------------
// Preferences & notifications
// ---------------------------------------------------------------------------

export async function getPreferences(): Promise<CustomerPreferences> {
  const customer = await customerSession();
  const rows = await db
    .select()
    .from(preference)
    .where(eq(preference.userId, customer.id))
    .limit(1);

  if (!rows[0]) {
    return { location: null, notificationsEnabled: true, paymentRemindersEnabled: true };
  }
  return {
    location: rows[0].location,
    notificationsEnabled: rows[0].notificationsEnabled,
    paymentRemindersEnabled: rows[0].paymentRemindersEnabled,
  };
}

export async function updatePreferences(input: Partial<CustomerPreferences>) {
  const customer = await customerSession();

  const existing = await db
    .select({ id: preference.id })
    .from(preference)
    .where(eq(preference.userId, customer.id))
    .limit(1);

  if (existing[0]) {
    await db
      .update(preference)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(preference.id, existing[0].id));
    return;
  }

  await db.insert(preference).values({
    id: crypto.randomUUID(),
    userId: customer.id,
    location: input.location ?? null,
    notificationsEnabled: input.notificationsEnabled ?? true,
    paymentRemindersEnabled: input.paymentRemindersEnabled ?? true,
  });
}

export async function getUnreadNotificationCount() {
  const customer = await customerSession();
  const rows = await db
    .select({ id: notification.id })
    .from(notification)
    .where(and(eq(notification.userId, customer.id), eq(notification.isRead, false)));
  return rows.length;
}

export async function markAllNotificationsRead() {
  const customer = await customerSession();
  await db
    .update(notification)
    .set({ isRead: true })
    .where(eq(notification.userId, customer.id));
}
