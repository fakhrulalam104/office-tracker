export function getAuthSecret() {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
}

export function getAuthUrl() {
  return process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
}

export function getMetadataBaseUrl() {
  return getAuthUrl() ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
}
