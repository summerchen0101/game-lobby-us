import { apiRequest } from './client'
import type { ForgotPasswordBody } from './types'

/**
 * Request a password reset email. Callers should show a single generic success
 * message (do not reveal whether the account exists) unless you need
 * stricter error reporting for a known good API.
 */
export async function requestPasswordReset(body: ForgotPasswordBody): Promise<void> {
  await apiRequest<unknown>('/auth/forgot-password', { method: 'POST', body })
}
