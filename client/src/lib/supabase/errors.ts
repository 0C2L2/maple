export function authErrorMessage(error: unknown): string {
  const value = error as { code?: string; status?: number; name?: string } | null;
  if (value?.code === 'otp_expired') return 'That code is invalid or has expired. Check the code or request a new one.';
  if (value?.status === 429 || value?.code === 'over_email_send_rate_limit' || value?.code === 'over_request_rate_limit') {
    return 'Too many requests. Please wait before trying again.';
  }
  if (value?.name === 'AuthRetryableFetchError' || error instanceof TypeError) {
    return 'Unable to connect. Check your connection and try again.';
  }
  return 'We could not complete that request. Please try again.';
}
