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

    db.select().from(salon).where(eq(salon.userId, userId)).limit(1),

    db.select().from(branch).where(eq(branch.userId, userId)),

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

    db.select().from(payment).where(eq(payment.userId, userId)),

    db.select().from(rating).where(eq(rating.userId, userId)),

    db.select().from(staff).where(eq(staff.userId, userId)),

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

    db
      .select({
        count: count(),
        total: sum(payment.amount),
      })
      .from(payment)
      .where(and(eq(payment.userId, userId), eq(payment.status, "pending"))),

    db
      .select({
        count: countDistinct(appointment.customerId),
      })
      .from(appointment)
      .where(eq(appointment.userId, userId)),

    db
      .select({
        count: count(),
      })
      .from(staff)
      .where(and(eq(staff.userId, userId), eq(staff.isActive, true))),

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
