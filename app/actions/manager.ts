"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  appointment,
  branch,
  payment,
  rating,
  salon,
  staff,
  user,
} from "@/lib/db/schema";
import { and, count, countDistinct, eq, gte, lt, sum } from "drizzle-orm";
import { headers } from "next/headers";

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

  await db.insert(staff).values({
    id: crypto.randomUUID(),
    userId,
    salonId: existingSalon[0].id,
    branchId: input.branchId || null,
    name: input.name,
    role: input.role || null,
    email: input.email || null,
    phone: input.phone || null,
  });
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
  phone: string;
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
    phone: input.phone,
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

    // Revenue today
    db
      .select({
        total: sum(appointment.amount),
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

    // Pending payments
    db
      .select({
        count: count(),
        total: sum(payment.amount),
      })
      .from(payment)
      .where(and(eq(payment.userId, userId), eq(payment.status, "pending"))),

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

    // Revenue by appointment date
    db
      .select({
        date: appointment.appointmentDate,
        revenue: sum(appointment.amount),
      })
      .from(appointment)
      .where(
        and(
          eq(appointment.userId, userId),
          gte(appointment.appointmentDate, startOfMonth),
          lt(appointment.appointmentDate, startOfTomorrow),
          eq(appointment.status, "completed"),
        ),
      )
      .groupBy(appointment.appointmentDate)
      .orderBy(appointment.appointmentDate),
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

      customers: customerStats[0]?.count ?? 0,

      staff: staffStats[0]?.count ?? 0,
    },

    monthlyRevenue: monthlyRevenue.map((item) => ({
      date: item.date.toISOString(),
      revenue: Number(item.revenue ?? 0),
    })),
  };
}
