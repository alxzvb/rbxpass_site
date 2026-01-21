import { getTokenFromHeadersOrCookies, verifyAdminToken } from "@/lib/auth";

function getEnvAdminPassword(): string | undefined {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return env?.ADMIN_PASSWORD;
}

export function verifyAdminRequest(headers: Headers, bodyPassword?: string | null): boolean {
  const token = getTokenFromHeadersOrCookies(headers);
  if (verifyAdminToken(token).ok) return true;

  const expected = getEnvAdminPassword();
  if (!expected) return false;
  const headerValue = headers.get("x-admin-password") ?? headers.get("authorization");
  const bearer = headerValue ? headerValue.replace(/^Bearer\s+/i, "") : null;
  const provided = bodyPassword ?? bearer;

  return Boolean(provided && provided === expected);
}

