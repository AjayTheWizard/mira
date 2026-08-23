"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  appointment,
  branch,
  notification,
  payment,
  rating,
  salon,
  service,
  staff,
  user,
} from "@/lib/db/schema";
import {
  and,
  count,
  countDistinct,
  eq,
  gte,
  isNotNull,
  lt,
  ne,
  sql,
  sum,
} from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

const APPOINTMENT_STATUSES = new Set([
  "upcoming",
  "confirmed",
  "arrived",
  "completed",
  "cancelled",
]);

// Copy sent to the customer as an in-app notification when their
// appointment status changes. Statuses without an entry here (e.g.
// "confirmed") don't generate a notification.
const STATUS_NOTIFICATION_COPY: Record<
  string,
  (salonName: string, serviceName: string) => { title: string; body: string }
> = {
  arrived: (salonName, serviceName) => ({
    title: "You're checked in",
    body: `You're checked in at ${salonName} for ${serviceName}. Your stylist will be with you shortly.`,
  }),
  cancelled: (salonName, serviceName) => ({
    title: "Appointment cancelled",
    body: `Your ${serviceName} appointment at ${salonName} was cancelled by the salon.`,
  }),
  completed: (salonName, serviceName) => ({
    title: "Visit completed",
    body: `Thanks for visiting ${salonName}! We hope to see you again soon.`,
  }),
};

async function managerId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return session.user.id;
}
export async function getStaff() {
  const userId = await managerId();

  const rows = await db
    .select({
      id: staff.id,
      userId: staff.userId,
      salonId: staff.salonId,
      branchId: staff.branchId,
      name: staff.name,
      role: staff.role,
      email: staff.email,
      phone: staff.phone,
      isActive: staff.isActive,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
      salonName: salon.name,
    })
    .from(staff)
    .leftJoin(salon, eq(staff.salonId, salon.id))
    .where(eq(staff.userId, userId))
    .orderBy(staff.name);

  return rows;
}

export async function createStaff(input: {
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  branchId?: string;
}) {
  const userId = await managerId();

  if (!input.name?.trim()) {
    throw new Error("Staff name is required");
  }

  const existingSalon = await db
    .select()
    .from(salon)
    .where(eq(salon.userId, userId))
    .limit(1);

  if (!existingSalon[0]) {
    throw new Error("Create a salon before adding staff");
  }

  const salonId = existingSalon[0].id;

  const name = input.name.trim();
  const email = input.email?.trim().toLowerCase() || null;

  // Check duplicate name
  const existingName = await db
    .select({
      id: staff.id,
    })
    .from(staff)
    .where(and(eq(staff.salonId, salonId), eq(staff.name, name)))
    .limit(1);

  if (existingName.length > 0) {
    throw new Error("A staff member with this name already exists");
  }

  // Check duplicate email
  if (email) {
    const existingEmail = await db
      .select({
        id: staff.id,
      })
      .from(staff)
      .where(and(eq(staff.salonId, salonId), eq(staff.email, email)))
      .limit(1);

    if (existingEmail.length > 0) {
      throw new Error("A staff member with this email already exists");
    }
  }

  await db.insert(staff).values({
    id: crypto.randomUUID(),
    userId,
    salonId,
    branchId: input.branchId || null,
    name,
    role: input.role?.trim() || null,
    email,
    phone: input.phone?.trim() || null,
  });

  return {
    success: true,
  };
}

export async function updateStaff(
  id: string,
  input: Partial<{
    name: string;
    role: string;
    email: string;
    phone: string;
    branchId: string;
  }>,
) {
  const userId = await managerId();

  await db
    .update(staff)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(staff.id, id), eq(staff.userId, userId)));
}

export async function toggleStaffActive(id: string, isActive: boolean) {
  const userId = await managerId();

  await db
    .update(staff)
    .set({ isActive, updatedAt: new Date() })
    .where(and(eq(staff.id, id), eq(staff.userId, userId)));
}

export async function deleteStaff(id: string) {
  const userId = await managerId();

  await db.delete(staff).where(and(eq(staff.id, id), eq(staff.userId, userId)));
}

export async function getBranches() {
  const userId = await managerId();

  return db
    .select({
      id: branch.id,
      name: branch.name,
      address: branch.address,
      city: branch.city,
      isActive: branch.isActive,
    })
    .from(branch)
    .where(eq(branch.userId, userId))
    .orderBy(branch.name);
}

