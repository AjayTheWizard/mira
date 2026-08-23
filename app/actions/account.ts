'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'

export async function setAccountRole(role: 'customer' | 'manager') {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  await db.update(user).set({ role, updatedAt: new Date() }).where(eq(user.id, session.user.id))
  return role
}

export async function updateAccountProfile(input: { name: string; email: string }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')

  const name = input.name?.trim()
  const email = input.email?.trim().toLowerCase()

  if (!name) throw new Error('Name is required')
  if (!email || !email.includes('@')) throw new Error('A valid email is required')

  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1)

  if (existing && existing.id !== session.user.id) {
    throw new Error('That email is already in use')
  }

  await db
    .update(user)
    .set({ name, email, updatedAt: new Date() })
    .where(eq(user.id, session.user.id))

  return { name, email }
}
