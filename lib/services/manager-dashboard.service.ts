import { getManagerAppointments } from "@/lib/queries/manager/appointment.query";
import {
  getCancelledTodayCount,
  getCompletedTodayCount,
  getCustomerCount,
  getMonthlyRevenue,
  getTodayAppointmentCount,
  getTodayRevenue,
  getUpcomingAppointmentCount,
} from "@/lib/queries/manager/appointment.query";

import {
  getManagerBranches,
  getManagerSalon,
} from "@/lib/queries/manager/salon.query";

import { getManagerById } from "@/lib/queries/manager/manager.query";

import {
  getManagerPayments,
  getPendingPaymentStats,
} from "@/lib/queries/manager/payment.query";

import {
  getActiveStaffCount,
  getManagerStaff,
} from "@/lib/queries/manager/staff.query";

import { getManagerRatings } from "@/lib/queries/manager/rating.query";

export async function getManagerDashboard(userId: string) {
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    manager,
    salon,
    branches,
    appointments,
    payments,
    ratings,
    staffs,

    todayAppointments,
    upcomingAppointments,
    completedToday,
    cancelledToday,
    todayRevenue,
    pendingPayments,
    customers,
    activeStaff,
    monthlyRevenue,
  ] = await Promise.all([
    // Base data
    getManagerById(userId),
    getManagerSalon(userId),
    getManagerBranches(userId),
    getManagerAppointments(userId),
    getManagerPayments(userId),
    getManagerRatings(userId),
    getManagerStaff(userId),

    // Dashboard stats
    getTodayAppointmentCount(userId, startOfToday, startOfTomorrow),

    getUpcomingAppointmentCount(userId, now),

    getCompletedTodayCount(userId, startOfToday, startOfTomorrow),

    getCancelledTodayCount(userId, startOfToday, startOfTomorrow),

    getTodayRevenue(userId, startOfToday, startOfTomorrow),

    getPendingPaymentStats(userId),

    getCustomerCount(userId),

    getActiveStaffCount(userId),

    getMonthlyRevenue(userId, startOfMonth, startOfTomorrow),
  ]);

  return {
    manager,
    salon,
    branches,
    appointments,
    payments,
    ratings,
    staffs,

    stats: {
      todayAppointments,
      upcomingAppointments,
      completedToday,
      cancelledToday,
      todayRevenue,

      pendingPaymentCount: pendingPayments.count,
      pendingPaymentAmount: pendingPayments.total,

      customers,
      staff: activeStaff,
    },

    monthlyRevenue,
  };
}
