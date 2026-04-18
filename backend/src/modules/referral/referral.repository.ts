import { eq, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { users, referrals, userCredits } from '../../db/schema.js'
import type { Referral, UserCredit } from '../../db/schema.js'

export async function findUserById(id: number) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return user ?? null
}

export async function findUserByReferralCode(code: string) {
  const [user] = await db.select().from(users)
    .where(eq(users.referralCode, code.toUpperCase()))
    .limit(1)
  return user ?? null
}

export async function getReferralCode(userId: number): Promise<string> {
  const user = await findUserById(userId)
  if (!user) throw new Error('User not found')
  if (user.referralCode) return user.referralCode

  const code = generateCode(userId)
  await db.update(users)
    .set({ referralCode: code, updatedAt: new Date() })
    .where(eq(users.id, userId))
  return code
}

function generateCode(userId: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const rand = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `MIU${userId}${rand}`.slice(0, 12).toUpperCase()
}

export async function getStats(userId: number) {
  const refs = await db.select().from(referrals).where(eq(referrals.referrerId, userId))
  const credits = await db.select().from(userCredits).where(eq(userCredits.userId, userId))
  const totalCredit = credits.reduce((sum, c) => sum + c.amount, 0)
  return { referralCount: refs.length, totalCredit }
}

export async function hasBeenReferred(referredId: number): Promise<boolean> {
  const [row] = await db.select().from(referrals)
    .where(eq(referrals.referredId, referredId))
    .limit(1)
  return !!row
}

export async function creditReferrer(
  referrerId: number,
  referredId: number,
  creditAmount: number,
): Promise<void> {
  await db.transaction(async (tx) => {
    const [referral] = await tx.insert(referrals).values({
      referrerId,
      referredId,
      creditAmount,
      creditedAt: new Date(),
    }).returning()

    await tx.insert(userCredits).values({
      userId: referrerId,
      amount: creditAmount,
      description: `Giới thiệu thành công (user #${referredId})`,
      referralId: referral.id,
    })

    await tx.update(users)
      .set({ referredById: referrerId, updatedAt: new Date() })
      .where(eq(users.id, referredId))
  })
}
