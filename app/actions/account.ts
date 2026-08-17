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
