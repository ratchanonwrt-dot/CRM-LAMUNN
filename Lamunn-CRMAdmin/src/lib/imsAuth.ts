// Branch staff sign in to the IMS with Supabase Auth on the same Supabase project.
// Checking the password there means the CRM accepts exactly the password the branch
// already uses (and follows any change made in the IMS) without storing a copy.
// The anon key is the public client key — it can only do what a signed-out user can.

const TIMEOUT_MS = 6000;

export function imsAuthConfigured(): boolean {
  return !!(process.env.IMS_SUPABASE_URL && process.env.IMS_SUPABASE_ANON_KEY);
}

/** true = IMS accepted this email/password; false = rejected, unreachable or not configured. */
export async function verifyWithIms(email: string, password: string): Promise<boolean> {
  const url = process.env.IMS_SUPABASE_URL;
  const key = process.env.IMS_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = (await res.json().catch(() => null)) as { access_token?: string } | null;
    if (!data?.access_token) return false;
    // We only needed the yes/no — close the IMS session again so nothing lingers there.
    fetch(`${url.replace(/\/$/, "")}/auth/v1/logout`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${data.access_token}` },
      cache: "no-store",
    }).catch(() => {});
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
