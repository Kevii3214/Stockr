const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const isPlaceholder =
  !SUPABASE_URL ||
  SUPABASE_URL.includes('YOUR_PROJECT_ID') ||
  !SUPABASE_KEY ||
  SUPABASE_KEY.includes('your-anon-key');

export function friendlyAuthError(message: string): string {
  if (isPlaceholder) {
    return 'App is not connected to a database yet. Add your Supabase credentials to .env and restart the server.';
  }

  const lower = message.toLowerCase();

  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network request failed')) {
    return 'Could not reach the server. Check your internet connection and try again.';
  }
  if (lower.includes('invalid login credentials') || lower.includes('invalid email or password')) {
    return 'Incorrect email or password.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Please confirm your email before signing in. Check your inbox.';
  }
  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (lower.includes('password should be at least')) {
    return 'Password must be at least 6 characters.';
  }
  if (lower.includes('unable to validate email address') || lower.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (lower.includes('signup is disabled')) {
    return 'New sign-ups are currently disabled. Contact support.';
  }

  return message;
}