export async function getSalon() {
  const userId = await managerId();

  const rows = await db
    .select()
    .from(salon)
    .where(eq(salon.userId, userId))
    .limit(1);

  return rows[0] ?? null;
}

export async function updateSalon(input: {
  name: string;
  description: string;
  phone: string;
  email: string;
}) {
  const userId = await managerId();

  const existing = await db
    .select()
    .from(salon)
    .where(eq(salon.userId, userId))
    .limit(1);

  if (existing[0]) {
    await db
      .update(salon)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(and(eq(salon.id, existing[0].id), eq(salon.userId, userId)));

    return;
  }

  await db.insert(salon).values({
    id: crypto.randomUUID(),
    userId,
    name: input.name,
    description: input.description,
    phone: input.phone,
    email: input.email,
  });
}

export async function createBranch(input: {
  name: string;
  address: string;
  city: string;
  phone?: string;
  latitude: string;
  longitude: string;
  placeId: string;
}) {
  const userId = await managerId();

  const existing = await db
    .select()
    .from(salon)
    .where(eq(salon.userId, userId))
    .limit(1);

  const salonId = existing[0]?.id ?? crypto.randomUUID();

  if (!existing[0]) {
    await db.insert(salon).values({
      id: salonId,
      userId,
      name: "My Salon",
    });
  }

  await db.insert(branch).values({
    id: crypto.randomUUID(),
    userId,
    salonId,
    name: input.name,
    address: input.address,
    city: input.city,
    phone: input.phone ?? null,
    latitude: Number(input.latitude),
    longitude: Number(input.longitude),
    placeId: input.placeId,
  });
}
export async function updatePaymentStatus(id: string, status: string) {
  const userId = await managerId();

  await db
    .update(payment)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(and(eq(payment.id, id), eq(payment.userId, userId)));
}

export async function updateAppointmentStatus(id: string, status: string) {
  const userId = await managerId();

  if (!APPOINTMENT_STATUSES.has(status)) {
    throw new Error("Invalid appointment status");
  }

  const [existing] = await db
    .select({
      customerId: appointment.customerId,
      salonName: appointment.salonName,
      serviceName: appointment.serviceName,
    })
    .from(appointment)
    .where(and(eq(appointment.id, id), eq(appointment.userId, userId)))
    .limit(1);

  if (!existing) {
    throw new Error("Appointment not found");
  }

  await db
    .update(appointment)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(appointment.id, id), eq(appointment.userId, userId)));

  if (status === "cancelled") {
    // Void the matching payment too, unless it's already been settled.
    await db
      .update(payment)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(
        and(
          eq(payment.appointmentId, id),
          eq(payment.userId, userId),
          ne(payment.status, "paid"),
          ne(payment.status, "refunded"),
        ),
      );
  }

  // Let the customer know the moment their visit status changes — this is
  // what powers the notification bell on the customer portal.
  const copy = STATUS_NOTIFICATION_COPY[status]?.(
    existing.salonName,
    existing.serviceName,
  );

  if (copy) {
    await db.insert(notification).values({
      id: crypto.randomUUID(),
      userId: existing.customerId,
      title: copy.title,
      body: copy.body,
    });
  }

  revalidatePath("/manager");
  revalidatePath("/");
}

export async function updatePaymentMethod(id: string, method: string) {
  const userId = await managerId();

  await db
    .update(payment)
    .set({ method: method || null, updatedAt: new Date() })
    .where(and(eq(payment.id, id), eq(payment.userId, userId)));

  revalidatePath("/manager");
}

