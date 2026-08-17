import { db } from "@/lib/db";
import { appointment, staff } from "@/lib/db/schema";
import { and, count, countDistinct, eq, gte, lt, sum } from "drizzle-orm";

export async function getManagerAppointments(userId: string) {
  return db
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
    .orderBy(appointment.appointmentDate);
}

export async function getTodayAppointmentCount(
  userId: string,
  startOfToday: Date,
  startOfTomorrow: Date,
) {
  const [result] = await db
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
    );

  return result?.count ?? 0;
}

export async function getUpcomingAppointmentCount(userId: string, now: Date) {
  const [result] = await db
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
    );

  return result?.count ?? 0;
}

export async function getCompletedTodayCount(
  userId: string,
  startOfToday: Date,
  startOfTomorrow: Date,
) {
  const [result] = await db
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
    );

  return result?.count ?? 0;
}

export async function getCancelledTodayCount(
  userId: string,
  startOfToday: Date,
  startOfTomorrow: Date,
) {
  const [result] = await db
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
    );

  return result?.count ?? 0;
}

export async function getTodayRevenue(
  userId: string,
  startOfToday: Date,
  startOfTomorrow: Date,
) {
  const [result] = await db
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
    );

  return Number(result?.total ?? 0);
}

export async function getCustomerCount(userId: string) {
  const [result] = await db
    .select({
      count: countDistinct(appointment.customerId),
    })
    .from(appointment)
    .where(eq(appointment.userId, userId));

  return result?.count ?? 0;
}

export async function getMonthlyRevenue(
  userId: string,
  startOfMonth: Date,
  endDate: Date,
) {
  const rows = await db
    .select({
      date: appointment.appointmentDate,
      revenue: sum(appointment.amount),
    })
    .from(appointment)
    .where(
      and(
        eq(appointment.userId, userId),
        gte(appointment.appointmentDate, startOfMonth),
        lt(appointment.appointmentDate, endDate),
        eq(appointment.status, "completed"),
      ),
    )
    .groupBy(appointment.appointmentDate)
    .orderBy(appointment.appointmentDate);

  return rows.map((item) => ({
    date: item.date.toISOString(),
    revenue: Number(item.revenue ?? 0),
  }));
}
