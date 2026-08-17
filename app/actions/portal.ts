'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { appointment, favorite, notification, payment, preference, rating } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getMyAppointments() {
  const userId = await getUserId()
  return db.select().from(appointment).where(eq(appointment.customerId, userId)).orderBy(desc(appointment.appointmentDate))
}

export async function getManagerAppointments() {
  const userId = await getUserId()
  return db.select().from(appointment).where(eq(appointment.userId, userId)).orderBy(desc(appointment.appointmentDate))
}

export async function createAppointment(input: { salonId: string; branchId?: string; serviceId?: string; staffId?: string; customerName: string; serviceName: string; salonName: string; appointmentDate: Date; durationMinutes?: number; amount?: number; notes?: string }) {
  const userId = await getUserId()
  const id = crypto.randomUUID()
  const created = await db.insert(appointment).values({ ...input, id, userId, customerId: userId, status: 'upcoming' }).returning()
  await db.insert(notification).values({ id: crypto.randomUUID(), userId, title: 'Appointment requested', body: `Your ${input.serviceName} appointment at ${input.salonName} is being processed.` })
  revalidatePath('/')
  revalidatePath('/manager')
  return created[0]
}

export async function updateAppointmentStatus(id: string, status: string) {
  const userId = await getUserId()
  await db.update(appointment).set({ status, updatedAt: new Date() }).where(and(eq(appointment.id, id), eq(appointment.userId, userId)))
  revalidatePath('/manager')
}

export async function cancelMyAppointment(id: string) {
  const userId = await getUserId()
  await db.update(appointment).set({ status: 'cancelled', updatedAt: new Date() }).where(and(eq(appointment.id, id), eq(appointment.customerId, userId)))
  revalidatePath('/')
}

export async function updatePaymentStatus(id: string, status: string) {
  const userId = await getUserId()
  await db.update(payment).set({ status, updatedAt: new Date() }).where(and(eq(payment.id, id), eq(payment.userId, userId)))
  revalidatePath('/manager')
}

export async function toggleFavorite(salonId: string) {
  const userId = await getUserId()
  const existing = await db.select().from(favorite).where(and(eq(favorite.userId, userId), eq(favorite.salonId, salonId)))
  if (existing[0]) await db.delete(favorite).where(and(eq(favorite.id, existing[0].id), eq(favorite.userId, userId)))
  else await db.insert(favorite).values({ id: crypto.randomUUID(), userId, salonId })
  revalidatePath('/')
}

export async function createRating(input: { salonId: string; branchId?: string; customerName: string; score: number; comment?: string }) {
  const userId = await getUserId()
  await db.insert(rating).values({ id: crypto.randomUUID(), userId, ...input })
  revalidatePath('/')
  revalidatePath('/manager')
}

export async function updatePreferences(input: { location?: string; notificationsEnabled?: boolean; paymentRemindersEnabled?: boolean }) {
  const userId = await getUserId()
  const existing = await db.select().from(preference).where(eq(preference.userId, userId))
  if (existing[0]) await db.update(preference).set({ ...input, updatedAt: new Date() }).where(and(eq(preference.id, existing[0].id), eq(preference.userId, userId)))
  else await db.insert(preference).values({ id: crypto.randomUUID(), userId, ...input })
  revalidatePath('/')
}

export async function markNotificationRead(id: string) {
  const userId = await getUserId()
  await db.update(notification).set({ isRead: true }).where(and(eq(notification.id, id), eq(notification.userId, userId)))
  revalidatePath('/')
}