export async function createManagerAppointment(input: {
  customerName: string;
  branchId?: string;
  serviceId: string;
  staffId?: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:mm
  notes?: string;
}) {
  const userId = await managerId();

  const customerName = input.customerName?.trim();
  if (!customerName) {
    throw new Error("Customer name is required");
  }

  if (!input.appointmentDate || !input.appointmentTime) {
    throw new Error("Date and time are required");
  }

  const appointmentDate = new Date(
    `${input.appointmentDate}T${input.appointmentTime}:00`,
  );

  if (Number.isNaN(appointmentDate.getTime())) {
    throw new Error("Invalid date or time");
  }

  const [existingSalon] = await db
    .select()
    .from(salon)
    .where(eq(salon.userId, userId))
    .limit(1);

  if (!existingSalon) {
    throw new Error("Create a salon before adding appointments");
  }

  const [selectedService] = await db
    .select()
    .from(service)
    .where(and(eq(service.id, input.serviceId), eq(service.userId, userId)))
    .limit(1);

  if (!selectedService) {
    throw new Error("Select a valid service");
  }

  const appointmentId = crypto.randomUUID();

  await db.insert(appointment).values({
    id: appointmentId,
    userId,
    // Walk-in / manager-created bookings aren't tied to a customer account.
    customerId: crypto.randomUUID(),
    salonId: existingSalon.id,
    branchId: input.branchId || null,
    serviceId: selectedService.id,
    staffId: input.staffId || null,
    customerName,
    serviceName: selectedService.name,
    salonName: existingSalon.name,
    appointmentDate,
    durationMinutes: selectedService.durationMinutes,
    amount: selectedService.price,
    status: "upcoming",
    notes: input.notes?.trim() || null,
  });

  await db.insert(payment).values({
    id: crypto.randomUUID(),
    userId,
    branchId: input.branchId || null,
    appointmentId,
    customerName,
    serviceName: selectedService.name,
    amount: selectedService.price,
    status: "pending",
  });

  revalidatePath("/manager");

  return { success: true };
}

export async function getManagerDashboard(userId: string) {
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    manager,
    salonData,
    branches,
    appointments,
    payments,
    ratings,
    staffs,
    todayStats,
    upcomingStats,
    completedTodayStats,
    cancelledStats,
    revenueStats,
    pendingPaymentStats,
    totalPaymentStats,
    customerStats,
    staffStats,
    monthlyRevenue,
  ] = await Promise.all([
    // Manager
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1),

    // Salon
    db.select().from(salon).where(eq(salon.userId, userId)).limit(1),

    // Branches
    db.select().from(branch).where(eq(branch.userId, userId)),

    // Appointments
    db
      .select({
        id: appointment.id,
        customerId: appointment.customerId,
        customerName: appointment.customerName,
        salonName: appointment.salonName,
        serviceName: appointment.serviceName,
        appointmentDate: appointment.appointmentDate,
        durationMinutes: appointment.durationMinutes,
        amount: appointment.amount,
        status: appointment.status,
        notes: appointment.notes,
        staffId: appointment.staffId,
        staffName: staff.name,
      })
      .from(appointment)
      .leftJoin(staff, eq(appointment.staffId, staff.id))
      .where(eq(appointment.userId, userId))
      .orderBy(appointment.appointmentDate),

    // Payments
    db.select().from(payment).where(eq(payment.userId, userId)),

    // Ratings
    db.select().from(rating).where(eq(rating.userId, userId)),

    // Staff
    db.select().from(staff).where(eq(staff.userId, userId)),

    // Today's appointments
    db
      .select({
        count: count(),
      })
      .from(appointment)
      .where(
        and(
          eq(appointment.userId, userId),
          gte(appointment.appointmentDate, startOfToday),
          lt(appointment.appointmentDate, startOfTomorrow),
        ),
      ),

    // Upcoming appointments
    db
      .select({
        count: count(),
      })
      .from(appointment)
      .where(
        and(
          eq(appointment.userId, userId),
          gte(appointment.appointmentDate, now),
          eq(appointment.status, "upcoming"),
        ),
      ),

    // Completed today
    db
      .select({
        count: count(),
      })
      .from(appointment)
      .where(
        and(
          eq(appointment.userId, userId),
          gte(appointment.appointmentDate, startOfToday),
          lt(appointment.appointmentDate, startOfTomorrow),
          eq(appointment.status, "completed"),
        ),
      ),

    // Cancelled today
    db
      .select({
        count: count(),
      })
      .from(appointment)
      .where(
        and(
          eq(appointment.userId, userId),
          gte(appointment.appointmentDate, startOfToday),
          lt(appointment.appointmentDate, startOfTomorrow),
          eq(appointment.status, "cancelled"),
        ),
      ),

    // Revenue today — money actually collected (paid payments), not just
    // the value of appointments marked completed.
    db
      .select({
        total: sum(payment.amount),
      })
      .from(payment)
      .innerJoin(appointment, eq(payment.appointmentId, appointment.id))
      .where(
        and(
          eq(payment.userId, userId),
          eq(payment.status, "paid"),
          gte(appointment.appointmentDate, startOfToday),
          lt(appointment.appointmentDate, startOfTomorrow),
        ),
      ),

    // Pending payments
    db
      .select({
        count: count(),
        total: sum(payment.amount),
      })
      .from(payment)
      .where(and(eq(payment.userId, userId), eq(payment.status, "pending"))),

    // Total payments (all statuses), used to size the pending-payments bar
    db
      .select({
        total: sum(payment.amount),
      })
      .from(payment)
      .where(eq(payment.userId, userId)),

    // Unique customers
    db
      .select({
        count: countDistinct(appointment.customerId),
      })
      .from(appointment)
      .where(eq(appointment.userId, userId)),

    // Active staff count
    db
      .select({
        count: count(),
      })
      .from(staff)
      .where(and(eq(staff.userId, userId), eq(staff.isActive, true))),

    // Revenue by calendar day — same "paid payments only" rule as today's
    // revenue, grouped per day so the chart reflects money actually earned.
    db
      .select({
        date: sql<string>`date(${appointment.appointmentDate})`,
        revenue: sum(payment.amount),
      })
      .from(payment)
      .innerJoin(appointment, eq(payment.appointmentId, appointment.id))
      .where(
        and(
          eq(payment.userId, userId),
          eq(payment.status, "paid"),
          gte(appointment.appointmentDate, startOfMonth),
          lt(appointment.appointmentDate, startOfTomorrow),
        ),
      )
      .groupBy(sql`date(${appointment.appointmentDate})`)
      .orderBy(sql`date(${appointment.appointmentDate})`),
  ]);

  return {
    manager: manager[0] ?? null,

    salon: salonData[0] ?? null,

    branches,

    appointments,

    payments,

    ratings,

    staffs,

    stats: {
      todayAppointments: todayStats[0]?.count ?? 0,

      upcomingAppointments: upcomingStats[0]?.count ?? 0,

      completedToday: completedTodayStats[0]?.count ?? 0,

      cancelledToday: cancelledStats[0]?.count ?? 0,

      todayRevenue: Number(revenueStats[0]?.total ?? 0),

      pendingPaymentCount: pendingPaymentStats[0]?.count ?? 0,

      pendingPaymentAmount: Number(pendingPaymentStats[0]?.total ?? 0),

      pendingPaymentPercentage: (() => {
        const pending = Number(pendingPaymentStats[0]?.total ?? 0);
        const total = Number(totalPaymentStats[0]?.total ?? 0);
        return total > 0 ? Math.round((pending / total) * 100) : 0;
      })(),

      customers: customerStats[0]?.count ?? 0,

      staff: staffStats[0]?.count ?? 0,
    },

    monthlyRevenue: monthlyRevenue.map((item) => ({
      date: item.date,
      revenue: Number(item.revenue ?? 0),
    })),
  };
}

