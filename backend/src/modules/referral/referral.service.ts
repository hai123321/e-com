import {
  getReferralCode,
  findUserByReferralCode,
  findUserById,
  getStats,
  hasBeenReferred,
  creditReferrer,
} from './referral.repository.js'

const REFERRAL_CREDIT = 20_000

export async function fetchReferralCode(userId: number) {
  const code = await getReferralCode(userId)
  return { code }
}

export async function fetchStats(userId: number) {
  return getStats(userId)
}

export async function applyReferral(referredUserId: number, referralCode: string) {
  const alreadyReferred = await hasBeenReferred(referredUserId)
  if (alreadyReferred) return { alreadyCredited: true }

  const referrer = await findUserByReferralCode(referralCode)
  if (!referrer) throw new Error('Invalid referral code')
  if (referrer.id === referredUserId) throw new Error('Cannot refer yourself')

  await creditReferrer(referrer.id, referredUserId, REFERRAL_CREDIT)
  return { alreadyCredited: false, creditedAmount: REFERRAL_CREDIT }
}