// ---------------------------------------------------------------------------
// Ratings — per-staff and per-branch breakdowns
// ---------------------------------------------------------------------------

export async function getStaffRatings() {
  const userId = await managerId();

  const rows = await db
    .select({
      staffId: rating.staffId,
      staffName: staff.name,
      average: sql<string>`avg(${rating.score})`,
      count: count(rating.id),
    })
    .from(rating)
    .innerJoin(staff, eq(staff.id, rating.staffId))
    .where(and(eq(rating.userId, userId), isNotNull(rating.staffId)))
    .groupBy(rating.staffId, staff.name);

  return rows.map((r) => ({
    staffId: r.staffId as string,
    staffName: r.staffName,
    average: Number(Number(r.average).toFixed(1)),
    count: r.count,
  }));
}

export async function getBranchRatings() {
  const userId = await managerId();

  const rows = await db
    .select({
      branchId: rating.branchId,
      branchName: branch.name,
      average: sql<string>`avg(${rating.score})`,
      count: count(rating.id),
    })
    .from(rating)
    .innerJoin(branch, eq(branch.id, rating.branchId))
    .where(and(eq(rating.userId, userId), isNotNull(rating.branchId)))
    .groupBy(rating.branchId, branch.name);

  return rows.map((r) => ({
    branchId: r.branchId as string,
    branchName: r.branchName,
    average: Number(Number(r.average).toFixed(1)),
    count: r.count,
  }));
}
